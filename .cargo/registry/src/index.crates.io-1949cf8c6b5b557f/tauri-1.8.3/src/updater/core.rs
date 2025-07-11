// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use super::error::{Error, Result};
#[cfg(desktop)]
use crate::api::file::{ArchiveFormat, Extract, Move};
use crate::{
  api::http::{ClientBuilder, HttpRequestBuilder},
  AppHandle, Manager, Runtime,
};
use base64::Engine;
use http::{
  header::{self, HeaderName, HeaderValue},
  HeaderMap, StatusCode,
};
use minisign_verify::{PublicKey, Signature};
use percent_encoding::{AsciiSet, CONTROLS};
use semver::Version;
use serde::{de::Error as DeError, Deserialize, Deserializer, Serialize};
use tauri_utils::{platform::current_exe, Env};
use time::OffsetDateTime;
#[cfg(feature = "tracing")]
use tracing::Instrument;
use url::Url;

use std::{
  collections::HashMap,
  env,
  fmt::{self},
  io::Cursor,
  path::{Path, PathBuf},
  str::{from_utf8, FromStr},
  time::Duration,
};

#[cfg(any(target_os = "linux", windows))]
use std::ffi::OsStr;

#[cfg(all(desktop, not(target_os = "windows")))]
use crate::api::file::Compression;

#[cfg(target_os = "windows")]
use std::process::{exit, Command};

const UPDATER_USER_AGENT: &str = "tauri/updater";

type ShouldInstall = dyn FnOnce(&Version, &RemoteRelease) -> bool + Send;

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum RemoteReleaseInner {
  Dynamic(ReleaseManifestPlatform),
  Static {
    platforms: HashMap<String, ReleaseManifestPlatform>,
  },
}

/// Information about a release returned by the remote update server.
///
/// This type can have one of two shapes: Server Format (Dynamic Format) and Static Format.
#[derive(Debug)]
pub struct RemoteRelease {
  /// Version to install.
  version: Version,
  /// Release notes.
  notes: Option<String>,
  /// Release date.
  pub_date: Option<OffsetDateTime>,
  /// Release data.
  data: RemoteReleaseInner,
}

impl<'de> Deserialize<'de> for RemoteRelease {
  fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    #[derive(Deserialize)]
    struct InnerRemoteRelease {
      #[serde(alias = "name", deserialize_with = "parse_version")]
      version: Version,
      notes: Option<String>,
      pub_date: Option<String>,
      platforms: Option<HashMap<String, ReleaseManifestPlatform>>,
      // dynamic platform response
      url: Option<Url>,
      signature: Option<String>,
      #[cfg(target_os = "windows")]
      #[serde(default)]
      with_elevated_task: bool,
    }

    let release = InnerRemoteRelease::deserialize(deserializer)?;

    let pub_date = if let Some(date) = release.pub_date {
      Some(
        OffsetDateTime::parse(&date, &time::format_description::well_known::Rfc3339)
          .map_err(|e| DeError::custom(format!("invalid value for `pub_date`: {e}")))?,
      )
    } else {
      None
    };

    Ok(RemoteRelease {
      version: release.version,
      notes: release.notes,
      pub_date,
      data: if let Some(platforms) = release.platforms {
        RemoteReleaseInner::Static { platforms }
      } else {
        RemoteReleaseInner::Dynamic(ReleaseManifestPlatform {
          url: release.url.ok_or_else(|| {
            DeError::custom("the `url` field was not set on the updater response")
          })?,
          signature: release.signature.ok_or_else(|| {
            DeError::custom("the `signature` field was not set on the updater response")
          })?,
          #[cfg(target_os = "windows")]
          with_elevated_task: release.with_elevated_task,
        })
      },
    })
  }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ReleaseManifestPlatform {
  /// Download URL for the platform
  pub url: Url,
  /// Signature for the platform
  pub signature: String,
  #[cfg(target_os = "windows")]
  #[serde(default)]
  /// Optional: Windows only try to use elevated task
  pub with_elevated_task: bool,
}

fn parse_version<'de, D>(deserializer: D) -> std::result::Result<Version, D::Error>
where
  D: serde::Deserializer<'de>,
{
  let str = String::deserialize(deserializer)?;

  Version::from_str(str.trim_start_matches('v')).map_err(serde::de::Error::custom)
}

impl RemoteRelease {
  /// The release version.
  pub fn version(&self) -> &Version {
    &self.version
  }

  /// The release notes.
  pub fn notes(&self) -> Option<&String> {
    self.notes.as_ref()
  }

  /// The release date.
  pub fn pub_date(&self) -> Option<&OffsetDateTime> {
    self.pub_date.as_ref()
  }

  /// The release's download URL for the given target.
  pub fn download_url(&self, target: &str) -> Result<&Url> {
    match self.data {
      RemoteReleaseInner::Dynamic(ref platform) => Ok(&platform.url),
      RemoteReleaseInner::Static { ref platforms } => platforms
        .get(target)
        .map_or(Err(Error::TargetNotFound(target.to_string())), |p| {
          Ok(&p.url)
        }),
    }
  }

  /// The release's signature for the given target.
  pub fn signature(&self, target: &str) -> Result<&String> {
    match self.data {
      RemoteReleaseInner::Dynamic(ref platform) => Ok(&platform.signature),
      RemoteReleaseInner::Static { ref platforms } => platforms
        .get(target)
        .map_or(Err(Error::TargetNotFound(target.to_string())), |platform| {
          Ok(&platform.signature)
        }),
    }
  }

  #[cfg(target_os = "windows")]
  /// Optional: Windows only try to use elevated task
  pub fn with_elevated_task(&self, target: &str) -> Result<bool> {
    match self.data {
      RemoteReleaseInner::Dynamic(ref platform) => Ok(platform.with_elevated_task),
      RemoteReleaseInner::Static { ref platforms } => platforms
        .get(target)
        .map_or(Err(Error::TargetNotFound(target.to_string())), |platform| {
          Ok(platform.with_elevated_task)
        }),
    }
  }
}

pub(crate) struct UpdateBuilder<R: Runtime> {
  /// Application handle.
  pub app: AppHandle<R>,
  /// Current version we are running to compare with announced version
  pub current_version: Version,
  /// The URLs to checks updates. We suggest at least one fallback on a different domain.
  pub urls: Vec<String>,
  /// The platform the updater will check and install the update. Default is from `get_updater_target`
  pub target: Option<String>,
  /// The current executable path. Default is automatically extracted.
  pub executable_path: Option<PathBuf>,
  should_install: Option<Box<ShouldInstall>>,
  timeout: Option<Duration>,
  headers: HeaderMap,
}

impl<R: Runtime> fmt::Debug for UpdateBuilder<R> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("UpdateBuilder")
      .field("app", &self.app)
      .field("current_version", &self.current_version)
      .field("urls", &self.urls)
      .field("target", &self.target)
      .field("executable_path", &self.executable_path)
      .field("timeout", &self.timeout)
      .field("headers", &self.headers)
      .finish()
  }
}

// Create new updater instance and return an Update
impl<R: Runtime> UpdateBuilder<R> {
  pub fn new(app: AppHandle<R>) -> Self {
    UpdateBuilder {
      app,
      urls: Vec::new(),
      target: None,
      executable_path: None,
      // safe to unwrap: CARGO_PKG_VERSION is also a valid semver value
      current_version: env!("CARGO_PKG_VERSION").parse().unwrap(),
      should_install: None,
      timeout: None,
      headers: Default::default(),
    }
  }

  #[allow(dead_code)]
  pub fn url(mut self, url: String) -> Self {
    self.urls.push(
      percent_encoding::percent_decode(url.as_bytes())
        .decode_utf8_lossy()
        .to_string(),
    );
    self
  }

