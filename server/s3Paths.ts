/**
 * S3 Bucket Folder Structure
 * Defines organized paths for different types of uploads
 */

export const S3_PATHS = {
  // Platform branding
  LOGOS: 'logos',
  
  // User-related files
  USERS: {
    PROFILES: 'users/profiles',
    DOCUMENTS: 'users/documents',
    KYC: 'users/kyc',
  },
  
  // Admin-related files
  ADMINS: {
    PROFILES: 'admins/profiles',
  },
  
  // Property-related files
  PROPERTIES: {
    IMAGES: 'properties',
    DOCUMENTS: 'properties/documents',
  },
  
  // Platform documents
  DOCUMENTS: {
    LEGAL: 'documents/legal',
    CONTRACTS: 'documents/contracts',
    INVOICES: 'documents/invoices',
    RECEIPTS: 'documents/receipts',
  },
  
  // Temporary/test files
  TEST: 'test',
} as const;

/**
 * Generate S3 key for user profile picture
 */
export function getUserProfileKey(userId: number, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  return `${S3_PATHS.USERS.PROFILES}/user-${userId}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for admin profile picture
 */
export function getAdminProfileKey(userId: number, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  return `${S3_PATHS.ADMINS.PROFILES}/admin-${userId}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for KYC document
 */
export function getKYCDocumentKey(
  userId: number, 
  documentType: string, 
  extension: string = 'pdf'
): string {
  const timestamp = Date.now();
  const sanitizedType = documentType.toLowerCase().replace(/\s+/g, '-');
  return `${S3_PATHS.USERS.KYC}/user-${userId}-${sanitizedType}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for property image
 */
export function getPropertyImageKey(
  propertyId: number, 
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  return `${S3_PATHS.PROPERTIES.IMAGES}/${propertyId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Generate S3 key for platform logo
 */
export function getLogoKey(logoType: string = 'main', extension: string = 'png'): string {
  const timestamp = Date.now();
  return `${S3_PATHS.LOGOS}/${logoType}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for legal document
 */
export function getLegalDocumentKey(
  documentName: string, 
  extension: string = 'pdf'
): string {
  const timestamp = Date.now();
  const sanitizedName = documentName.toLowerCase().replace(/\s+/g, '-');
  return `${S3_PATHS.DOCUMENTS.LEGAL}/${sanitizedName}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for contract
 */
export function getContractKey(
  contractId: number, 
  extension: string = 'pdf'
): string {
  const timestamp = Date.now();
  return `${S3_PATHS.DOCUMENTS.CONTRACTS}/contract-${contractId}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for invoice
 */
export function getInvoiceKey(
  invoiceId: number, 
  extension: string = 'pdf'
): string {
  const timestamp = Date.now();
  return `${S3_PATHS.DOCUMENTS.INVOICES}/invoice-${invoiceId}-${timestamp}.${extension}`;
}

/**
 * Generate S3 key for payment receipt
 */
export function getReceiptKey(
  userId: number,
  transactionId: number, 
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  return `${S3_PATHS.DOCUMENTS.RECEIPTS}/user-${userId}-receipt-${transactionId}-${timestamp}.${extension}`;
}

/**
 * Extract file extension from filename or base64 data
 */
export function getFileExtension(filename: string, defaultExt: string = 'jpg'): string {
  if (filename.includes('.')) {
    return filename.split('.').pop()?.toLowerCase() || defaultExt;
  }
  
  // Try to detect from base64 data URL
  if (filename.startsWith('data:image/')) {
    const match = filename.match(/data:image\/(\w+);/);
    return match ? match[1] : defaultExt;
  }
  
  return defaultExt;
}
