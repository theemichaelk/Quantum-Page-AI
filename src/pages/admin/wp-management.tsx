import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlusIcon, ReloadIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';

// Define the Site interface based on your Prisma schema
interface Site {
  id: string;
  url: string;
  platform: string;
  credentials?: string; // Optional, will be masked
  createdAt: string;
  updatedAt: string;
}

const WPManagementPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newSiteUrl, setNewSiteUrl] = useState<string>('');
  const [newSiteCredentials, setNewSiteCredentials] = useState<string>('');
  const [addingSite, setAddingSite] = useState<boolean>(false);
  const [addSiteError, setAddSiteError] = useState<string | null>(null);
  const [addSiteSuccess, setAddSiteSuccess] = useState<string | null>(null);

  const fetchWPSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/wp/sites');
      if (!response.ok) {
        throw new Error(`Error fetching WordPress sites: ${response.statusText}`);
      }
      const data: Site[] = await response.json();
      setSites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWPSites();
  }, []);

  const handleAddSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSite(true);
    setAddSiteError(null);
    setAddSiteSuccess(null);

    if (!newSiteUrl.trim() || !newSiteCredentials.trim()) {
      setAddSiteError('URL and Credentials are required.');
      setAddingSite(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/wp/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newSiteUrl, credentials: newSiteCredentials }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error adding site: ${response.statusText}`);
      }

      setAddSiteSuccess('WordPress site added successfully!');
      setNewSiteUrl('');
      setNewSiteCredentials('');
      fetchWPSites(); // Refresh the list
    } catch (err) {
      setAddSiteError(err instanceof Error ? err.message : 'An unknown error occurred while adding the site.');
    } finally {
      setAddingSite(false);
    }
  };

  const maskCredentials = (credentials?: string) => {
    return credentials ? '••••••' : 'N/A';
  };

  return (
    <DashboardLayout title="WP Management" currentPath="/admin/wp-management">
      <Head>
        <title>WP Management | Quantum-Page AI</title>
        <meta name="description" content="Manage your integrated WordPress sites." />
      </Head>

      <div className="bg-onyx rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-sora font-semibold text-ice-white">WordPress Sites</h2>
          <button
            onClick={fetchWPSites}
            className="inline-flex items-center py-2 px-4 bg-neon-azure hover:bg-opacity-90 text-carbon font-medium rounded-md transition-colors"
            disabled={loading}
          >
            <ReloadIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Sites'}
          </button>
        </div>

        {/* Add New Site Form */}
        <form onSubmit={handleAddSiteSubmit} className="mb-8 p-4 bg-[#1D2029] rounded-lg space-y-4">
          <h3 className="text-xl font-sora font-semibold text-ice-white mb-3">Add New WordPress Site</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="siteUrl" className="block text-sm font-medium text-text-secondary mb-1">
                WordPress Site URL
              </label>
              <input
                type="url"
                id="siteUrl"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder="https://your-wordpress-site.com"
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="siteCredentials" className="block text-sm font-medium text-text-secondary mb-1">
                Credentials (e.g., API Key or Admin Pass)
              </label>
              <input
                type="text"
                id="siteCredentials"
                value={newSiteCredentials}
                onChange={(e) => setNewSiteCredentials(e.target.value)}
                placeholder="Your WP API Key or Admin Password"
                className="input-field w-full"
                required
              />
            </div>
          </div>
          {addSiteError && (
            <div className="p-3 bg-critical-red bg-opacity-20 border border-critical-red rounded-md flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-critical-red mr-2" />
              <p className="text-critical-red text-sm">{addSiteError}</p>
            </div>
          )}
          {addSiteSuccess && (
            <div className="p-3 bg-lime-pulse bg-opacity-20 border border-lime-pulse rounded-md flex items-center">
              <CheckCircledIcon className="w-5 h-5 text-lime-pulse mr-2" />
              <p className="text-lime-pulse text-sm">{addSiteSuccess}</p>
            </div>
          )}
          <button
            type="submit"
            className="inline-flex items-center py-2 px-4 bg-quantum-violet hover:bg-opacity-90 text-ice-white font-medium rounded-md transition-colors"
            disabled={addingSite}
          >
            <PlusIcon className={`w-4 h-4 mr-2 ${addingSite ? 'animate-spin' : ''}`} />
            {addingSite ? 'Adding Site...' : 'Add Site'}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-critical-red bg-opacity-20 border border-critical-red rounded-lg">
            <p className="text-critical-red flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {error}
            </p>
          </div>
        )}

        {loading && sites.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ReloadIcon className="w-10 h-10 text-neon-azure animate-spin mb-4" />
            <p className="text-ice-white">Loading WordPress sites...</p>
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>No WordPress sites found.</p>
            <p>Use the form above to add a new site.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#3D4354]">
              <thead className="bg-[#1D2029]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Credentials
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Platform
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Added At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-onyx divide-y divide-[#3D4354]">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-[#1D2029] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ice-white">
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-neon-azure hover:underline">
                        {site.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {maskCredentials(site.credentials)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {site.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(site.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {/* Future actions like "Manage Plugins", "Run Audit" */}
                      <button className="text-quantum-violet hover:text-neon-azure text-sm">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WPManagementPage;
