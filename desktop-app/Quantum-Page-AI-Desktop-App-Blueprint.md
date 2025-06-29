# Quantum-Page AI Desktop App Blueprint  
*(Quantum-Page-AI-Desktop-App-Blueprint.md)*  

---

## 1  Overview & Primary Use-Cases
| Persona | Key Jobs to Be Done | Desktop-specific Benefits |
|---------|---------------------|---------------------------|
| **Small-business owner** | Build & launch a WordPress or static site in minutes | Runs offline for draft content; drag-and-drop media from file-system |
| **SEO / Marketing agency** | Manage dozens of client sites, audit rankings, batch-generate content | Multi-window workflow, large-screen analytics, system tray alerts |
| **Enterprise webmaster** | Deploy to private cloud, enforce security policies | OS-level SSO/Kerberos; encrypted credential vault |
| **Content creator on the go** | Voice-to-blog, AI chat, offline editing | Lightweight footprint, automatic sync when re-connected |

The desktop app is a **thick client** that wraps the existing SaaS APIs but adds:

* Local project cache for faster browsing and offline mode  
* OS-level integrations: file drag-drop, clipboard, notifications, system tray, microphone  
* Multi-window / multi-monitor dashboards for agencies  
* One-click local preview of generated static sites (via embedded HTTP server)

---

## 2  Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | **Tauri** (Rust core) | <80 MB runtime, high security sandbox, auto-updater, smaller binaries than Electron |
| UI | **React 18 + TypeScript** (re-use SaaS component library) | Shared design system (Tailwind + Radix UI) |
| State management | **Zustand** + React Query | Light, aligns with web app |
| IPC bridge | Built-in **Tauri invoke** (Rust ↔ JS) | Secure, typed commands |
| Local database | **SQLite** via Tauri plugin + **Dexie.js** (IndexedDB fallback) | Cache site data, drafts, queued tasks |
| Bundler | **Vite** + Tauri build | Fast HMR, tree-shaking |
| Packaging | Tauri Bundler → MSI, DMG, AppImage | Code-signed installers |
| Auto-update | Tauri updater (Cryptographically signed) | Delta updates, rollback |
| Dev tools | Storybook, Jest, Playwright | Matches web repo |

---

## 3  Integration with SaaS Backend

```
Desktop UI ──┬─ HTTPS GraphQL ⇄ SaaS Gateway
             ├─ WebSocket (subscriptions → live traffic, rank updates)
             ├─ REST uploads (media, backups)
             └─ OAuth 2.0 / PKCE flow in embedded browser view
```

* **Same auth domain** (`auth.quantumpage.ai`) to share refresh tokens  
* **Offline queue**: Tauri task manager stores mutations in SQLite → syncs on reconnect  
* **AI Chat** streams via WebSocket; fallback to long-poll if corporate firewall blocks WS  
* **Cloud deploys** triggered via existing Site Orchestrator API; desktop polls deployment events

---

## 4  Core UI Screens & Workflows

1. **Welcome / Onboarding**  
   * Login (OAuth PKCE) or create account  
   * Choose local workspace directory for media cache  
2. **Site Dashboard (multi-tab)**  
   * Traffic, revenue, Core Web Vitals cards  
   * Live log console (tail -f build logs)  
3. **Site Builder Wizard**  
   * Select site type → template → domain  
   * AI prompts panel (keywords, tone, brand)  
   * “Generate” → shows progress bar, local preview server port  
4. **Visual Editor**  
   * WebView embeds existing React WYSIWYG; additional OS toolbar for open/save/undo  
   * Drag files from Explorer/Finder into media panel  
5. **AI Chat & Growth Playbook**  
   * Dockable panel; hotkey **Ctrl+Shift+A** toggles overlay  
   * Chat history stored locally, synced to SaaS for continuity  
6. **Settings**  
   * Cloud credentials (AWS/Azure) encrypted in Keyring  
   * Bandwidth & CPU usage limits  
   * Update channel (stable / beta)  

