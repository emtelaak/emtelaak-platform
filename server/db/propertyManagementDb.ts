import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { properties, InsertProperty } from "../../drizzle/schema";

/**
 * Create a new property (admin/fundraiser only)
 */
export async function createProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(data).$returningId();
  return result[0].id;
}

/**
 * Update property details (admin/fundraiser only)
 */
export async function updateProperty(
  propertyId: number,
  updates: Partial<InsertProperty>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(properties)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));

  return { success: true };
}

/**
 * Update property share price (admin/fundraiser only)
 */
export async function updatePropertySharePrice(
  propertyId: number,
  sharePrice: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate share price
  if (sharePrice < 0) {
    throw new Error("Share price cannot be negative");
  }

  await db
    .update(properties)
    .set({
      sharePrice,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));

  return { success: true, sharePrice };
}

/**
 * Get property by ID (for management purposes)
 */
export async function getPropertyForManagement(propertyId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all properties for management (admin/fundraiser only)
 */
export async function getAllPropertiesForManagement() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(properties);
}
