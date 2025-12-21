import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { customFieldTemplates, type InsertCustomFieldTemplate } from "../drizzle/schema";

/**
 * Get all templates for a specific module
 */
export async function getTemplatesByModule(module: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(customFieldTemplates)
    .where(and(
      eq(customFieldTemplates.module, module),
      eq(customFieldTemplates.isActive, true)
    ))
    .orderBy(customFieldTemplates.nameEn);
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(customFieldTemplates)
    .where(eq(customFieldTemplates.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Create a new template
 */
export async function createTemplate(template: InsertCustomFieldTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(customFieldTemplates).values(template).$returningId();
  return { templateId: result.id };
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: number, updates: Partial<InsertCustomFieldTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customFieldTemplates)
    .set(updates)
    .where(eq(customFieldTemplates.id, id));

  return { success: true };
}

/**
 * Delete a template (only non-system templates)
 */
export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if it's a system template
  const template = await getTemplateById(id);
  if (template?.isSystem) {
    throw new Error("Cannot delete system templates");
  }

  await db
    .delete(customFieldTemplates)
    .where(eq(customFieldTemplates.id, id));

  return { success: true };
}

/**
 * Get all templates (admin only)
 */
export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(customFieldTemplates)
    .orderBy(customFieldTemplates.module, customFieldTemplates.nameEn);
}

/**
 * Seed system templates
 */
export async function seedSystemTemplates() {
  const db = await getDb();
  if (!db) return;

  const templates: InsertCustomFieldTemplate[] = [
    {
      nameEn: "Real Estate Basics",
      nameAr: "أساسيات العقارات",
      descriptionEn: "Essential real estate property fields",
      descriptionAr: "حقول العقارات الأساسية",
      module: "properties",
      isSystem: true,
      fields: JSON.stringify([
        {
          fieldKey: "property_manager",
          labelEn: "Property Manager",
          labelAr: "مدير العقار",
          fieldType: "text",
          isRequired: false,
          showInAdmin: true,
          showInUserForm: false,
        },
        {
          fieldKey: "maintenance_fee",
          labelEn: "Monthly Maintenance Fee",
          labelAr: "رسوم الصيانة الشهرية",
          fieldType: "number",
          isRequired: false,
          showInAdmin: true,
          showInUserForm: true,
          placeholderEn: "Enter amount in cents",
          placeholderAr: "أدخل المبلغ بالسنت",
        },
        {
          fieldKey: "insurance_provider",
          labelEn: "Insurance Provider",
          labelAr: "مزود التأمين",
          fieldType: "text",
          isRequired: false,
          showInAdmin: true,
          showInUserForm: false,
        },
        {
          fieldKey: "property_country",
          labelEn: "Property Country",
          labelAr: "دولة العقار",
          fieldType: "country",
          isRequired: true,
          showInAdmin: true,
          showInUserForm: true,
        },
      ]),
    },
    {
      nameEn: "KYC Extended",
      nameAr: "معرفة العميل الموسعة",
      descriptionEn: "Extended KYC fields for user verification",
      descriptionAr: "حقول معرفة العميل الموسعة للتحقق من المستخدم",
      module: "users",
      isSystem: true,
      fields: JSON.stringify([
        {
          fieldKey: "passport_number",
          labelEn: "Passport Number",
          labelAr: "رقم جواز السفر",
          fieldType: "text",
          isRequired: true,
          showInAdmin: true,
          showInUserForm: true,
        },
        {
          fieldKey: "passport_expiry",
          labelEn: "Passport Expiry Date",
          labelAr: "تاريخ انتهاء جواز السفر",
          fieldType: "date",
          isRequired: true,
          showInAdmin: true,
          showInUserForm: true,
        },
        {
          fieldKey: "nationality",
          labelEn: "Nationality",
          labelAr: "الجنسية",
          fieldType: "country",
          isRequired: true,
          showInAdmin: true,
          showInUserForm: true,
        },
        {
          fieldKey: "tax_id",
          labelEn: "Tax ID Number",
          labelAr: "الرقم الضريبي",
          fieldType: "text",
          isRequired: false,
          showInAdmin: true,
          showInUserForm: true,
        },
        {
          fieldKey: "employment_status",
          labelEn: "Employment Status",
          labelAr: "حالة التوظيف",
          fieldType: "dropdown",
          config: JSON.stringify({
            options: [
              { value: "employed", label: "Employed" },
              { value: "self_employed", label: "Self Employed" },
              { value: "unemployed", label: "Unemployed" },
              { value: "retired", label: "Retired" },
            ],
          }),
          isRequired: true,
          showInAdmin: true,
          showInUserForm: true,
        },
      ]),
    },
    {
      nameEn: "Lead Qualification",
      nameAr: "تأهيل العملاء المحتملين",
      descriptionEn: "Fields for qualifying CRM leads",
      descriptionAr: "حقول لتأهيل العملاء المحتملين في CRM",
      module: "leads",
      isSystem: true,
      fields: JSON.stringify([
        {
          fieldKey: "lead_source",
          labelEn: "Lead Source",
          labelAr: "مصدر العميل المحتمل",
          fieldType: "dropdown",
          config: JSON.stringify({
            options: [
              { value: "website", label: "Website" },
              { value: "referral", label: "Referral" },
              { value: "social_media", label: "Social Media" },
              { value: "event", label: "Event" },
              { value: "other", label: "Other" },
            ],
          }),
          isRequired: true,
          showInAdmin: true,
          showInUserForm: false,
        },
        {
          fieldKey: "budget_range",
          labelEn: "Budget Range",
          labelAr: "نطاق الميزانية",
          fieldType: "dropdown",
          config: JSON.stringify({
            options: [
              { value: "under_50k", label: "Under $50,000" },
              { value: "50k_100k", label: "$50,000 - $100,000" },
              { value: "100k_250k", label: "$100,000 - $250,000" },
              { value: "250k_500k", label: "$250,000 - $500,000" },
              { value: "over_500k", label: "Over $500,000" },
            ],
          }),
          isRequired: false,
          showInAdmin: true,
          showInUserForm: false,
        },
        {
          fieldKey: "investment_timeline",
          labelEn: "Investment Timeline",
          labelAr: "الجدول الزمني للاستثمار",
          fieldType: "dropdown",
          config: JSON.stringify({
            options: [
              { value: "immediate", label: "Immediate (0-3 months)" },
              { value: "short_term", label: "Short Term (3-6 months)" },
              { value: "medium_term", label: "Medium Term (6-12 months)" },
              { value: "long_term", label: "Long Term (12+ months)" },
            ],
          }),
          isRequired: false,
          showInAdmin: true,
          showInUserForm: false,
        },
      ]),
    },
  ];

  // Check if templates already exist
  for (const template of templates) {
    const existing = await db
      .select()
      .from(customFieldTemplates)
      .where(and(
        eq(customFieldTemplates.nameEn, template.nameEn),
        eq(customFieldTemplates.module, template.module)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(customFieldTemplates).values(template);
    }
  }
}
