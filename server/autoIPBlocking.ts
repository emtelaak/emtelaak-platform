import { getSecurityEventsByIP } from "./securityDb";
import { blockIP, isIPBlocked } from "./ipBlockingDb";
import { isIPWhitelisted } from "./_core/ipBlockingMiddleware";
import { getDb } from "./db";
import { securitySettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Default configuration for automatic IP blocking rules
 * Used as fallback when database is unavailable
 */
export const DEFAULT_AUTO_BLOCK_CONFIG = {
  failedLoginThreshold: 5,
  failedLoginWindowMinutes: 15,
  rateLimitThreshold: 10,
  rateLimitWindowMinutes: 10,
  suspiciousActivityThreshold: 3,
  suspiciousActivityWindowMinutes: 30,
  autoBlockExpiryHours: 24,
};

/**
 * Get security settings from database
 * Returns default config if database is unavailable
 */
export async function getAutoBlockConfig() {
  const db = await getDb();
  if (!db) {
    console.warn("[Auto Block] Database unavailable, using default config");
    return DEFAULT_AUTO_BLOCK_CONFIG;
  }

  try {
    const settings = await db.select().from(securitySettings);
    
    const config = { ...DEFAULT_AUTO_BLOCK_CONFIG };
    
    for (const setting of settings) {
      const value = parseInt(setting.settingValue, 10);
      if (isNaN(value)) continue;
      
      switch (setting.settingKey) {
        case 'failed_login_threshold':
          config.failedLoginThreshold = value;
          break;
        case 'failed_login_window_minutes':
          config.failedLoginWindowMinutes = value;
          break;
        case 'rate_limit_threshold':
          config.rateLimitThreshold = value;
          break;
        case 'rate_limit_window_minutes':
          config.rateLimitWindowMinutes = value;
          break;
        case 'suspicious_activity_threshold':
          config.suspiciousActivityThreshold = value;
          break;
        case 'suspicious_activity_window_minutes':
          config.suspiciousActivityWindowMinutes = value;
          break;
        case 'auto_block_expiry_hours':
          config.autoBlockExpiryHours = value;
          break;
      }
    }
    
    return config;
  } catch (error) {
    console.error("[Auto Block] Failed to load settings from database:", error);
    return DEFAULT_AUTO_BLOCK_CONFIG;
  }
}

/**
 * Check if an IP should be automatically blocked based on failed login attempts
 */
export async function checkFailedLoginAutoBlock(ipAddress: string): Promise<boolean> {
  // Skip if IP is whitelisted or already blocked
  if (isIPWhitelisted(ipAddress) || await isIPBlocked(ipAddress)) {
    return false;
  }

  const config = await getAutoBlockConfig();

  const windowStart = new Date(
    Date.now() - config.failedLoginWindowMinutes * 60 * 1000
  );

  const events = await getSecurityEventsByIP({
    ipAddress,
    eventType: "failed_login",
    startDate: windowStart,
  });

  if (events.length >= config.failedLoginThreshold) {
    const expiresAt = new Date(
      Date.now() + config.autoBlockExpiryHours * 60 * 60 * 1000
    );

    await blockIP({
      ipAddress,
      reason: `Automatic block: ${events.length} failed login attempts in ${config.failedLoginWindowMinutes} minutes`,
      blockType: "automatic",
      expiresAt,
    });

    console.log(`[Auto Block] Blocked ${ipAddress} for failed login attempts`);
    return true;
  }

  return false;
}

/**
 * Check if an IP should be automatically blocked based on rate limit hits
 */
export async function checkRateLimitAutoBlock(ipAddress: string): Promise<boolean> {
  // Skip if IP is whitelisted or already blocked
  if (isIPWhitelisted(ipAddress) || await isIPBlocked(ipAddress)) {
    return false;
  }

  const config = await getAutoBlockConfig();

  const windowStart = new Date(
    Date.now() - config.rateLimitWindowMinutes * 60 * 1000
  );

  const events = await getSecurityEventsByIP({
    ipAddress,
    eventType: "rate_limit_hit",
    startDate: windowStart,
  });

  if (events.length >= config.rateLimitThreshold) {
    const expiresAt = new Date(
      Date.now() + config.autoBlockExpiryHours * 60 * 60 * 1000
    );

    await blockIP({
      ipAddress,
      reason: `Automatic block: ${events.length} rate limit hits in ${config.rateLimitWindowMinutes} minutes`,
      blockType: "automatic",
      expiresAt,
    });

    console.log(`[Auto Block] Blocked ${ipAddress} for rate limit violations`);
    return true;
  }

  return false;
}

/**
 * Check if an IP should be automatically blocked based on suspicious activities
 */
export async function checkSuspiciousActivityAutoBlock(ipAddress: string): Promise<boolean> {
  // Skip if IP is whitelisted or already blocked
  if (isIPWhitelisted(ipAddress) || await isIPBlocked(ipAddress)) {
    return false;
  }

  const config = await getAutoBlockConfig();

  const windowStart = new Date(
    Date.now() - config.suspiciousActivityWindowMinutes * 60 * 1000
  );

  const events = await getSecurityEventsByIP({
    ipAddress,
    eventType: "suspicious_activity",
    startDate: windowStart,
  });

  if (events.length >= config.suspiciousActivityThreshold) {
    const expiresAt = new Date(
      Date.now() + config.autoBlockExpiryHours * 60 * 60 * 1000
    );

    await blockIP({
      ipAddress,
      reason: `Automatic block: ${events.length} suspicious activities in ${config.suspiciousActivityWindowMinutes} minutes`,
      blockType: "automatic",
      expiresAt,
    });

    console.log(`[Auto Block] Blocked ${ipAddress} for suspicious activities`);
    return true;
  }

  return false;
}

/**
 * Check all automatic blocking rules for an IP
 */
export async function checkAutoBlockRules(ipAddress: string): Promise<boolean> {
  const results = await Promise.all([
    checkFailedLoginAutoBlock(ipAddress),
    checkRateLimitAutoBlock(ipAddress),
    checkSuspiciousActivityAutoBlock(ipAddress),
  ]);

  return results.some(blocked => blocked);
}