  /// Add multiple URLs at once inside a Vec for future reference
  pub fn urls(mut self, urls: &[String]) -> Self {
    self.urls.extend(urls.iter().map(|url| {
      percent_encoding::percent_decode(url.as_bytes())
        .decode_utf8_lossy()
        .to_string()
    }));
    self
  }

  /// Set the current app version, used to compare against the latest available version.
  /// The `cargo_crate_version!` macro can be used to pull the version from your `Cargo.toml`
  pub fn current_version(mut self, ver: Version) -> Self {
    self.current_version = ver;
    self
  }

  /// Set the target name. Represents the string that is looked up on the updater API or response JSON.
  pub fn target(mut self, target: impl Into<String>) -> Self {
    self.target.replace(target.into());
    self
  }

  /// Set the executable path
  #[allow(dead_code)]
  pub fn executable_path<A: AsRef<Path>>(mut self, executable_path: A) -> Self {
    self.executable_path = Some(PathBuf::from(executable_path.as_ref()));
    self
  }

  pub fn should_install<F: FnOnce(&Version, &RemoteRelease) -> bool + Send + 'static>(
    mut self,
    f: F,
  ) -> Self {
    self.should_install.replace(Box::new(f));
    self
  }

  pub fn timeout(mut self, timeout: Duration) -> Self {
    self.timeout.replace(timeout);
    self
  }

  /// Add a `Header` to the request.
  pub fn header<K, V>(mut self, key: K, value: V) -> Result<Self>
  where
    HeaderName: TryFrom<K>,
    <HeaderName as TryFrom<K>>::Error: Into<http::Error>,
    HeaderValue: TryFrom<V>,
    <HeaderValue as TryFrom<V>>::Error: Into<http::Error>,
  {
    let key: std::result::Result<HeaderName, http::Error> = key.try_into().map_err(Into::into);
    let value: std::result::Result<HeaderValue, http::Error> = value.try_into().map_err(Into::into);
    self.headers.insert(key?, value?);
    Ok(self)
  }

  #[cfg_attr(
    feature = "tracing",
    tracing::instrument("updater::check", skip_all, fields(arch, target), ret, err)
  )]
  pub async fn build(mut self) -> Result<Update<R>> {
    let mut remote_release: Option<RemoteRelease> = None;

    // make sure we have at least one url
    if self.urls.is_empty() {
      return Err(Error::Builder(
        "Unable to check update, `url` is required.".into(),
      ));
    };

    // If no executable path provided, we use current_exe from tauri_utils
    let executable_path = self.executable_path.unwrap_or(current_exe()?);

    let arch = get_updater_arch().ok_or(Error::UnsupportedArch)?;
    // `target` is the `{{target}}` variable we replace in the endpoint
    // `json_target` is the value we search if the updater server returns a JSON with the `platforms` object
    let (target, json_target) = if let Some(target) = self.target {
      (target.clone(), target)
    } else {
      let target = get_updater_target().ok_or(Error::UnsupportedOs)?;
      (target.to_string(), format!("{target}-{arch}"))
    };

    #[cfg(feature = "tracing")]
    {
      tracing::Span::current().record("arch", arch);
      tracing::Span::current().record("target", &target);
    }

    // Get the extract_path from the provided executable_path
    let extract_path = extract_path_from_executable(&self.app.state::<Env>(), &executable_path);

    // Set SSL certs for linux if they aren't available.
    // We do not require to recheck in the download_and_install as we use
    // ENV variables, we can expect them to be set for the second call.
    #[cfg(target_os = "linux")]
    {
      if env::var_os("SSL_CERT_FILE").is_none() {
        env::set_var("SSL_CERT_FILE", "/etc/ssl/certs/ca-certificates.crt");
      }
      if env::var_os("SSL_CERT_DIR").is_none() {
        env::set_var("SSL_CERT_DIR", "/etc/ssl/certs");
      }
    }

    // we want JSON only
    let mut headers = self.headers;
    headers.insert(header::ACCEPT, HeaderValue::from_str("application/json")?);

    // Allow fallback if more than 1 urls is provided
    let mut last_error: Option<Error> = None;
    for url in &self.urls {
      // replace {{current_version}}, {{target}} and {{arch}} in the provided URL
      // this is useful if we need to query example
      // https://releases.myapp.com/update/{{target}}/{{arch}}/{{current_version}}
      // will be translated into ->
      // https://releases.myapp.com/update/darwin/aarch64/1.0.0
      // The main objective is if the update URL is defined via the Cargo.toml
      // the URL will be generated dynamically
      let version = self.current_version.to_string();
      const CONTROLS_ADD: &AsciiSet = &CONTROLS.add(b'+');
      let encoded_version = percent_encoding::percent_encode(version.as_bytes(), CONTROLS_ADD);

      let fixed_link = url
        .replace("{{current_version}}", &encoded_version.to_string())
        .replace("{{target}}", &target)
        .replace("{{arch}}", arch);

      let task = async {
        #[cfg(feature = "tracing")]
        tracing::debug!("checking if there is an update via {}", url);

        let mut request = HttpRequestBuilder::new("GET", &fixed_link)?
          .headers(headers.clone())
          .header(
            header::USER_AGENT,
            HeaderValue::from_str(UPDATER_USER_AGENT)?,
          )?;

        if let Some(timeout) = self.timeout {
          request = request.timeout(timeout);
        }

        let resp = ClientBuilder::new().build()?.send(request).await;

        // If we got a success, we stop the loop
        // and we set our remote_release variable
        if let Ok(res) = resp {
          let status = res.status();
          // got status code 2XX
          if status.is_success() {
            // if we got 204
            if status == StatusCode::NO_CONTENT {
              #[cfg(feature = "tracing")]
              tracing::event!(tracing::Level::DEBUG, kind = "result", data = "no content");
              // return with `UpToDate` error
              // we should catch on the client
              return Err(Error::UpToDate);
            };
            let res = res.read().await?;

            // Convert the remote result to our local struct
            let built_release: Result<RemoteRelease> =
              serde_json::from_value(res.data).map_err(Into::into);

            // make sure all went well and the remote data is compatible
            // with what we need locally
            match built_release {
              Ok(release) => {
                #[cfg(feature = "tracing")]
                tracing::event!(
                  tracing::Level::DEBUG,
                  kind = "result",
                  data = tracing::field::debug(&release)
                );
                last_error = None;
                return Ok(Some(release));
              }
              Err(err) => {
                #[cfg(feature = "tracing")]
                tracing::event!(
                  tracing::Level::ERROR,
                  kind = "error",
                  error = err.to_string()
                );
                last_error = Some(err)
              }
            }
          } // if status code is not 2XX we keep loopin' our urls
        }

        Ok(None)
      };

      #[cfg(feature = "tracing")]
      let found_release = {
        let span = tracing::info_span!("updater::check::fetch", url = &fixed_link,);
        task.instrument(span).await?
      };
      #[cfg(not(feature = "tracing"))]
      let found_release = task.await?;
      if let Some(release) = found_release {
        remote_release.replace(release);
        break;
      }
    }

    // Last error is cleaned on success -- shouldn't be triggered if
    // we have a successful call
    if let Some(error) = last_error {
      return Err(error);
    }

    // Extracted remote metadata
    let final_release = remote_release.ok_or(Error::ReleaseNotFound)?;

    // is the announced version greater than our current one?
    let should_update = if let Some(comparator) = self.should_install.take() {
      comparator(&self.current_version, &final_release)
    } else {
      final_release.version() > &self.current_version
    };

    headers.remove(header::ACCEPT);

    // create our new updater
    Ok(Update {
      app: self.app,
      target,
      extract_path,
      should_update,
      version: final_release.version().to_string(),
      date: final_release.pub_date().cloned(),
      current_version: self.current_version,
      download_url: final_release.download_url(&json_target)?.to_owned(),
      body: final_release.notes().cloned(),
      signature: final_release.signature(&json_target)?.to_owned(),
      #[cfg(target_os = "windows")]
      with_elevated_task: final_release.with_elevated_task(&json_target)?,
      timeout: self.timeout,
      headers,
    })
  }
}

