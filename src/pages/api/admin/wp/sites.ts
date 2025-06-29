import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Re-use prisma instance between hot-reloads in dev
const prisma =
  (global as any).__PRISMA__ ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__PRISMA__ = prisma;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      try {
        const wpSites = await prisma.site.findMany({
          where: {
            platform: 'wordpress',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return res.status(200).json(wpSites);
      } catch (error) {
        console.error('Error fetching WordPress sites:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'POST':
      try {
        const { url, credentials } = req.body;

        if (!url || !credentials) {
          return res.status(400).json({ message: 'Missing url or credentials' });
        }

        const newSite = await prisma.site.create({
          data: {
            url,
            platform: 'wordpress',
            credentials,
          },
        });
        console.log('New WordPress site added:', newSite.url);
        return res.status(201).json(newSite);
      } catch (error) {
        console.error('Error adding new WordPress site:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
