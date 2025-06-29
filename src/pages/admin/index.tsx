import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReloadIcon, CheckCircledIcon, ExclamationTriangleIcon, ClockIcon } from '@radix-ui/react-icons';

interface Job {
  id: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  progress: number;
  createdAt: string;
  updatedAt: string;
  message?: string;
}

const AdminDashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/jobs');
      if (!response.ok) {
        throw new Error(`Error fetching jobs: ${response.statusText}`);
      }
      const data: Job[] = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Optionally, set up polling for real-time updates
    const interval = setInterval(fetchJobs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'text-signal-amber';
      case 'in_progress':
        return 'text-neon-azure';
      case 'complete':
        return 'text-lime-pulse';
      case 'error':
        return 'text-critical-red';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'in_progress':
        return <ReloadIcon className="w-4 h-4 animate-spin" />;
      case 'complete':
        return <CheckCircledIcon className="w-4 h-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Cloud Dashboard" currentPath="/admin">
      <Head>
        <title>Cloud Dashboard | Quantum-Page AI</title>
        <meta name="description" content="Manage and monitor all site creation jobs across your network." />
      </Head>

      <div className="bg-onyx rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-sora font-semibold text-ice-white">All Site Creation Jobs</h2>
          <button
            onClick={fetchJobs}
            className="inline-flex items-center py-2 px-4 bg-neon-azure hover:bg-opacity-90 text-carbon font-medium rounded-md transition-colors"
            disabled={loading}
          >
            <ReloadIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Jobs'}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-critical-red bg-opacity-20 border border-critical-red rounded-lg">
            <p className="text-critical-red flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {error}
            </p>
          </div>
        )}

        {loading && jobs.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ReloadIcon className="w-10 h-10 text-neon-azure animate-spin mb-4" />
            <p className="text-ice-white">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>No site creation jobs found.</p>
            <p>Start building a new site from the <Link href="/site-builder" className="text-neon-azure hover:underline">Site Builder</Link> page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#3D4354]">
              <thead className="bg-[#1D2029]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Job ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Progress%
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Updated At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-onyx divide-y divide-[#3D4354]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#1D2029] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ice-white">
                      <Link href={`/site-builder/status?jobId=${job.id}`} className="text-neon-azure hover:underline">
                        {job.id.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ice-white">
                      {job.progress}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(job.updatedAt).toLocaleString()}
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

export default AdminDashboardPage;
