import { describe, it, expect } from 'vitest';
import { storagePut } from '../../server/storage';

describe('CloudFront CDN Integration', () => {
  it('should return CloudFront URL when CLOUDFRONT_DOMAIN is set', async () => {
    // Upload a test file
    const testContent = 'CloudFront CDN test file';
    const testKey = `test/cloudfront-validation-${Date.now()}.txt`;
    
    const { url, key } = await storagePut(testKey, testContent, 'text/plain');
    
    // Verify the key is correct
    expect(key).toBe(testKey);
    
    // Verify URL format
    expect(url).toMatch(/^https:\/\//);
    
    // Check if CloudFront domain is used
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    
    if (cloudfrontDomain) {
      // Should use CloudFront URL
      expect(url).toContain(cloudfrontDomain);
      expect(url).toBe(`https://${cloudfrontDomain}/${testKey}`);
      console.log('✅ CloudFront URL:', url);
    } else {
      // Should fall back to direct S3 URL
      expect(url).toContain('s3');
      expect(url).toContain('amazonaws.com');
      console.log('⚠️  CloudFront not configured, using direct S3 URL:', url);
    }
  });

  it('should validate CloudFront domain format', () => {
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    
    if (cloudfrontDomain) {
      // CloudFront domains should end with .cloudfront.net
      expect(cloudfrontDomain).toMatch(/\.cloudfront\.net$/);
      
      // Should not include protocol
      expect(cloudfrontDomain).not.toContain('https://');
      expect(cloudfrontDomain).not.toContain('http://');
      
      // Should not have trailing slash
      expect(cloudfrontDomain).not.toMatch(/\/$/);
      
      console.log('✅ CloudFront domain format valid:', cloudfrontDomain);
    } else {
      console.log('⚠️  CLOUDFRONT_DOMAIN not set');
    }
  });

  it('should generate correct CloudFront URLs for different file types', async () => {
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    
    if (!cloudfrontDomain) {
      console.log('⚠️  Skipping test - CLOUDFRONT_DOMAIN not set');
      return;
    }

    const testCases = [
      { path: 'users/profiles/user-123.jpg', contentType: 'image/jpeg' },
      { path: 'properties/456/image.png', contentType: 'image/png' },
      { path: 'documents/legal/terms.pdf', contentType: 'application/pdf' },
    ];

    for (const testCase of testCases) {
      const { url } = await storagePut(testCase.path, 'test', testCase.contentType);
      
      expect(url).toBe(`https://${cloudfrontDomain}/${testCase.path}`);
      console.log(`✅ ${testCase.path} → ${url}`);
    }
  });
});
