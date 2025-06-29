import { NextApiRequest, NextApiResponse } from 'next';
import httpMocks from 'node-mocks-http';
import handler from '../site-builder';

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    job: {
      create: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
      update: jest.fn().mockResolvedValue({}),
    },
  })),
}));

// Mock fs
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path'),
}));

// Mock the site builder lib
jest.mock('@/lib/siteBuilder', () => ({
  buildGoogleSiteAndPDF: jest.fn().mockResolvedValue({
    siteUrls: ['https://example.com'],
    pdfBuffer: Buffer.from('mock pdf'),
    siteId: 'mock-site-id',
  }),
}));

describe('Site Builder API Validation', () => {
  // Mock for formidable
  let mockFormidableParse: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup formidable mock with a default implementation that will be overridden in tests
    mockFormidableParse = jest.fn();
    jest.mock('formidable', () => ({
      IncomingForm: jest.fn().mockImplementation(() => ({
        parse: mockFormidableParse
      }))
    }));
  });
  
  it('should return 400 when no keywords are provided', async () => {
    // Setup formidable to return empty keywords
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify([]), // Empty keywords array
        googleAccount: 'test@example.com',
        businessDescription: 'Test description',
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('keyword is required');
  });
  
  it('should return 400 when invalid email format is provided for googleAccount', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'invalid-email', // Invalid email format
        businessDescription: 'Test description',
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Invalid email format');
  });
  
  it('should return 400 when businessDescription is missing', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'test@example.com',
        businessDescription: '', // Empty business description
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Business description is required');
  });
  
  it('should return 400 when invalid businessUrl is provided', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'test@example.com',
        businessDescription: 'Test description',
        businessUrl: 'invalid-url', // Invalid URL format
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Invalid business URL format');
  });
  
  it('should return 400 when invalid Google Business Profile URL is provided', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'test@example.com',
        businessDescription: 'Test description',
        googleBusinessProfileUrl: 'invalid-url', // Invalid URL format
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Invalid Google Business Profile URL format');
  });
  
  it('should return 400 when invalid YouTube URL is provided', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'test@example.com',
        businessDescription: 'Test description',
        youtubeVideos: JSON.stringify(['invalid-youtube-url']), // Invalid YouTube URL
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Invalid YouTube URL');
  });
  
  it('should return 400 when keywords JSON is invalid', async () => {
    mockFormidableParse.mockImplementation((req, callback) => {
      const fields = {
        keywords: 'not-valid-json', // Invalid JSON
        googleAccount: 'test@example.com',
        businessDescription: 'Test description',
        youtubeVideos: JSON.stringify([]),
      };
      const files = { logoImages: [] };
      callback(null, fields, files);
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('Invalid keywords format');
  });
});
