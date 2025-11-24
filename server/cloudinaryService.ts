/**
 * Cloudinary File Storage Service
 * 
 * Provides reliable cloud-based file upload and management using Cloudinary.
 * Files are stored permanently with CDN delivery for optimal performance.
 * 
 * Free tier includes:
 * - 25GB storage
 * - 25GB bandwidth/month
 * - Image transformations
 * - CDN delivery
 */

import { v2 as cloudinary } from 'cloudinary';

// Upload categories for organizing files in Cloudinary
export const UPLOAD_FOLDERS = {
  logos: 'emtelaak/logos',
  profiles: 'emtelaak/profiles',
  properties: 'emtelaak/properties',
  receipts: 'emtelaak/receipts',
  documents: 'emtelaak/documents',
} as const;

export type UploadFolder = typeof UPLOAD_FOLDERS[keyof typeof UPLOAD_FOLDERS];

/**
 * Initialize Cloudinary configuration
 */
function initializeCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary credentials missing: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

// Initialize on module load
try {
  initializeCloudinary();
  console.log('[Cloudinary] ✅ Configuration loaded');
} catch (error) {
  console.warn('[Cloudinary] ⚠️  Configuration not available:', (error as Error).message);
}

/**
 * Upload a file to Cloudinary
 * 
 * @param folder - Upload folder (logos, profiles, etc.)
 * @param fileBuffer - File data as Buffer
 * @param filename - Original filename (used for public_id)
 * @param resourceType - Type of resource (image, raw, video, auto)
 * @returns Object with public_id and secure URL
 */
export async function uploadToCloudinary(
  folder: UploadFolder,
  fileBuffer: Buffer,
  filename: string,
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    // Convert buffer to base64 data URI
    const base64Data = `data:${getContentType(filename)};base64,${fileBuffer.toString('base64')}`;

    // Upload to Cloudinary
    cloudinary.uploader.upload(
      base64Data,
      {
        folder: folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload failed:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
        });
      }
    );
  });
}

/**
 * Delete a file from Cloudinary
 * 
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource (image, raw, video)
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log('[Cloudinary] File deleted:', publicId);
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error);
    throw new Error(`Cloudinary delete failed: ${(error as Error).message}`);
  }
}

/**
 * Get content type from filename extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Default
    default: 'application/octet-stream',
  };

  return contentTypes[ext || ''] || contentTypes.default;
}

/**
 * Generate a transformation URL for images
 * Useful for resizing, cropping, etc.
 * 
 * @param publicId - The public ID of the image
 * @param transformations - Cloudinary transformation options
 * @returns Transformed image URL
 */
export function getTransformedImageUrl(
  publicId: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: number;
    format?: string;
  }
): string {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true,
  });
}

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
