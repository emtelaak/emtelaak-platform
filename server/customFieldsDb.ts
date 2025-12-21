import { eq, and, desc } from "drizzle-orm";
import { customFields, customFieldValues, InsertCustomField, InsertCustomFieldValue } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Custom Fields Database Helper Functions
 */

// ============================================
// CUSTOM FIELD DEFINITIONS
// ============================================

/**
 * Get all custom fields for a specific module
 */
export async function getCustomFieldsByModule(module: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(customFields)
    .where(and(
      eq(customFields.module, module),
      eq(customFields.isActive, true)
    ))
    .orderBy(customFields.displayOrder);
}

/**
 * Get all custom fields (for admin management)
 */
export async function getAllCustomFields() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(customFields)
    .orderBy(customFields.module, customFields.displayOrder);
}

/**
 * Get a single custom field by ID
 */
export async function getCustomFieldById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(customFields)
    .where(eq(customFields.id, id))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Create a new custom field
 */
export async function createCustomField(data: InsertCustomField) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customFields).values(data);
  return result;
}

/**
 * Update a custom field
 */
export async function updateCustomField(id: number, data: Partial<InsertCustomField>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(customFields)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customFields.id, id));
}

/**
 * Delete a custom field (soft delete by setting isActive to false)
 */
export async function deleteCustomField(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(customFields)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(customFields.id, id));
}

/**
 * Hard delete a custom field and all its values
 */
export async function hardDeleteCustomField(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all values first
  await db
    .delete(customFieldValues)
    .where(eq(customFieldValues.fieldId, id));
  
  // Then delete the field definition
  await db
    .delete(customFields)
    .where(eq(customFields.id, id));
}

// ============================================
// CUSTOM FIELD VALUES
// ============================================

/**
 * Get all custom field values for a specific record
 */
export async function getCustomFieldValues(module: string, recordId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(customFieldValues)
    .where(and(
      eq(customFieldValues.module, module),
      eq(customFieldValues.recordId, recordId)
    ));
}

/**
 * Get custom field values with field definitions for a record
 */
export async function getCustomFieldValuesWithDefinitions(module: string, recordId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const values = await db
    .select({
      value: customFieldValues,
      field: customFields,
    })
    .from(customFieldValues)
    .leftJoin(customFields, eq(customFieldValues.fieldId, customFields.id))
    .where(and(
      eq(customFieldValues.module, module),
      eq(customFieldValues.recordId, recordId)
    ));
  
  return values;
}

/**
 * Save or update a custom field value
 */
export async function saveCustomFieldValue(data: InsertCustomFieldValue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if value already exists
  const existing = await db
    .select()
    .from(customFieldValues)
    .where(and(
      eq(customFieldValues.fieldId, data.fieldId),
      eq(customFieldValues.recordId, data.recordId),
      eq(customFieldValues.module, data.module)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing value
    await db
      .update(customFieldValues)
      .set({ 
        value: data.value,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        updatedAt: new Date() 
      })
      .where(eq(customFieldValues.id, existing[0].id));
    
    return existing[0].id;
  } else {
    // Insert new value
    const result = await db.insert(customFieldValues).values(data);
    return result;
  }
}

/**
 * Save multiple custom field values at once
 */
export async function saveMultipleCustomFieldValues(
  module: string,
  recordId: number,
  values: Array<{ fieldId: number; value: string; fileUrl?: string; fileName?: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const fieldValue of values) {
    await saveCustomFieldValue({
      fieldId: fieldValue.fieldId,
      recordId,
      module,
      value: fieldValue.value,
      fileUrl: fieldValue.fileUrl,
      fileName: fieldValue.fileName,
    });
  }
}

/**
 * Delete a custom field value
 */
export async function deleteCustomFieldValue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(customFieldValues)
    .where(eq(customFieldValues.id, id));
}

/**
 * Delete all custom field values for a record
 */
export async function deleteAllCustomFieldValues(module: string, recordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(customFieldValues)
    .where(and(
      eq(customFieldValues.module, module),
      eq(customFieldValues.recordId, recordId)
    ));
}

/**
 * Get custom field statistics
 */
export async function getCustomFieldStats() {
  const db = await getDb();
  if (!db) return null;
  
  const fields = await db.select().from(customFields);
  const values = await db.select().from(customFieldValues);
  
  const statsByModule: Record<string, { fields: number; values: number }> = {};
  
  fields.forEach(field => {
    if (!statsByModule[field.module]) {
      statsByModule[field.module] = { fields: 0, values: 0 };
    }
    statsByModule[field.module].fields++;
  });
  
  values.forEach(value => {
    if (!statsByModule[value.module]) {
      statsByModule[value.module] = { fields: 0, values: 0 };
    }
    statsByModule[value.module].values++;
  });
  
  return {
    totalFields: fields.length,
    totalValues: values.length,
    byModule: statsByModule,
  };
}
