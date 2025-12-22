// AWS S3 Storage Service for Emtelaak Platform
// Uses direct AWS S3 SDK for file uploads

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'emtelaak-property-images';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload a file to S3
 * @param relKey - The relative path/key for the file (e.g., "profiles/user-123.jpg")
 * @param data - The file data as Buffer, Uint8Array, or string
 * @param contentType - The MIME type of the file
 * @returns Object containing the key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // Validate AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "AWS S3 credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    );
  }

  const key = normalizeKey(relKey);
  
  // Convert string to Buffer if needed
  const body = typeof data === "string" ? Buffer.from(data) : data;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Make the object publicly readable
    ACL: 'public-read',
  });

  try {
    await s3Client.send(command);
    
    // Return the public URL
    const url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    
    return { key, url };
  } catch (error: any) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Get a signed URL for downloading a file from S3
 * @param relKey - The relative path/key for the file
 * @returns Object containing the key and signed download URL
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  // Validate AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "AWS S3 credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    );
  }

  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  try {
    // Generate a signed URL valid for 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { key, url };
  } catch (error: any) {
    throw new Error(`S3 get URL failed: ${error.message}`);
  }
}

/**
 * Get the public URL for a file (for publicly accessible files)
 * @param relKey - The relative path/key for the file
 * @returns The public URL
 */
export function getPublicUrl(relKey: string): string {
  const key = normalizeKey(relKey);
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}
