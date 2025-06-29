import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';

class QuantumPageDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en" className="dark">
        <Head>
          {/* Character Set */}
          <meta charSet="utf-8" />
          
          {/* Favicon and App Icons */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#28C8FF" />
          <meta name="msapplication-TileColor" content="#0F1115" />
          <meta name="theme-color" content="#0F1115" />
          
          {/* Preconnect to External Resources */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Font Loading */}
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" 
            rel="stylesheet"
          />
          
          {/* Open Graph / Social Media Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Quantum-Page AI" />
          <meta property="og:image" content="/og-image.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="/twitter-image.png" />
          
          {/* SEO Meta Tags */}
          <meta name="application-name" content="Quantum-Page AI" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
        </Head>
        <body className="bg-carbon text-ice-white antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default QuantumPageDocument;
