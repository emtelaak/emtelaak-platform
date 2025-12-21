import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { platformSettings, InsertPlatformSetting } from "../../drizzle/schema";

/**
 * Get a platform setting by key
 */
export async function getPlatformSetting(settingKey: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.settingKey, settingKey))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Get all platform settings
 */
export async function getAllPlatformSettings() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(platformSettings);
}

/**
 * Upsert a platform setting (create or update)
 */
export async function upsertPlatformSetting(
  settingKey: string,
  settingValue: string,
  description: string | null,
  updatedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertPlatformSetting = {
    settingKey,
    settingValue,
    description,
    updatedBy,
  };

  await db
    .insert(platformSettings)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        settingValue,
        description,
        updatedBy,
        updatedAt: new Date(),
      },
    });

  return await getPlatformSetting(settingKey);
}

/**
 * Get platform fee percentage (default 2.5%)
 */
export async function getPlatformFeePercentage(): Promise<number> {
  const setting = await getPlatformSetting("platform_fee_percentage");
  if (!setting) return 2.5; // Default 2.5%
  return parseFloat(setting.settingValue);
}

/**
 * Get processing fee amount in cents (default $5 = 500 cents)
 */
export async function getProcessingFeeCents(): Promise<number> {
  const setting = await getPlatformSetting("processing_fee_cents");
  if (!setting) return 500; // Default $5
  return parseInt(setting.settingValue, 10);
}

/**
 * Update platform fee percentage
 */
export async function updatePlatformFeePercentage(
  percentage: number,
  updatedBy: number
) {
  if (percentage < 0 || percentage > 100) {
    throw new Error("Fee percentage must be between 0 and 100");
  }

  return await upsertPlatformSetting(
    "platform_fee_percentage",
    percentage.toString(),
    "Platform fee percentage charged on investments",
    updatedBy
  );
}

/**
 * Update processing fee amount
 */
export async function updateProcessingFeeCents(
  cents: number,
  updatedBy: number
) {
  if (cents < 0) {
    throw new Error("Processing fee must be non-negative");
  }

  return await upsertPlatformSetting(
    "processing_fee_cents",
    cents.toString(),
    "Fixed processing fee charged per investment transaction (in cents)",
    updatedBy
  );
}