Multi-window: Agencies can open each client site in its own window; global tray menu shows notifications.

---

## 5  Data Storage & Authentication

| Concern | Approach |
|---------|----------|
| **Auth flow** | OAuth2 PKCE in system webview → access & refresh tokens stored in OS Keyring via Tauri plugin (macOS Keychain, Windows Credential Vault, Secret Service on Linux) |
| **Local cache** | SQLite (`appData/QuantumPage/cache.db`) for sites list, content drafts, offline queue |
| **Encryption** | All tokens, cloud keys stored with platform-level encryption; DB rows with sensitive values encrypted using hardware ID derived key |
| **Sync strategy** | *Optimistic* – local changes queued; background task pushes to API; conflict resolution = last-writer-wins, flagged to user |

---

## 6  Packaging & Distribution

| OS | Format | Channel |
|----|--------|---------|
| Windows 10/11 | **MSI + CodeSign** (EV certificate) | Download site, Winget repo |
| macOS 12+ | **Universal DMG** (Apple notarised, Hardened Runtime) | Direct download, Homebrew cask |
| Linux (Ubuntu/Fedora) | **AppImage + .deb** | AppImage hub, deb repo |
| Auto-updates | Tauri updater hitting `https://updates.quantumpage.ai/desktop/<channel>` | Delta patches; signature verified |

CI/CD: GitHub Actions → build matrix (windows-latest, macos-14, ubuntu-22.04) → sign → publish to S3/CloudFront update bucket.

---

## 7  Security Considerations

* **Tauri isolation** – UI runs in sandboxed WebView; no Node.js runtime exposed  
* **IPC allowlist** – Only whitelisted commands (e.g., `generate_site`, `upload_media`)  
* **CSP headers** – Restrict WebView to SaaS domains & localhost preview port  
* **Auto-update signing** – Ed25519 keys stored in Hardware Security Module; app refuses unsigned updates  
* **Secrets storage** – OS Keyring; no plain-text credentials on disk  
* **File system access** – Only workspace directory; user grants via dialog  
* **Crash reporting** – Sentry (native + JS) with PII scrubbing  

---

## 8  Development Roadmap (Desktop App)

| Sprint | Duration | Deliverables |
|--------|----------|--------------|
| **D-0** | 2 w | Repo scaffolding (Tauri ‑-react), shared design system, CI matrix |
| **D-1** | 3 w | Auth flow (OAuth PKCE), site list view, live SaaS integration |
| **D-2** | 4 w | Site Builder Wizard, local preview server, background sync |
| **D-3** | 2 w | AI Chat overlay, Growth Playbook docked panel |
| **D-4** | 3 w | Visual Editor drag-drop, media upload queue, offline mode |
| **D-5** | 2 w | Tray integration, notifications, auto-update wiring |
| **Beta 1** | 1 w | Internal dog-food (Windows/macOS) |
| **D-6** | 3 w | Harden security (CSP, keyring, updater signing) |
| **D-7** | 2 w | Cross-platform packaging, notarisation, installer branding |
| **Public Beta** | 2 w | 200 users, feedback, crash analytics |
| **Launch** | 1 w | Marketing site, winget/brew/AppImage release |

Total: **~22 weeks** (5 months) with 3 developers (1 Rust/Tauri, 2 React), 1 designer, 1 QA.

---

## Appendix A – Directory Skeleton

```
desktop/
 ├─ src-tauri/              # Rust commands, updater, configs
 │   └─ commands.rs
 ├─ src/
 │   ├─ App.tsx
 │   ├─ windows/
 │   │   ├─ Dashboard.tsx
 │   │   ├─ SiteBuilder.tsx
 │   │   └─ Editor.tsx
 │   ├─ components/
 │   └─ hooks/
 ├─ public/
 ├─ tailwind.config.js
 └─ package.json
```

---

**With this blueprint, a desktop engineering team can immediately initialise a Tauri project, import shared React components from the SaaS web repo, and ship the first login + dashboard build within two sprints.**
