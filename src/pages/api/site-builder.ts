import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {
  buildGoogleSiteAndPDF,
  type SiteBuilderFormData,
  type SiteBuilderResult,
} from '@/lib/siteBuilder';
import { PrismaClient } from '@prisma/client';

// Prisma client (singleton-ish in dev)
const prisma =
  (global as any).__PRISMA__ ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') (global as any).__PRISMA__ = prisma;

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse form data with files
const parseForm = async (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFiles: 8,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true,
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// Validate required fields
const validateFields = (fields: formidable.Fields): { valid: boolean; message?: string } => {
  // Parse keywords array
  let keywords: string[] = [];
  try {
    keywords = JSON.parse(fields.keywords as string);
  } catch (e) {
    return { valid: false, message: 'Invalid keywords format' };
  }

  // Check if at least one keyword is provided
  if (!keywords.some(k => k.trim() !== '')) {
    return { valid: false, message: 'At least one keyword is required' };
  }

  // Check for required Google account
  if (!fields.googleAccount) {
    return { valid: false, message: 'Google account email is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fields.googleAccount as string)) {
    return { valid: false, message: 'Invalid email format for Google account' };
  }

  // Check for business description
  if (!fields.businessDescription) {
    return { valid: false, message: 'Business description is required' };
  }

  // Validate URLs if provided
  if (fields.businessUrl && !isValidUrl(fields.businessUrl as string)) {
    return { valid: false, message: 'Invalid business URL format' };
  }

  if (fields.googleBusinessProfileUrl && !isValidUrl(fields.googleBusinessProfileUrl as string)) {
    return { valid: false, message: 'Invalid Google Business Profile URL format' };
  }

  // Validate YouTube URLs if provided
  try {
    const youtubeUrls = JSON.parse(fields.youtubeVideos as string);
    for (const url of youtubeUrls) {
      if (url && !isValidYoutubeUrl(url)) {
        return { valid: false, message: `Invalid YouTube URL: ${url}` };
      }
    }
  } catch (e) {
    return { valid: false, message: 'Invalid YouTube URLs format' };
  }

  /* ------------------------------------------------------------------
   * New validations for extended feature set
   * ------------------------------------------------------------------*/

  // 1. Author name required if AI bio generation is enabled
  if (fields.generateAuthorBio === 'true') {
    if (!fields.authorName || !(fields.authorName as string).trim()) {
      return { valid: false, message: 'Author name is required' };
    }
  }

  // Helper to validate a parsed object has expected keys
  const isBoolean = (v: any) => typeof v === 'boolean';
  const isArray = (v: any) => Array.isArray(v);

  // 2. Validate siloStructure JSON
  if (fields.siloStructure) {
    try {
      const silo = JSON.parse(fields.siloStructure as string);
      if (
        typeof silo !== 'object' ||
        !isBoolean(silo.enabled) ||
        !isArray(silo.categories)
      ) {
        return { valid: false, message: 'Invalid siloStructure format' };
      }
    } catch {
      return { valid: false, message: 'Invalid siloStructure format' };
    }
  }

  // 3. Validate contentScheduling JSON
  if (fields.contentScheduling) {
    try {
      const sched = JSON.parse(fields.contentScheduling as string);
      if (
        typeof sched !== 'object' ||
        !isBoolean(sched.enabled) ||
        !isArray(sched.schedules)
      ) {
        return { valid: false, message: 'Invalid contentScheduling format' };
      }
    } catch {
      return { valid: false, message: 'Invalid contentScheduling format' };
    }
  }

  // 4. Validate pbnSettings JSON
  if (fields.pbnSettings) {
    try {
      const pbn = JSON.parse(fields.pbnSettings as string);
      if (
        typeof pbn !== 'object' ||
        !isBoolean(pbn.enabled) ||
        !isArray(pbn.targetUrls) ||
        !isArray(pbn.anchorTexts)
      ) {
        return { valid: false, message: 'Invalid pbnSettings format' };
      }
    } catch {
      return { valid: false, message: 'Invalid pbnSettings format' };
    }
  }

  return { valid: true };
};

// URL validation helper
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// YouTube URL validation helper
const isValidYoutubeUrl = (url: string): boolean => {
  if (!url) return true; // Allow empty
  return url.includes('youtube.com/') || url.includes('youtu.be/');
};

// Mock function to simulate site building process
// Helper to safely JSON.parse optional fields
const safeJson = <T,>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const { fields, files } = await parseForm(req);
    
    // Validate required fields
    const validation = validateFields(fields);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    
    // Process the site building
    // Map formidable fields → SiteBuilderFormData
    const formData: SiteBuilderFormData = {
      keywords: safeJson<string[]>(fields.keywords as string, []),
      googleAccount: fields.googleAccount as string,
      businessDescription: fields.businessDescription as string,
      nicheUtility: (fields.nicheUtility as string) || '',
      businessUrl: (fields.businessUrl as string) || '',
      youtubeVideos: safeJson<string[]>(fields.youtubeVideos as string, []),
      googleBusinessProfileUrl: (fields.googleBusinessProfileUrl as string) || '',
      customHtml: (fields.customHtml as string) || '',
      // Basic implementation: files are uploaded already into tmp; pass their paths
      logoImagePaths: Array.isArray(files.logoImages)
        ? (files.logoImages as formidable.File[]).map(f => f.filepath)
        : files.logoImages
        ? [(files.logoImages as formidable.File).filepath]
        : [],
      cloudPlatform: (fields.cloudPlatform as string) as any ?? 'google',
    };

    // Persist initial Job record
    const job = await prisma.job.create({
      data: {
        status: 'pending',
        progress: 0,
        fields: JSON.stringify({
          ...formData,
          logoImagePaths: undefined, // strip bulky paths
        }),
      },
    });

    const jobId = job.id;

    // Kick off background async processing
    // NOTE: In production use a proper job queue / worker
    void (async () => {
      try {
        // Mark job as in progress
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'in_progress', progress: 10 },
        });

        const result: SiteBuilderResult = await buildGoogleSiteAndPDF(formData);
        
        // Ensure the jobs directory exists
        const pdfDir = path.join(process.cwd(), 'public', 'jobs');
        await fs.mkdir(pdfDir, { recursive: true });
        
        // Write the PDF buffer to file
        const pdfPath = path.join(pdfDir, `${jobId}.pdf`);
        await fs.writeFile(pdfPath, result.pdfBuffer);
        
        // Set the public URL for the PDF
        const pdfUrl = `/jobs/${jobId}.pdf`;

        // Update job as complete
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'complete',
            progress: 100,
            siteUrls: JSON.stringify(result.siteUrls),
            pdfUrl: pdfUrl,
            cloudResources: JSON.stringify(result.cloudResources),
          },
        });
      } catch (err) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'error',
            progress: 100,
            error:
              err instanceof Error ? err.message : 'Unknown error occurred',
          },
        });
      }
    })();

    // Immediately respond – client will poll /api/jobs/[jobId]
    return res.status(202).json({
      success: true,
      message: 'Job accepted. Site is being created.',
      jobId,
    });
    
  } catch (error) {
    console.error('Error processing site builder request:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}
