import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  RocketIcon, 
  LightningBoltIcon,
  ArrowRightIcon,
  CheckCircledIcon,
  GlobeIcon
} from '@radix-ui/react-icons';

// Landing page that redirects to the dashboard
export default function HomePage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Redirect to dashboard after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirecting(true);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Welcome to Quantum-Page AI</title>
        <meta name="description" content="AI-powered SaaS platform that auto-creates and optimizes high-performance websites" />
      </Head>
      
      <div className="min-h-screen bg-carbon flex flex-col">
        {/* Header */}
        <header className="bg-onyx py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <RocketIcon className="w-6 h-6 text-neon-azure mr-2" />
            <h1 className="text-2xl font-sora font-semibold text-ice-white">Quantum-Page AI</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="bg-neon-azure hover:bg-opacity-90 text-carbon font-medium py-2 px-4 rounded-md transition-all flex items-center">
              Go to Dashboard <ArrowRightIcon className="ml-2" />
            </Link>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className={`max-w-3xl mx-auto text-center transition-opacity duration-500 ${redirecting ? 'opacity-50' : 'opacity-100'}`}>
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-neon-azure bg-opacity-20 flex items-center justify-center animate-pulse">
                <LightningBoltIcon className="w-12 h-12 text-neon-azure" />
              </div>
            </div>
            
            <h2 className="text-4xl font-sora font-bold text-ice-white mb-6">
              <span className="text-gradient">AI-Powered Website Creation</span> & Optimization
            </h2>
            
            <p className="text-xl text-text-secondary mb-8">
              Quantum-Page AI automatically creates speed-optimized and SEO-ready websites for e-commerce, blogs, local businesses, and more.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-onyx rounded-lg p-4 flex flex-col items-center">
                <GlobeIcon className="w-8 h-8 text-neon-azure mb-3" />
                <h3 className="text-lg font-sora font-semibold text-ice-white mb-2">Multi-Platform</h3>
                <p className="text-sm text-text-secondary text-center">WordPress, AWS & Azure cloud deployments</p>
              </div>
              
              <div className="bg-onyx rounded-lg p-4 flex flex-col items-center">
                <CheckCircledIcon className="w-8 h-8 text-lime-pulse mb-3" />
                <h3 className="text-lg font-sora font-semibold text-ice-white mb-2">SEO Optimized</h3>
                <p className="text-sm text-text-secondary text-center">Built-in schema, metadata & Core Web Vitals</p>
              </div>
              
              <div className="bg-onyx rounded-lg p-4 flex flex-col items-center">
                <LightningBoltIcon className="w-8 h-8 text-signal-amber mb-3" />
                <h3 className="text-lg font-sora font-semibold text-ice-white mb-2">AI Analytics</h3>
                <p className="text-sm text-text-secondary text-center">Real-time insights & optimization suggestions</p>
              </div>
            </div>
          </div>
          
          {/* Redirect Message */}
          {redirecting && (
            <div className="fixed inset-0 flex items-center justify-center bg-carbon bg-opacity-80 z-50">
              <div className="bg-onyx p-8 rounded-xl shadow-glow-primary animate-pulse max-w-md text-center">
                <LightningBoltIcon className="w-12 h-12 text-neon-azure mx-auto mb-4" />
                <h3 className="text-2xl font-sora font-semibold text-ice-white mb-2">
                  Launching Dashboard
                </h3>
                <p className="text-text-secondary mb-4">
                  Redirecting in {countdown} seconds...
                </p>
                <div className="w-full bg-[#1D2029] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-azure transition-all duration-1000 ease-in-out"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-onyx py-4 px-6 text-center text-text-secondary text-sm">
          <p>© 2025 Quantum-Page AI by Michael K from The Stone Builders Rejected</p>
        </footer>
      </div>
    </>
  );
}
