import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { propertyImages, InsertPropertyImage } from "../../drizzle/schema";

export async function createPropertyImage(data: InsertPropertyImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [image] = await db.insert(propertyImages).values(data).$returningId();
  return image.id;
}

export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(desc(propertyImages.isPrimary), propertyImages.displayOrder);
}

export async function getPrimaryImage(propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [image] = await db
    .select()
    .from(propertyImages)
    .where(and(
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.isPrimary, true)
    ))
    .limit(1);

  return image;
}

export async function setPrimaryImage(imageId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First, unset all primary images for this property
  await db
    .update(propertyImages)
    .set({ isPrimary: false })
    .where(eq(propertyImages.propertyId, propertyId));

  // Then set the new primary image
  await db
    .update(propertyImages)
    .set({ isPrimary: true })
    .where(eq(propertyImages.id, imageId));
}

export async function updateImageOrder(imageId: number, displayOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(propertyImages)
    .set({ displayOrder })
    .where(eq(propertyImages.id, imageId));
}

export async function deletePropertyImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [image] = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.id, imageId))
    .limit(1);

  if (!image) throw new Error("Image not found");

  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));

  return image; // Return the deleted image for S3 cleanup
}
