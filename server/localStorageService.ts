/**
 * Local File Storage Service
 * 
 * Provides file upload and retrieval functionality using local disk storage.
 * Files are stored in the /uploads directory with organized subdirectories.
 * 
 * This replaces S3 storage for simplicity and cost-effectiveness.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Base uploads directory - will be mounted as persistent disk on Render
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Subdirectories for different file types
export const UPLOAD_CATEGORIES = {
  logos: 'logos',
  profiles: 'profiles',
  properties: 'properties',
  receipts: 'receipts',
  documents: 'documents',
} as const;

export type UploadCategory = typeof UPLOAD_CATEGORIES[keyof typeof UPLOAD_CATEGORIES];

/**
 * Generate a unique filename to prevent collisions
 */
function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * Ensure upload directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save a file to local storage
 * 
 * @param category - Upload category (logos, profiles, etc.)
 * @param fileBuffer - File data as Buffer
 * @param originalFilename - Original filename (used for extension)
 * @returns Object with filename and public URL
 */
export async function saveFile(
  category: UploadCategory,
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{ filename: string; url: string }> {
  // Generate unique filename
  const filename = generateUniqueFilename(originalFilename);
  
  // Construct full path
  const categoryDir = path.join(UPLOADS_DIR, category);
  await ensureDirectoryExists(categoryDir);
  
  const filePath = path.join(categoryDir, filename);
  
  // Write file to disk
  await fs.writeFile(filePath, fileBuffer);
  
  // Construct public URL
  const url = `/uploads/${category}/${filename}`;
  
  return { filename, url };
}

/**
 * Delete a file from local storage
 * 
 * @param category - Upload category
 * @param filename - Filename to delete
 */
export async function deleteFile(
  category: UploadCategory,
  filename: string
): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, category, filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File doesn't exist or already deleted - ignore error
    console.warn(`Failed to delete file ${filePath}:`, error);
  }
}

/**
 * Get public URL for a file
 * 
 * @param category - Upload category
 * @param filename - Filename
 * @returns Public URL
 */
export function getFileUrl(category: UploadCategory, filename: string): string {
  return `/uploads/${category}/${filename}`;
}

/**
 * Check if a file exists
 * 
 * @param category - Upload category
 * @param filename - Filename to check
 * @returns True if file exists
 */
export async function fileExists(
  category: UploadCategory,
  filename: string
): Promise<boolean> {
  const filePath = path.join(UPLOADS_DIR, category, filename);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize storage directories on server startup
 */
export async function initializeStorage(): Promise<void> {
  console.log('[Local Storage] Initializing upload directories...');
  
  for (const category of Object.values(UPLOAD_CATEGORIES)) {
    const categoryDir = path.join(UPLOADS_DIR, category);
    await ensureDirectoryExists(categoryDir);
  }
  
  console.log('[Local Storage] ✅ Upload directories ready');
}