pub(crate) fn builder<R: Runtime>(app: AppHandle<R>) -> UpdateBuilder<R> {
  UpdateBuilder::new(app)
}

pub(crate) struct Update<R: Runtime> {
  /// Application handle.
  pub app: AppHandle<R>,
  /// Update description
  pub body: Option<String>,
  /// Should we update or not
  pub should_update: bool,
  /// Version announced
  pub version: String,
  /// Running version
  pub current_version: Version,
  /// Update publish date
  pub date: Option<OffsetDateTime>,
  /// Target
  #[allow(dead_code)]
  target: String,
  /// Extract path
  extract_path: PathBuf,
  /// Download URL announced
  download_url: Url,
  /// Signature announced
  signature: String,
  #[cfg(target_os = "windows")]
  /// Optional: Windows only try to use elevated task
  /// Default to false
  with_elevated_task: bool,
  /// Request timeout
  timeout: Option<Duration>,
  /// Request headers
  headers: HeaderMap,
}

impl<R: Runtime> fmt::Debug for Update<R> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let mut s = f.debug_struct("Update");

    s.field("current_version", &self.current_version)
      .field("version", &self.version)
      .field("date", &self.date)
      .field("should_update", &self.should_update)
      .field("body", &self.body)
      .field("target", &self.target)
      .field("extract_path", &self.extract_path)
      .field("download_url", &self.download_url)
      .field("signature", &self.signature)
      .field("timeout", &self.timeout)
      .field("headers", &self.headers);

    #[cfg(target_os = "windows")]
    s.field("with_elevated_task", &self.with_elevated_task);

    s.finish()
  }
}

impl<R: Runtime> Clone for Update<R> {
  fn clone(&self) -> Self {
    Self {
      app: self.app.clone(),
      body: self.body.clone(),
      should_update: self.should_update,
      version: self.version.clone(),
      current_version: self.current_version.clone(),
      date: self.date,
      target: self.target.clone(),
      extract_path: self.extract_path.clone(),
      download_url: self.download_url.clone(),
      signature: self.signature.clone(),
      #[cfg(target_os = "windows")]
      with_elevated_task: self.with_elevated_task,
      timeout: self.timeout,
      headers: self.headers.clone(),
    }
  }
}

impl<R: Runtime> Update<R> {
  pub fn header<K, V>(mut self, key: K, value: V) -> Result<Self>
  where
    HeaderName: TryFrom<K>,
    <HeaderName as TryFrom<K>>::Error: Into<http::Error>,
    HeaderValue: TryFrom<V>,
    <HeaderValue as TryFrom<V>>::Error: Into<http::Error>,
  {
    let key: std::result::Result<HeaderName, http::Error> = key.try_into().map_err(Into::into);
    let value: std::result::Result<HeaderValue, http::Error> = value.try_into().map_err(Into::into);
    self.headers.insert(key?, value?);
    Ok(self)
  }

  pub fn remove_header<K>(mut self, key: K) -> Result<Self>
  where
    HeaderName: TryFrom<K>,
    <HeaderName as TryFrom<K>>::Error: Into<http::Error>,
  {
    let key: std::result::Result<HeaderName, http::Error> = key.try_into().map_err(Into::into);
    self.headers.remove(key?);
    Ok(self)
  }

  // Download and install our update
  // @todo(lemarier): Split into download and install (two step) but need to be thread safe
  #[cfg_attr(feature = "tracing", tracing::instrument("updater::download_and_install", skip_all, fields(url = %self.download_url), ret, err))]
  pub async fn download_and_install<C: Fn(usize, Option<u64>), D: FnOnce()>(
    &self,
    pub_key: String,
    on_chunk: C,
    on_download_finish: D,
  ) -> Result {
    // make sure we can install the update on linux
    // We fail here because later we can add more linux support
    // actually if we use APPIMAGE, our extract path should already
    // be set with our APPIMAGE env variable, we don't need to do
    // anything with it yet
    #[cfg(target_os = "linux")]
    if self.app.state::<Env>().appimage.is_none() {
      #[cfg(feature = "tracing")]
      tracing::error!(
        "app is not a supported Linux package. Currently only AppImages are supported"
      );
      return Err(Error::UnsupportedLinuxPackage);
    }

    // set our headers
    let mut headers = self.headers.clone();
    headers.insert(
      header::ACCEPT,
      HeaderValue::from_str("application/octet-stream")?,
    );
    headers.insert(
      header::USER_AGENT,
      HeaderValue::from_str(UPDATER_USER_AGENT)?,
    );

    let client = ClientBuilder::new().max_redirections(5).build()?;
    // Create our request
    let mut req = HttpRequestBuilder::new("GET", self.download_url.as_str())?.headers(headers);
    if let Some(timeout) = self.timeout {
      req = req.timeout(timeout);
    }

    #[cfg(feature = "tracing")]
    tracing::info!("Downloading update");
    let response = client.send(req).await?;

    // make sure it's success
    if !response.status().is_success() {
      #[cfg(feature = "tracing")]
      tracing::error!("Failed to download update");
      return Err(Error::Network(format!(
        "Download request failed with status: {}",
        response.status()
      )));
    }

    let content_length: Option<u64> = response
      .headers()
      .get(header::CONTENT_LENGTH)
      .and_then(|value| value.to_str().ok())
      .and_then(|value| value.parse().ok());

    let buffer = {
      use futures_util::StreamExt;
      let mut stream = response.bytes_stream();

      let task = async move {
        let mut buffer = Vec::new();
        while let Some(chunk) = stream.next().await {
          let chunk = chunk?;
          let bytes = chunk.as_ref().to_vec();
          on_chunk(bytes.len(), content_length);
          buffer.extend(bytes);
        }
        Result::Ok(buffer)
      };

      #[cfg(feature = "tracing")]
      {
        let span = tracing::info_span!("updater::download_and_install::stream");
        task.instrument(span).await
      }
      #[cfg(not(feature = "tracing"))]
      {
        task.await
      }
    }?;

    on_download_finish();

    // We need an announced signature by the server
    // if there is no signature, bail out.
    verify_signature(&buffer, &self.signature, &pub_key)?;

    // TODO: implement updater in mobile
    #[cfg(desktop)]
    {
      #[cfg(feature = "tracing")]
      tracing::info_span!("updater::download_and_install::install");
      // we copy the files depending of the operating system
      // we run the setup, appimage re-install or overwrite the
      // macos .app
      #[cfg(target_os = "windows")]
      copy_files_and_run(
        &buffer,
        &self.extract_path,
        self.with_elevated_task,
        &self.app.config(),
        &self.app.env(),
      )?;
      #[cfg(not(target_os = "windows"))]
      copy_files_and_run(&buffer, &self.extract_path)?;
    }

    // We are done!
    Ok(())
  }
}

// Linux (AppImage)

// ### Expected structure:
// ├── [AppName]_[version]_amd64.AppImage.tar.gz    # GZ generated by tauri-bundler
// │   └──[AppName]_[version]_amd64.AppImage        # Application AppImage
// └── ...

