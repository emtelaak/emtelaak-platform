import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hash Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * @param password Plain text password
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }

  return { isValid: true };
}

/**
 * Generate a secure random token for password reset
 * @returns Random token string
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}


/**
 * Generate a secure random token for email verification
 * @returns Random token string
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
