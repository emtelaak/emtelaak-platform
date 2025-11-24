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
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
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
        details: { message: 'Authentication rate limit exceeded', limit: 5, window: '15 minutes' },
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
 */
export function configureSecurityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://www.google.com", "https://maps.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.manus.im", "wss:", "https:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
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
 * Requirements: min 8 characters, uppercase, lowercase, number
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
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
  
  return { valid: true };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  mimetype: string;
  size: number;
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
  
  return { valid: true };
}

/**
 * Track failed login attempts
 * In-memory store (consider Redis for production)
 */
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

/**
 * Record failed login attempt
 */
export function recordFailedLogin(identifier: string): void {
  const current = failedLoginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
  
  // Reset count if last attempt was more than 15 minutes ago
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (current.lastAttempt < fifteenMinutesAgo) {
    current.count = 0;
  }
  
  current.count++;
  current.lastAttempt = new Date();
  
  failedLoginAttempts.set(identifier, current);
}

/**
 * Check if account is locked due to failed attempts
 */
export function isAccountLocked(identifier: string): boolean {
  const attempts = failedLoginAttempts.get(identifier);
  
  if (!attempts) return false;
  
  // Lock account after 5 failed attempts within 15 minutes
  if (attempts.count >= 5) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (attempts.lastAttempt > fifteenMinutesAgo) {
      return true;
    }
  }
  
  return false;
}

/**
 * Clear failed login attempts (after successful login)
 */
export function clearFailedLogins(identifier: string): void {
  failedLoginAttempts.delete(identifier);
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
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
  
  // TODO: Send notification to admins for critical events
  // TODO: Store in audit log for compliance
}