// We should have an AppImage already installed to be able to copy and install
// the extract_path is the current AppImage path
// tmp_dir is where our new AppImage is found
#[cfg(target_os = "linux")]
fn copy_files_and_run(bytes: &[u8], extract_path: &Path) -> Result {
  use std::os::unix::fs::{MetadataExt, PermissionsExt};

  let extract_path_metadata = extract_path.metadata()?;

  let tmp_dir_locations = vec![
    Box::new(|| Some(env::temp_dir())) as Box<dyn FnOnce() -> Option<PathBuf>>,
    Box::new(dirs_next::cache_dir),
    Box::new(|| Some(extract_path.parent().unwrap().to_path_buf())),
  ];

  for tmp_dir_location in tmp_dir_locations {
    if let Some(tmp_dir_location) = tmp_dir_location() {
      let tmp_dir = tempfile::Builder::new()
        .prefix("tauri_current_app")
        .tempdir_in(tmp_dir_location)?;
      let tmp_dir_metadata = tmp_dir.path().metadata()?;

      if extract_path_metadata.dev() == tmp_dir_metadata.dev() {
        let mut perms = tmp_dir_metadata.permissions();
        perms.set_mode(0o700);
        std::fs::set_permissions(tmp_dir.path(), perms)?;

        let tmp_app_image = &tmp_dir.path().join("current_app.AppImage");

        let permissions = std::fs::metadata(extract_path)?.permissions();

        // create a backup of our current app image
        Move::from_source(extract_path).to_dest(tmp_app_image)?;

        if infer::archive::is_gz(bytes) {
          // extract the buffer to the tmp_dir
          // we extract our signed archive into our final directory without any temp file
          let archive = Cursor::new(bytes);
          let mut extractor =
            Extract::from_cursor(archive, ArchiveFormat::Tar(Some(Compression::Gz)));

          return extractor
            .with_files(|entry| {
              let path = entry.path()?;
              if path.extension() == Some(OsStr::new("AppImage")) {
                // if something went wrong during the extraction, we should restore previous app
                if let Err(err) = entry.extract(extract_path) {
                  Move::from_source(tmp_app_image).to_dest(extract_path)?;
                  return Err(crate::api::Error::Extract(err.to_string()));
                }
                // early finish we have everything we need here
                return Ok(true);
              }
              Ok(false)
            })
            .map_err(Into::into);
        } else {
          return match std::fs::write(extract_path, bytes)
            .and_then(|_| std::fs::set_permissions(extract_path, permissions))
          {
            Err(err) => {
              // if something went wrong during the extraction, we should restore previous app
              Move::from_source(tmp_app_image).to_dest(extract_path)?;
              Err(err.into())
            }
            Ok(_) => Ok(()),
          };
        }
      }
    }
  }

  Err(Error::TempDirNotOnSameMountPoint)
}

#[cfg(windows)]
trait PathExt {
  fn wrap_in_quotes(&self) -> Self;
}

#[cfg(windows)]
impl PathExt for PathBuf {
  fn wrap_in_quotes(&self) -> Self {
    let mut p = std::ffi::OsString::from("\"");
    p.push(self.as_os_str());
    p.push("\"");
    PathBuf::from(p)
  }
}

#[cfg(windows)]
enum WindowsUpdaterType {
  Nsis {
    path: PathBuf,
    #[allow(unused)]
    temp: Option<tempfile::TempPath>,
  },
  Msi {
    path: PathBuf,
    quoted_path: PathBuf,
    #[allow(unused)]
    temp: Option<tempfile::TempPath>,
  },
}

#[cfg(windows)]
impl WindowsUpdaterType {
  fn nsis(path: PathBuf, temp: Option<tempfile::TempPath>) -> Self {
    Self::Nsis { path, temp }
  }

  fn msi(path: PathBuf, temp: Option<tempfile::TempPath>) -> Self {
    Self::Msi {
      quoted_path: path.wrap_in_quotes(),
      path,
      temp,
    }
  }
}

#[cfg(windows)]
fn write_installer_in_temp(
  bytes: &[u8],
  ext: &str,
  temp_dir: &Path,
) -> Result<(PathBuf, Option<tempfile::TempPath>)> {
  use std::io::Write;

  let mut temp_file = tempfile::Builder::new()
    .suffix(ext)
    .rand_bytes(0)
    .tempfile_in(temp_dir)?;
  temp_file.write_all(bytes)?;

  let temp = temp_file.into_temp_path();
  Ok((temp.to_path_buf(), Some(temp)))
}

