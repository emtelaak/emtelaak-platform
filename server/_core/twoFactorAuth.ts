/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, verification, and backup codes
 */

import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Generate a new 2FA secret and QR code for user setup
 */
export async function generate2FASecret(userEmail: string, appName: string = "Emtelaak"): Promise<TwoFactorSetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${appName} (${userEmail})`,
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify a TOTP code against a secret
 */
export function verify2FACode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Verify a backup code against hashed codes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

/**
 * Remove a used backup code from the list
 */
export function removeUsedBackupCode(code: string, hashedCodes: string[]): string[] {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.filter(c => c !== hashedInput);
}
