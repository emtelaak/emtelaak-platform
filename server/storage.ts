// AWS S3 storage implementation for Emtelaak Platform
// Replaces Manus-managed storage with user's own AWS S3 bucket

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'emtelaak-property-images';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; // CloudFront CDN domain

// Initialize S3 Client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        'AWS credentials missing: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
      );
    }

    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

/**
 * Upload file to AWS S3 bucket
 * @param relKey - Relative path/key for the file (e.g., "properties/123/image.png")
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file (e.g., "image/png")
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const key = normalizeKey(relKey);

  // Convert string to Buffer if needed
  const bodyData = typeof data === 'string' ? Buffer.from(data) : data;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: bodyData,
    ContentType: contentType,
    ACL: 'public-read', // Make files publicly accessible
  });

  try {
    await client.send(command);

    // Construct public URL - use CloudFront if available, otherwise direct S3
    const url = CLOUDFRONT_DOMAIN
      ? `https://${CLOUDFRONT_DOMAIN}/${key}`
      : `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    console.log(`[S3] Uploaded file: ${key} → ${url}`);

    return { key, url };
  } catch (error) {
    console.error('[S3] Upload failed:', error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get public URL for an S3 object
 * @param relKey - Relative path/key for the file
 * @returns Object with key and public URL
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Delete file from S3 bucket
 * @param relKey - Relative path/key for the file
 */
export async function storageDelete(relKey: string): Promise<void> {
  const client = getS3Client();
  const key = normalizeKey(relKey);

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });

  try {
    await client.send(command);
    console.log(`[S3] Deleted file: ${key}`);
  } catch (error) {
    console.error('[S3] Delete failed:', error);
    throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize S3 key by removing leading slashes
 */
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}