#[cfg(windows)]
fn escape_msi_property_arg(arg: impl AsRef<OsStr>) -> String {
  let mut arg = arg.as_ref().to_string_lossy().to_string();

  // Otherwise this argument will get lost in ShellExecute
  if arg.is_empty() {
    return "\"\"\"\"".to_string();
  } else if !arg.contains(' ') && !arg.contains('"') {
    return arg;
  }

  if arg.contains('"') {
    arg = arg.replace('"', r#""""""#)
  }

  if arg.starts_with('-') {
    if let Some((a1, a2)) = arg.split_once('=') {
      format!("{a1}=\"\"{a2}\"\"")
    } else {
      format!("\"\"{arg}\"\"")
    }
  } else {
    format!("\"\"{arg}\"\"")
  }
}

// Windows
//
/// ### Expected one of:
/// ├── [AppName]_[version]_x64.msi              # Application MSI
/// ├── [AppName]_[version]_x64-setup.exe        # NSIS installer
/// ├── [AppName]_[version]_x64.msi.zip          # ZIP generated by tauri-bundler
/// │   └──[AppName]_[version]_x64.msi              # Application MSI
/// ├── [AppName]_[version]_x64-setup.exe.zip    # ZIP generated by tauri-bundler
/// │   └──[AppName]_[version]_x64-setup.exe        # NSIS installer
#[cfg(target_os = "windows")]
fn copy_files_and_run(
  bytes: &[u8],
  _extract_path: &Path,
  with_elevated_task: bool,
  config: &crate::Config,
  env: &crate::Env,
) -> Result {
  use std::iter::once;
  use windows::{
    core::{HSTRING, PCWSTR},
    w,
    Win32::{
      Foundation::HWND,
      UI::{Shell::ShellExecuteW, WindowsAndMessaging::SW_SHOW},
    },
  };

  let temp_dir = tempfile::Builder::new().tempdir()?.into_path();

  let updater_type = if infer::archive::is_zip(bytes) {
    let archive = Cursor::new(bytes);
    let mut extractor = Extract::from_cursor(archive, ArchiveFormat::Zip);
    extractor.extract_into(&temp_dir)?;

    let mut paths = std::fs::read_dir(&temp_dir)?;
    loop {
      if let Some(path) = paths.next() {
        let path = path?.path();
        let ext = path.extension();
        if ext == Some(OsStr::new("exe")) {
          break WindowsUpdaterType::nsis(path, None);
        } else if ext == Some(OsStr::new("msi")) {
          break WindowsUpdaterType::msi(path, None);
        }
      } else {
        return Err(Error::InvalidUpdaterFormat);
      }
    }
  } else if infer::app::is_exe(bytes) {
    let (path, temp) = write_installer_in_temp(bytes, ".exe", &temp_dir)?;
    WindowsUpdaterType::nsis(path, temp)
  } else if infer::archive::is_msi(bytes) {
    let (path, temp) = write_installer_in_temp(bytes, ".msi", &temp_dir)?;
    WindowsUpdaterType::msi(path, temp)
  } else {
    return Err(Error::InvalidUpdaterFormat);
  };

  let msi_args;

  let installer_args: Vec<&OsStr> = match &updater_type {
    WindowsUpdaterType::Nsis { .. } => config
      .tauri
      .updater
      .windows
      .install_mode
      .nsis_args()
      .iter()
      .map(OsStr::new)
      .chain(once(OsStr::new("/UPDATE")))
      .chain(once(OsStr::new("/ARGS")))
      .chain(env.args.iter().map(OsStr::new))
      .chain(
        config
          .tauri
          .updater
          .windows
          .installer_args
          .iter()
          .map(OsStr::new),
      )
      .collect(),
    WindowsUpdaterType::Msi {
      path, quoted_path, ..
    } => {
      if with_elevated_task {
        if let Some(bin_name) = current_exe()
          .ok()
          .and_then(|pb| pb.file_name().map(|s| s.to_os_string()))
          .and_then(|s| s.into_string().ok())
        {
          let product_name = bin_name.replace(".exe", "");

          // Check if there is a task that enables the updater to skip the UAC prompt
          let update_task_name = format!("Update {product_name} - Skip UAC");
          if let Ok(output) = Command::new("schtasks")
            .arg("/QUERY")
            .arg("/TN")
            .arg(update_task_name.clone())
            .output()
          {
            if output.status.success() {
              // Rename the MSI to the match file name the Skip UAC task is expecting it to be
              let temp_msi = temp_dir.with_file_name(bin_name).with_extension("msi");
              Move::from_source(path)
                .to_dest(&temp_msi)
                .expect("Unable to move update MSI");
              let exit_status = Command::new("schtasks")
                .arg("/RUN")
                .arg("/TN")
                .arg(update_task_name)
                .status()
                .expect("failed to start updater task");

              if exit_status.success() {
                // Successfully launched task that skips the UAC prompt
                exit(0);
              }
            }
            // Failed to run update task. Following UAC Path
          }
        }
      }
      let escaped_args = env
        .args
        .iter()
        .map(escape_msi_property_arg)
        .collect::<Vec<_>>()
        .join(" ");
      msi_args = std::ffi::OsString::from(format!("LAUNCHAPPARGS=\"{escaped_args}\""));

      [OsStr::new("/i"), quoted_path.as_os_str()]
        .into_iter()
        .chain(
          config
            .tauri
            .updater
            .windows
            .install_mode
            .msiexec_args()
            .iter()
            .map(OsStr::new),
        )
        .chain(once(OsStr::new("/promptrestart")))
        .chain(
          config
            .tauri
            .updater
            .windows
            .installer_args
            .iter()
            .map(OsStr::new),
        )
        .chain(once(OsStr::new("AUTOLAUNCHAPP=True")))
        .chain(once(msi_args.as_os_str()))
        .collect()
    }
  };

  let file = match &updater_type {
    WindowsUpdaterType::Nsis { path, .. } => path.as_os_str().to_os_string(),
    WindowsUpdaterType::Msi { .. } => std::env::var("SYSTEMROOT").as_ref().map_or_else(
      |_| std::ffi::OsString::from("msiexec.exe"),
      |p| std::ffi::OsString::from(format!("{p}\\System32\\msiexec.exe")),
    ),
  };

  let file = HSTRING::from(file);
  // due to our MSRV of 1.61, we can't use .join() on Vec<OsStr>
  // so we join it manually. adapted from:
  // https://github.com/rust-lang/rust/blob/712463de61c65033a6f333f0a14fbb65e34efc50/library/std/src/ffi/os_str.rs#L1558-L1573
  let parameters = {
    if let Some((first, suffix)) = installer_args.split_first() {
      let first_owned = first.to_os_string();
      suffix.iter().fold(first_owned, |mut a, b| {
        a.push(" "); // sep
        a.push(b);
        a
      })
    } else {
      std::ffi::OsString::new()
    }
  };
  let parameters = HSTRING::from(parameters);
  let ret = unsafe {
    ShellExecuteW(
      HWND(0),
      w!("open"),
      &file,
      &parameters,
      PCWSTR::null(),
      SW_SHOW.0 as _,
    )
  };
  if ret.0 <= 32 {
    return Err(Error::Io(std::io::Error::last_os_error()));
  }

  exit(0);
}

// MacOS
// ### Expected structure:
// ├── [AppName]_[version]_x64.app.tar.gz       # GZ generated by tauri-bundler
// │   └──[AppName].app                         # Main application
// │      └── Contents                          # Application contents...
// │          └── ...
// └── ...
#[cfg(target_os = "macos")]
fn copy_files_and_run(bytes: &[u8], extract_path: &Path) -> Result {
  let archive = Cursor::new(bytes);

  // extract the buffer to the tmp_dir
  // we extract our signed archive into our final directory without any temp file
  let mut extractor = Extract::from_cursor(archive, ArchiveFormat::Tar(Some(Compression::Gz)));
  // the first file in the tar.gz will always be
  // <app_name>/Contents

  // We'll extract the files to a temp directory first
  let tmp_extract_dir = tempfile::Builder::new()
    .prefix("tauri_updated_app")
    .tempdir()?
    .into_path();

  // extract all the files
  extractor.with_files(|entry| {
    let path = entry.path()?;
    // skip the first folder (should be the app name)
    let collected_path: PathBuf = path.iter().skip(1).collect();
    let extraction_path = tmp_extract_dir.join(collected_path);

    if let Err(err) = entry.extract(&extraction_path) {
      std::fs::remove_dir_all(&tmp_extract_dir).ok();
      return Err(crate::api::Error::Extract(err.to_string()));
    }

    Ok(false)
  })?;

  let tmp_backup_dir = tempfile::Builder::new()
    .prefix("tauri_current_app")
    .tempdir()?;

  // create backup of our current app
  let move_result = Move::from_source(extract_path).to_dest(tmp_backup_dir.path());
  let need_authorization = if let Err(err) = move_result {
    if is_permission_error(&err) {
      true
    } else {
      std::fs::remove_dir_all(&tmp_extract_dir).ok();
      return Err(err.into());
    }
  } else {
    false
  };

  if need_authorization {
    // Ask for permission using AppleScript - run the two moves with admin privileges
    let script = format!(
      "do shell script \"mv -f '{extract_path}' '{tmp_backup_dir}' && mv -f '{tmp_extract_dir}' '{extract_path}'\" with administrator privileges",
      tmp_extract_dir = tmp_extract_dir.display(),
      extract_path = extract_path.display(),
      tmp_backup_dir = tmp_backup_dir.path().display()
    );
    let mut osascript = std::process::Command::new("osascript");
    osascript.arg("-e").arg(script);
    let status = osascript.status()?;
    if !status.success() {
      std::fs::remove_dir_all(&tmp_extract_dir).ok();
      return Err(Error::Io(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Failed to move the new app into place",
      )));
    }
  } else {
    // move the new app to the target path
    Move::from_source(&tmp_extract_dir).to_dest(extract_path)?;
  }

  let _ = std::process::Command::new("touch")
    .arg(extract_path)
    .status();

  Ok(())
}

#[cfg(target_os = "macos")]
fn is_permission_error(err: &crate::api::Error) -> bool {
  if let crate::api::Error::Io(io_err) = err {
    if io_err.kind() == std::io::ErrorKind::PermissionDenied {
      return true;
    }
  }
  false
}

pub(crate) fn get_updater_target() -> Option<&'static str> {
  if cfg!(target_os = "linux") {
    Some("linux")
  } else if cfg!(target_os = "macos") {
    Some("darwin")
  } else if cfg!(target_os = "windows") {
    Some("windows")
  } else {
    None
  }
}

pub(crate) fn get_updater_arch() -> Option<&'static str> {
  if cfg!(target_arch = "x86") {
    Some("i686")
  } else if cfg!(target_arch = "x86_64") {
    Some("x86_64")
  } else if cfg!(target_arch = "arm") {
    Some("armv7")
  } else if cfg!(target_arch = "aarch64") {
    Some("aarch64")
  } else {
    None
  }
}

