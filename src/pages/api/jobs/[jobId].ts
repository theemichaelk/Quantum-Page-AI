import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Response type sent to the client
type JobStatusResponse = {
  jobId: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  progress: number;
  message?: string;
  urls?: string[];
  pdfUrl?: string;
};

// Re-use prisma instance between hot-reloads in dev
const prisma =
  (global as any).__PRISMA__ ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__PRISMA__ = prisma;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobStatusResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the jobId from the query
  const { jobId } = req.query;

  if (!jobId || Array.isArray(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  // Query the database for the job
  prisma.job
    .findUnique({
      where: { id: jobId },
    })
    .then((job) => {
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const response: JobStatusResponse = {
        jobId: job.id,
        status: job.status as JobStatusResponse['status'],
        progress: job.progress,
        message: job.error ?? '',
        urls: job.siteUrls ? JSON.parse(job.siteUrls) : undefined,
        pdfUrl: job.pdfUrl ?? undefined,
      };

      return res.status(200).json(response);
    })
    .catch((err) => {
      console.error('Error fetching job status:', err);
      return res.status(500).json({ error: 'Internal server error' });
    });
}
