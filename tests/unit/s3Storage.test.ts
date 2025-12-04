import { describe, it, expect, beforeAll } from 'vitest';
import { storagePut, storageGet } from '../../server/storage';

describe('AWS S3 Storage Integration', () => {
  let testFileKey: string;
  let testFileUrl: string;

  beforeAll(() => {
    // Verify environment variables are set
    expect(process.env.AWS_ACCESS_KEY_ID).toBeDefined();
    expect(process.env.AWS_SECRET_ACCESS_KEY).toBeDefined();
    expect(process.env.AWS_REGION).toBeDefined();
    expect(process.env.S3_BUCKET_NAME).toBeDefined();
  });

  it('should upload a test file to S3', async () => {
    const testContent = 'Test file content for S3 validation';
    const timestamp = Date.now();
    testFileKey = `test/validation-${timestamp}.txt`;

    const result = await storagePut(testFileKey, testContent, 'text/plain');

    expect(result).toBeDefined();
    expect(result.key).toBe(testFileKey);
    expect(result.url).toContain('s3.us-east-1.amazonaws.com');
    expect(result.url).toContain(testFileKey);

    testFileUrl = result.url;
  });

  it('should generate correct public URL for S3 object', async () => {
    const result = await storageGet(testFileKey);

    expect(result).toBeDefined();
    expect(result.key).toBe(testFileKey);
    expect(result.url).toContain('s3.us-east-1.amazonaws.com');
    expect(result.url).toContain(testFileKey);
  });

  it('should upload binary data (image simulation)', async () => {
    const timestamp = Date.now();
    const imageKey = `test/image-${timestamp}.png`;
    
    // Simulate a small PNG image (1x1 transparent pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);

    const result = await storagePut(imageKey, pngBuffer, 'image/png');

    expect(result).toBeDefined();
    expect(result.key).toBe(imageKey);
    expect(result.url).toContain('s3.us-east-1.amazonaws.com');
    expect(result.url).toContain(imageKey);
  });

  it('should handle nested path keys correctly', async () => {
    const timestamp = Date.now();
    const nestedKey = `properties/123/images/test-${timestamp}.jpg`;
    const testContent = 'Nested path test';

    const result = await storagePut(nestedKey, testContent, 'image/jpeg');

    expect(result).toBeDefined();
    expect(result.key).toBe(nestedKey);
    expect(result.url).toContain(nestedKey);
  });

  it('should normalize keys by removing leading slashes', async () => {
    const timestamp = Date.now();
    const keyWithSlash = `/test/leading-slash-${timestamp}.txt`;
    const expectedKey = `test/leading-slash-${timestamp}.txt`;

    const result = await storagePut(keyWithSlash, 'Test content', 'text/plain');

    expect(result.key).toBe(expectedKey);
    expect(result.url).toContain(expectedKey);
    expect(result.url).not.toContain('//test');
  });
});