/// Get the extract_path from the provided executable_path
#[allow(unused_variables)]
pub fn extract_path_from_executable(env: &Env, executable_path: &Path) -> PathBuf {
  // Return the path of the current executable by default
  // Example C:\Program Files\My App\
  let extract_path = executable_path
    .parent()
    .map(PathBuf::from)
    .expect("Can't determine extract path");

  // MacOS example binary is in /Applications/TestApp.app/Contents/MacOS/myApp
  // We need to get /Applications/<app>.app
  // todo(lemarier): Need a better way here
  // Maybe we could search for <*.app> to get the right path
  #[cfg(target_os = "macos")]
  if extract_path
    .display()
    .to_string()
    .contains("Contents/MacOS")
  {
    return extract_path
      .parent()
      .map(PathBuf::from)
      .expect("Unable to find the extract path")
      .parent()
      .map(PathBuf::from)
      .expect("Unable to find the extract path");
  }

  // We should use APPIMAGE exposed env variable
  // This is where our APPIMAGE should sit and should be replaced
  #[cfg(target_os = "linux")]
  if let Some(app_image_path) = &env.appimage {
    return PathBuf::from(app_image_path);
  }

  extract_path
}

// Convert base64 to string and prevent failing
fn base64_to_string(base64_string: &str) -> Result<String> {
  let decoded_string = &base64::engine::general_purpose::STANDARD.decode(base64_string)?;
  let result = from_utf8(decoded_string)
    .map_err(|_| Error::SignatureUtf8(base64_string.into()))?
    .to_string();
  Ok(result)
}

// Validate signature
// need to be public because its been used
// by our tests in the bundler
pub fn verify_signature(data: &[u8], release_signature: &str, pub_key: &str) -> Result<bool> {
  // we need to convert the pub key
  let pub_key_decoded = base64_to_string(pub_key)?;
  let public_key = PublicKey::decode(&pub_key_decoded)?;
  let signature_base64_decoded = base64_to_string(release_signature)?;
  let signature = Signature::decode(&signature_base64_decoded)?;

  // Validate signature or bail out
  public_key.verify(data, &signature, true)?;
  Ok(true)
}

#[cfg(test)]
mod test {
  use super::*;
  #[cfg(target_os = "macos")]
  use std::fs::File;

  macro_rules! block {
    ($e:expr) => {
      tokio_test::block_on($e)
    };
  }

