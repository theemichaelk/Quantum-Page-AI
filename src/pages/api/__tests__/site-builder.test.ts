import { NextApiRequest, NextApiResponse } from 'next';
import httpMocks from 'node-mocks-http';
import handler from '../site-builder';

// Mock formidable
jest.mock('formidable', () => ({
  IncomingForm: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockImplementation((req, callback) => {
      // Mock the parsed form data based on test case
      const fields = {
        keywords: JSON.stringify(['test keyword']),
        googleAccount: 'test@example.com',
        businessDescription: 'This is a test business description',
        youtubeVideos: JSON.stringify([]),
      };
      const files = {
        logoImages: []
      };
      callback(null, fields, files);
    })
  }))
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
  existsSync: jest.fn(),
}));

describe('Site Builder API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for GET requests', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'Method not allowed'
    });
  });

  it('should return success=true for POST with minimal valid form data', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      // We don't need to set the body as we're mocking formidable's parse method
    });
    const res = httpMocks.createResponse();

    await handler(req as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.urls).toBeDefined();
    expect(responseData.jobId).toBeDefined();
  });
});
