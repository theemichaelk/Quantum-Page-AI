import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BuilderForm from '@/components/site/BuilderForm';
import { RocketIcon, LightningBoltIcon } from '@radix-ui/react-icons';

const SiteBuilderPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Site Builder | Quantum-Page AI</title>
        <meta name="description" content="Create SEO-optimized websites with AI-powered content generation" />
      </Head>

      <DashboardLayout title="Site Builder" currentPath="/site-builder">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-neon-azure bg-opacity-20 rounded-full flex items-center justify-center mr-4">
              <RocketIcon className="w-6 h-6 text-neon-azure" />
            </div>
            <div>
              <h1 className="text-2xl font-sora font-semibold text-ice-white">Create New Site</h1>
              <p className="text-text-secondary">Build SEO-optimized websites with AI-powered content generation</p>
            </div>
          </div>

          <div className="bg-onyx bg-opacity-50 p-4 rounded-lg border border-[#3D4354] flex items-start mb-8">
            <LightningBoltIcon className="w-5 h-5 text-signal-amber mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-ice-white font-medium mb-1">How it works</p>
              <p className="text-text-secondary text-sm">
                Fill in the form below with your business information and keywords. Our AI will automatically create a Google Site with 5 pages of SEO-optimized content, 
                embed your videos and images, add internal and external links, and provide you with a PDF containing all the created URLs.
              </p>
            </div>
          </div>
        </div>

        <BuilderForm />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-onyx rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-neon-azure bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                <span className="text-neon-azure font-medium">1</span>
              </div>
              <h3 className="text-lg font-sora text-ice-white">Fill Form</h3>
            </div>
            <p className="text-text-secondary text-sm">
              Enter your keywords, business details, and upload your media assets.
            </p>
          </div>

          <div className="bg-onyx rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-neon-azure bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                <span className="text-neon-azure font-medium">2</span>
              </div>
              <h3 className="text-lg font-sora text-ice-white">AI Generation</h3>
            </div>
            <p className="text-text-secondary text-sm">
              Our AI creates Google Sites with optimized content, images, videos, and links.
            </p>
          </div>

          <div className="bg-onyx rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-neon-azure bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                <span className="text-neon-azure font-medium">3</span>
              </div>
              <h3 className="text-lg font-sora text-ice-white">Get Results</h3>
            </div>
            <p className="text-text-secondary text-sm">
              Receive a PDF with all your site URLs and start enjoying improved search visibility.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default SiteBuilderPage;
