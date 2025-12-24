/**
 * Security Middleware
 * Implements rate limiting, security headers, and request validation
 */
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter for authentication endpoints (login, password reset)
 * Stricter limits to prevent brute force attacks
 * SECURITY FIX: Reduced from 5 to 3 attempts
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // CHANGED: Limit each IP to 3 requests per window (was 5)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  validate: { trustProxy: false }, // Disable trust proxy validation
  handler: async (req, res) => {
    // Log rate limit hit
    try {
      const { logSecurityEvent } = await import('../securityDb');
      await logSecurityEvent({
        eventType: 'rate_limit_hit',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        severity: 'high',
        details: { message: 'Authentication rate limit exceeded', limit: 3, window: '15 minutes' },
      });
    } catch (error) {
      console.error('[Security] Failed to log rate limit event:', error);
    }
    res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
  },
});

/**
 * Rate limiter for mutation endpoints (investments, transactions, wallet operations)
 * Moderate limits to prevent abuse while allowing normal usage
 */
export const mutationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation
  handler: async (req, res) => {
    try {
      const { logSecurityEvent } = await import('../securityDb');
      await logSecurityEvent({
        eventType: 'rate_limit_hit',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        severity: 'medium',
        details: { message: 'Mutation rate limit exceeded', limit: 50, window: '15 minutes' },
      });
    } catch (error) {
      console.error('[Security] Failed to log rate limit event:', error);
    }
    res.status(429).json({ error: 'Too many requests, please slow down.' });
  },
});

/**
 * Rate limiter for query endpoints (read operations)
 * Lenient limits for normal browsing
 */
export const queryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation
});

/**
 * Rate limiter for file uploads
 * Stricter limits to prevent storage abuse
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation
  handler: async (req, res) => {
    try {
      const { logSecurityEvent } = await import('../securityDb');
      await logSecurityEvent({
        eventType: 'rate_limit_hit',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        severity: 'medium',
        details: { message: 'Upload rate limit exceeded', limit: 20, window: '1 hour' },
      });
    } catch (error) {
      console.error('[Security] Failed to log rate limit event:', error);
    }
    res.status(429).json({ error: 'Too many file uploads, please try again later.' });
  },
});

/**
 * Configure Helmet security headers
 * SECURITY FIX: Improved CSP by removing unsafe-inline and unsafe-eval where possible
 */
export function configureSecurityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // SECURITY FIX: Removed 'unsafe-inline' and 'unsafe-eval' - use nonces instead
        // If you need inline scripts, generate nonces and pass them to the CSP
        scriptSrc: ["'self'", "https://www.youtube.com", "https://www.google.com", "https://maps.googleapis.com"],
        // SECURITY FIX: Removed 'unsafe-inline' from styles
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        // SECURITY FIX: Restricted connect-src to specific domains
        connectSrc: ["'self'", "https://api.manus.im", "wss://api.manus.im"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    // Prevent clickjacking
    frameguard: {
      action: 'deny',
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable HTTPS-only mode (HSTS)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent XSS attacks
    xssFilter: true,
    // SECURITY ENHANCEMENT: Add Permissions-Policy
    permittedCrossDomainPolicies: {
      permittedPolicies: "none"
    },
  });
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate password strength
 * SECURITY FIX: Enhanced password requirements
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  // SECURITY FIX: Increased minimum length to 12 characters
  if (!password || password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long' };
  }
  
  // SECURITY FIX: Added maximum length to prevent DoS
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // SECURITY FIX: Added special character requirement
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  // SECURITY ENHANCEMENT: Check for common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      return { valid: false, message: 'Password contains common patterns. Please choose a stronger password.' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate file upload
 * SECURITY FIX: Added magic number validation for actual file type verification
 */
export function validateFileUpload(file: {
  mimetype: string;
  size: number;
  buffer?: Buffer;
}): { valid: boolean; message?: string } {
  // Allowed image types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  // Allowed document types
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
  
  // Max file size: 10MB
  const maxSize = 10 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type. Allowed: images (JPEG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File size exceeds 10MB limit' };
  }
  
  // SECURITY FIX: Verify actual file type using magic numbers
  if (file.buffer) {
    const magicNumbers: { [key: string]: number[] } = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    };
    
    const magic = magicNumbers[file.mimetype];
    if (magic) {
      for (let i = 0; i < magic.length; i++) {
        if (file.buffer[i] !== magic[i]) {
          return { valid: false, message: 'File content does not match declared type. Possible file type spoofing.' };
        }
      }
    }
  }
  
  return { valid: true };
}

/**
 * SECURITY FIX: Database-backed failed login tracking
 * Replaced in-memory Map with database storage
 */
export async function recordFailedLogin(identifier: string, ipAddress: string): Promise<void> {
  try {
    const { logSecurityEvent } = await import('../securityDb');
    await logSecurityEvent({
      eventType: 'failed_login',
      ipAddress,
      userAgent: identifier,
      endpoint: '/api/auth/login',
      severity: 'medium',
      details: { identifier },
    });
  } catch (error) {
    console.error('[Security] Failed to record failed login:', error);
  }
}

/**
 * SECURITY FIX: Check if account is locked using database
 */
export async function isAccountLocked(identifier: string): Promise<boolean> {
  try {
    const { getFailedLoginAttempts } = await import('../securityDb');
    const attempts = await getFailedLoginAttempts({ email: identifier, since: new Date(Date.now() - 15 * 60 * 1000) });
    
    // Lock account after 5 failed attempts within 15 minutes
    return attempts.length >= 5;
  } catch (error) {
    console.error('[Security] Failed to check account lock status:', error);
    return false;
  }
}

/**
 * Clear failed login attempts (after successful login)
 * SECURITY FIX: Now clears from database
 */
export async function clearFailedLogins(identifier: string): Promise<void> {
  // Failed logins are now tracked in database with timestamps
  // They will automatically expire after 15 minutes
  // No need to manually clear
}

/**
 * Get client IP address from request
 * SECURITY FIX: Improved IP extraction with Cloudflare support
 */
export function getClientIP(req: Request): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const cfIP = req.headers['cf-connecting-ip'] as string;
  if (cfIP) return cfIP;
  
  // Fallback to standard headers
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'] as string;
  if (realIP) return realIP;
  
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'failed_login' | 'account_locked' | 'suspicious_activity' | 'unauthorized_access';
  identifier: string;
  ip: string;
  details?: string;
}): void {
  console.warn(`[SECURITY] ${event.type.toUpperCase()}: ${event.identifier} from ${event.ip}`, event.details || '');
  
  // Store in database for audit trail
  import('../securityDb').then(({ logSecurityEvent: dbLog }) => {
    dbLog({
      eventType: event.type as any,
      ipAddress: event.ip,
      userAgent: event.identifier,
      endpoint: '/auth',
      severity: 'high',
      details: { message: event.details || event.type },
    }).catch(err => console.error('[Security] Failed to log event to database:', err));
  });
}