  fn generate_sample_raw_json() -> String {
    r#"{
      "version": "v2.0.0",
      "notes": "Test version !",
      "pub_date": "2020-06-22T19:25:57Z",
      "platforms": {
        "darwin-aarch64": {
          "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE5QWWxkQnlZOVJZVGdpKzJmRWZ0SkRvWS9TdFpqTU9xcm1mUmJSSG5OWVlwSklrWkN1SFpWbmh4SDlBcTU3SXpjbm0xMmRjRkphbkpVeGhGcTdrdzlrWGpGVWZQSWdzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNTkyOTE1MDU3CWZpbGU6L1VzZXJzL3J1bm5lci9ydW5uZXJzLzIuMjYzLjAvd29yay90YXVyaS90YXVyaS90YXVyaS9leGFtcGxlcy9jb21tdW5pY2F0aW9uL3NyYy10YXVyaS90YXJnZXQvZGVidWcvYnVuZGxlL29zeC9hcHAuYXBwLnRhci5negp4ZHFlUkJTVnpGUXdDdEhydTE5TGgvRlVPeVhjTnM5RHdmaGx3c0ZPWjZXWnFwVDRNWEFSbUJTZ1ZkU1IwckJGdmlwSzJPd00zZEZFN2hJOFUvL1FDZz09Cg==",
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v1.0.0/app.app.tar.gz"
        },
        "darwin-x86_64": {
          "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE5QWWxkQnlZOVJZVGdpKzJmRWZ0SkRvWS9TdFpqTU9xcm1mUmJSSG5OWVlwSklrWkN1SFpWbmh4SDlBcTU3SXpjbm0xMmRjRkphbkpVeGhGcTdrdzlrWGpGVWZQSWdzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNTkyOTE1MDU3CWZpbGU6L1VzZXJzL3J1bm5lci9ydW5uZXJzLzIuMjYzLjAvd29yay90YXVyaS90YXVyaS90YXVyaS9leGFtcGxlcy9jb21tdW5pY2F0aW9uL3NyYy10YXVyaS90YXJnZXQvZGVidWcvYnVuZGxlL29zeC9hcHAuYXBwLnRhci5negp4ZHFlUkJTVnpGUXdDdEhydTE5TGgvRlVPeVhjTnM5RHdmaGx3c0ZPWjZXWnFwVDRNWEFSbUJTZ1ZkU1IwckJGdmlwSzJPd00zZEZFN2hJOFUvL1FDZz09Cg==",
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v1.0.0/app.app.tar.gz"
        },
        "linux-x86_64": {
          "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE5QWWxkQnlZOWZSM29hTFNmUEdXMHRoOC81WDFFVVFRaXdWOUdXUUdwT0NlMldqdXkyaWVieXpoUmdZeXBJaXRqSm1YVmczNXdRL1Brc0tHb1NOTzhrL1hadFcxdmdnPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNTkyOTE3MzQzCWZpbGU6L2hvbWUvcnVubmVyL3dvcmsvdGF1cmkvdGF1cmkvdGF1cmkvZXhhbXBsZXMvY29tbXVuaWNhdGlvbi9zcmMtdGF1cmkvdGFyZ2V0L2RlYnVnL2J1bmRsZS9hcHBpbWFnZS9hcHAuQXBwSW1hZ2UudGFyLmd6CmRUTUM2bWxnbEtTbUhOZGtERUtaZnpUMG5qbVo5TGhtZWE1SFNWMk5OOENaVEZHcnAvVW0zc1A2ajJEbWZUbU0yalRHT0FYYjJNVTVHOHdTQlYwQkF3PT0K",
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v1.0.0/app.AppImage.tar.gz"
        },
        "windows-x86_64": {
          "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE5QWWxkQnlZOVJHMWlvTzRUSlQzTHJOMm5waWpic0p0VVI2R0hUNGxhQVMxdzBPRndlbGpXQXJJakpTN0toRURtVzBkcm15R0VaNTJuS1lZRWdzMzZsWlNKUVAzZGdJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNTkyOTE1NTIzCWZpbGU6RDpcYVx0YXVyaVx0YXVyaVx0YXVyaVxleGFtcGxlc1xjb21tdW5pY2F0aW9uXHNyYy10YXVyaVx0YXJnZXRcZGVidWdcYXBwLng2NC5tc2kuemlwCitXa1lQc3A2MCs1KzEwZnVhOGxyZ2dGMlZqbjBaVUplWEltYUdyZ255eUF6eVF1dldWZzFObStaVEQ3QU1RS1lzcjhDVU4wWFovQ1p1QjJXbW1YZUJ3PT0K",
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v1.0.0/app.x64.msi.zip"
        }
      }
    }"#.into()
  }

  fn generate_sample_platform_json(
    version: &str,
    public_signature: &str,
    download_url: &str,
  ) -> String {
    format!(
      r#"
        {{
          "name": "v{version}",
          "notes": "This is the latest version! Once updated you shouldn't see this prompt.",
          "pub_date": "2020-06-25T14:14:19Z",
          "signature": "{public_signature}",
          "url": "{download_url}"
        }}
      "#
    )
  }

  fn generate_sample_with_elevated_task_platform_json(
    version: &str,
    public_signature: &str,
    download_url: &str,
    with_elevated_task: bool,
  ) -> String {
    format!(
      r#"
        {{
          "name": "v{version}",
          "notes": "This is the latest version! Once updated you shouldn't see this prompt.",
          "pub_date": "2020-06-25T14:14:19Z",
          "signature": "{public_signature}",
          "url": "{download_url}",
          "with_elevated_task": {with_elevated_task}
        }}
      "#
    )
  }

  #[test]
  fn simple_http_updater() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("0.0.0".parse().unwrap())
      .url(mockito::server_url())
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
  }

  #[test]
  fn simple_http_updater_raw_json() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("0.0.0".parse().unwrap())
      .url(mockito::server_url())
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
  }

  #[test]
  fn simple_http_updater_raw_json_windows_x86_64() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("0.0.0".parse().unwrap())
      .target("windows-x86_64")
      .url(mockito::server_url())
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
    assert_eq!(updater.version, "2.0.0");
    assert_eq!(updater.signature, "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldUTE5QWWxkQnlZOVJHMWlvTzRUSlQzTHJOMm5waWpic0p0VVI2R0hUNGxhQVMxdzBPRndlbGpXQXJJakpTN0toRURtVzBkcm15R0VaNTJuS1lZRWdzMzZsWlNKUVAzZGdJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNTkyOTE1NTIzCWZpbGU6RDpcYVx0YXVyaVx0YXVyaVx0YXVyaVxleGFtcGxlc1xjb21tdW5pY2F0aW9uXHNyYy10YXVyaVx0YXJnZXRcZGVidWdcYXBwLng2NC5tc2kuemlwCitXa1lQc3A2MCs1KzEwZnVhOGxyZ2dGMlZqbjBaVUplWEltYUdyZ255eUF6eVF1dldWZzFObStaVEQ3QU1RS1lzcjhDVU4wWFovQ1p1QjJXbW1YZUJ3PT0K");
    assert_eq!(
      updater.download_url.to_string(),
      "https://github.com/tauri-apps/updater-test/releases/download/v1.0.0/app.x64.msi.zip"
    );
  }

  #[test]
  fn simple_http_updater_raw_json_uptodate() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("10.0.0".parse().unwrap())
      .url(mockito::server_url())
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(!updater.should_update);
  }

  #[test]
  fn simple_http_updater_without_version() {
    let _m = mockito::mock("GET", "/darwin-aarch64/1.0.0")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_platform_json(
        "2.0.0",
        "SampleTauriKey",
        "https://tauri.app",
      ))
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("1.0.0".parse().unwrap())
      .url(format!(
        "{}/darwin-aarch64/{{{{current_version}}}}",
        mockito::server_url()
      ))
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
  }

  #[test]
  fn simple_http_updater_percent_decode() {
    let _m = mockito::mock("GET", "/darwin-aarch64/1.0.0")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_platform_json(
        "2.0.0",
        "SampleTauriKey",
        "https://tauri.app",
      ))
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("1.0.0".parse().unwrap())
      .url(
        url::Url::parse(&format!(
          "{}/darwin-aarch64/{{{{current_version}}}}",
          mockito::server_url()
        ))
        .unwrap()
        .to_string()
      )
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("1.0.0".parse().unwrap())
      .urls(&[url::Url::parse(&format!(
        "{}/darwin-aarch64/{{{{current_version}}}}",
        mockito::server_url()
      ))
      .unwrap()
      .to_string()])
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
  }

  #[test]
  fn simple_http_updater_with_elevated_task() {
    let _m = mockito::mock("GET", "/windows-x86_64/1.0.0")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_with_elevated_task_platform_json(
        "2.0.0",
        "SampleTauriKey",
        "https://tauri.app",
        true,
      ))
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("1.0.0".parse().unwrap())
      .url(format!(
        "{}/windows-x86_64/{{{{current_version}}}}",
        mockito::server_url()
      ))
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(updater.should_update);
  }

  #[test]
  fn http_updater_uptodate() {
    let _m = mockito::mock("GET", "/darwin-aarch64/10.0.0")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_platform_json(
        "2.0.0",
        "SampleTauriKey",
        "https://tauri.app",
      ))
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .current_version("10.0.0".parse().unwrap())
      .url(format!(
        "{}/darwin-aarch64/{{{{current_version}}}}",
        mockito::server_url()
      ))
      .build());

    let updater = check_update.expect("Can't check update");

    assert!(!updater.should_update);
  }

  #[test]
  fn http_updater_fallback_urls() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .url("http://badurl.www.tld/1".into())
      .url(mockito::server_url())
      .current_version("0.0.1".parse().unwrap())
      .build());

    let updater = check_update.expect("Can't check remote update");

    assert!(updater.should_update);
  }

  #[test]
  fn http_updater_fallback_urls_with_array() {
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_raw_json())
      .create();

    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .urls(&["http://badurl.www.tld/1".into(), mockito::server_url()])
      .current_version("0.0.1".parse().unwrap())
      .build());

    let updater = check_update.expect("Can't check remote update");

    assert!(updater.should_update);
  }

  #[test]
  fn http_updater_invalid_remote_data() {
    let invalid_signature = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": true
    }"#;
    let invalid_version = r#"{
      "version": 5,
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": "x"
    }"#;
    let invalid_name = r#"{
      "name": false,
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": "x"
    }"#;
    let invalid_date = r#"{
      "version": "1.0.0",
      "notes": "Blablaa",
      "pub_date": 345645646,
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": "x"
    }"#;
    let invalid_notes = r#"{
      "version": "v0.0.3",
      "notes": ["bla", "bla"],
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": "x"
    }"#;
    let invalid_url = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": ["https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz", "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz"],
      "signature": "x"
    }"#;
    let invalid_platform_signature = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "platforms": {
        "test-target": {
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
          "signature": {
            "test-target": "x"
          }
        }
      }
    }"#;
    let invalid_platform_url = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "platforms": {
        "test-target": {
          "url": {
            "first": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz"
          }
          "signature": "x"
        }
      }
    }"#;

    let test_cases = [
      (
        invalid_signature,
        Box::new(|e| matches!(e, Error::InvalidResponseType("signature", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_version,
        Box::new(|e| matches!(e, Error::InvalidResponseType("version", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_name,
        Box::new(|e| matches!(e, Error::InvalidResponseType("name", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_date,
        Box::new(|e| matches!(e, Error::InvalidResponseType("pub_date", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_notes,
        Box::new(|e| matches!(e, Error::InvalidResponseType("notes", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_url,
        Box::new(|e| matches!(e, Error::InvalidResponseType("url", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_platform_signature,
        Box::new(|e| matches!(e, Error::InvalidResponseType("signature", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
      (
        invalid_platform_url,
        Box::new(|e| matches!(e, Error::InvalidResponseType("url", "string", _)))
          as Box<dyn FnOnce(Error) -> bool>,
      ),
    ];

    for (response, validator) in test_cases {
      let _m = mockito::mock("GET", "/")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response)
        .create();

      let app = crate::test::mock_app();
      let check_update = block!(builder(app.handle())
        .url(mockito::server_url())
        .current_version("0.0.1".parse().unwrap())
        .target("test-target")
        .build());
      if let Err(e) = check_update {
        validator(e);
      } else {
        panic!("unexpected Ok response");
      }
    }
  }

  #[test]
  fn http_updater_missing_remote_data() {
    let missing_signature = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz"
    }"#;
    let missing_version = r#"{
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
      "signature": "x"
    }"#;
    let missing_url = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "signature": "x"
    }"#;
    let missing_target = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "platforms": {
        "unknown-target": {
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz",
          "signature": "x"
        }
      }
    }"#;
    let missing_platform_signature = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "platforms": {
        "test-target": {
          "url": "https://github.com/tauri-apps/updater-test/releases/download/v0.0.1/update3.tar.gz"
        }
      }
    }"#;
    let missing_platform_url = r#"{
      "version": "v0.0.3",
      "notes": "Blablaa",
      "pub_date": "2020-02-20T15:41:00Z",
      "platforms": {
        "test-target": {
          "signature": "x"
        }
      }
    }"#;

    fn missing_field_error(field: &str) -> String {
      format!("the `{field}` field was not set on the updater response")
    }

    let test_cases = [
      (missing_signature, missing_field_error("signature")),
      (missing_version, "missing field `version`".to_string()),
      (missing_url, missing_field_error("url")),
      (
        missing_target,
        Error::TargetNotFound("test-target".into()).to_string(),
      ),
      (
        missing_platform_signature,
        "missing field `signature`".to_string(),
      ),
      (missing_platform_url, "missing field `url`".to_string()),
    ];

    for (response, error) in test_cases {
      let _m = mockito::mock("GET", "/")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response)
        .create();

      let app = crate::test::mock_app();
      let check_update = block!(builder(app.handle())
        .url(mockito::server_url())
        .current_version("0.0.1".parse().unwrap())
        .target("test-target")
        .build());
      if let Err(e) = check_update {
        println!("ERROR: {e}, expected: {error}");
        assert!(e.to_string().contains(&error));
      } else {
        panic!("unexpected Ok response");
      }
    }
  }

  // run complete process on mac only for now as we don't have
  // server (api) that we can use to test
  #[test]
  #[cfg(target_os = "macos")]
  fn http_updater_complete_process() {
    use std::io::Read;

    #[cfg(target_os = "macos")]
    let archive_file = "archive.macos.tar.gz";
    #[cfg(target_os = "linux")]
    let archive_file = "archive.linux.tar.gz";
    #[cfg(target_os = "windows")]
    let archive_file = "archive.windows.zip";

    let good_archive_url = format!("{}/{archive_file}", mockito::server_url());

    let mut signature_file = File::open(format!(
      "./test/updater/fixture/archives/{archive_file}.sig"
    ))
    .expect("Unable to open signature");
    let mut signature = String::new();
    signature_file
      .read_to_string(&mut signature)
      .expect("Unable to read signature as string");

    let mut pubkey_file = File::open("./test/updater/fixture/good_signature/update.key.pub")
      .expect("Unable to open pubkey");
    let mut pubkey = String::new();
    pubkey_file
      .read_to_string(&mut pubkey)
      .expect("Unable to read signature as string");

    // add sample file
    let _m = mockito::mock("GET", format!("/{archive_file}").as_str())
      .with_status(200)
      .with_header("content-type", "application/octet-stream")
      .with_body_from_file(format!("./test/updater/fixture/archives/{archive_file}"))
      .create();

    // sample mock for update file
    let _m = mockito::mock("GET", "/")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(generate_sample_platform_json(
        "2.0.1",
        signature.as_ref(),
        good_archive_url.as_ref(),
      ))
      .create();

    // Build a tmpdir so we can test our extraction inside
    // We dont want to overwrite our current executable or the directory
    // Otherwise tests are failing...
    let executable_path = current_exe().expect("Can't extract executable path");
    let parent_path = executable_path
      .parent()
      .expect("Can't find the parent path");

    let tmp_dir = tempfile::Builder::new()
      .prefix("tauri_updater_test")
      .tempdir_in(parent_path);

    assert!(tmp_dir.is_ok());
    let tmp_dir_unwrap = tmp_dir.expect("Can't find tmp_dir");
    let tmp_dir_path = tmp_dir_unwrap.path();

    #[cfg(target_os = "linux")]
    let my_executable = &tmp_dir_path.join("updater-example_0.1.0_amd64.AppImage");
    #[cfg(target_os = "macos")]
    let my_executable = &tmp_dir_path.join("my_app");
    #[cfg(target_os = "windows")]
    let my_executable = &tmp_dir_path.join("my_app.exe");

    // configure the updater
    let app = crate::test::mock_app();
    let check_update = block!(builder(app.handle())
      .url(mockito::server_url())
      // It should represent the executable path, that's why we add my_app.exe in our
      // test path -- in production you shouldn't have to provide it
      .executable_path(my_executable)
      // make sure we force an update
      .current_version("1.0.0".parse().unwrap())
      .build());

    #[cfg(target_os = "linux")]
    {
      env::set_var("APPIMAGE", my_executable);
    }

    // unwrap our results
    let updater = check_update.expect("Can't check remote update");

    // make sure we need to update
    assert!(updater.should_update);
    // make sure we can read announced version
    assert_eq!(updater.version, "2.0.1");

    // download, install and validate signature
    let install_process = block!(updater.download_and_install(pubkey, |_, _| (), || ()));
    assert!(install_process.is_ok());

    // make sure the extraction went well (it should have skipped the main app.app folder)
    // as we can't extract in /Applications directly
    #[cfg(target_os = "macos")]
    let bin_file = tmp_dir_path.join("Contents").join("MacOS").join("app");
    #[cfg(target_os = "linux")]
    // linux should extract at same place as the executable path
    let bin_file = my_executable;
    #[cfg(target_os = "windows")]
    let bin_file = tmp_dir_path.join("with").join("long").join("path.json");

    assert!(bin_file.exists());
  }

  #[test]
  #[cfg(windows)]
  fn it_wraps_correctly() {
    use super::PathExt;
    use std::path::PathBuf;

    assert_eq!(
      PathBuf::from("C:\\Users\\Some User\\AppData\\tauri-example.exe").wrap_in_quotes(),
      PathBuf::from("\"C:\\Users\\Some User\\AppData\\tauri-example.exe\"")
    )
  }

  #[test]
  #[cfg(windows)]
  fn it_escapes_correctly() {
    use super::escape_msi_property_arg;

    // Explanation for quotes:
    // The output of escape_msi_property_args() will be used in `LAUNCHAPPARGS=\"{HERE}\"`. This is the first quote level.
    // To escape a quotation mark we use a second quotation mark, so "" is interpreted as " later.
    // This means that the escaped strings can't ever have a single quotation mark!
    // Now there are 3 major things to look out for to not break the msiexec call:
    //   1) Wrap spaces in quotation marks, otherwise it will be interpreted as the end of the msiexec argument.
    //   2) Escape escaping quotation marks, otherwise they will either end the msiexec argument or be ignored.
    //   3) Escape emtpy args in quotation marks, otherwise the argument will get lost.
    let cases = [
      "something",
      "--flag",
      "--empty=",
      "--arg=value",
      "some space",                     // This simulates `./my-app "some string"`.
      "--arg value", // -> This simulates `./my-app "--arg value"`. Same as above but it triggers the startsWith(`-`) logic.
      "--arg=unwrapped space", // `./my-app --arg="unwrapped space"`
      "--arg=\"wrapped\"", // `./my-app --args=""wrapped""`
      "--arg=\"wrapped space\"", // `./my-app --args=""wrapped space""`
      "--arg=midword\"wrapped space\"", // `./my-app --args=midword""wrapped""`
      "",            // `./my-app '""'`
    ];
    let cases_escaped = [
      "something",
      "--flag",
      "--empty=",
      "--arg=value",
      "\"\"some space\"\"",
      "\"\"--arg value\"\"",
      "--arg=\"\"unwrapped space\"\"",
      r#"--arg=""""""wrapped"""""""#,
      r#"--arg=""""""wrapped space"""""""#,
      r#"--arg=""midword""""wrapped space"""""""#,
      "\"\"\"\"",
    ];

    // Just to be sure we didn't mess that up
    assert_eq!(cases.len(), cases_escaped.len());

    for (orig, escaped) in cases.iter().zip(cases_escaped) {
      assert_eq!(escape_msi_property_arg(orig), escaped);
    }
  }
}
