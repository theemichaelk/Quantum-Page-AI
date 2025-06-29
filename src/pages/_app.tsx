import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import Head from 'next/head';
import { useState, useEffect } from 'react';

// Custom theme setup for Quantum-Page AI
const QuantumPageAI = ({ Component, pageProps }: AppProps) => {
  // State to track if the app has mounted (to prevent hydration issues)
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after the component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Quantum-Page AI</title>
        <meta name="description" content="AI-powered SaaS platform that auto-creates and optimises high-performance websites" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Preload fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
          as="style"
        />
      </Head>
      
      {/* Radix UI Theme Provider with dark appearance */}
      <Theme
        appearance="dark"
        accentColor="blue"
        grayColor="slate"
        scaling="100%"
        radius="medium"
      >
        {/* Only render the component when mounted to prevent hydration issues */}
        {mounted && <Component {...pageProps} />}
      </Theme>
    </>
  );
};

export default QuantumPageAI;
