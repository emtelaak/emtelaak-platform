import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { users, properties } from "./schema";
import { offerings } from "./offerings-schema";

/**
 * INVESTMENT FLOW SCHEMA - PHASE B
 * Enhanced investment system with full offering integration
 * 
 * This schema supports:
 * - Offering-based investments with share tracking
 * - Multi-step transaction workflow (reserve → pay → complete)
 * - Payment method flexibility (bank transfer, card, wallet)
 * - Investor accreditation verification
 * - Investment documents and agreements
 * - Distribution tracking and history
 */

// ============================================
// CORE INVESTMENTS (OFFERING-BASED)
// ============================================

export const offeringInvestments = mysqlTable("offering_investments", {
  id: int("id").autoincrement().primaryKey(),
  
  // References
  userId: int("userId").notNull().references(() => users.id),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  propertyId: int("propertyId").notNull().references(() => properties.id),
  
  // Investment Details
  numberOfShares: int("numberOfShares").notNull(),
  pricePerShare: int("pricePerShare").notNull(), // in cents, snapshot from offering
  investmentAmount: int("investmentAmount").notNull(), // numberOfShares * pricePerShare
  
  // Fees (calculated at creation)
  platformFeePercentage: int("platformFeePercentage").default(0), // percentage * 100
  platformFeeAmount: int("platformFeeAmount").default(0), // in cents
  processingFeeAmount: int("processingFeeAmount").default(0), // in cents
  totalAmount: int("totalAmount").notNull(), // investmentAmount + all fees
  
  // Ownership
  ownershipPercentage: int("ownershipPercentage").notNull(), // percentage * 10000 (e.g., 100 = 0.01%)
  
  // Investment Status
  status: mysqlEnum("status", [
    "reserved",      // Shares reserved, awaiting payment
    "pending_payment", // Payment initiated
    "payment_processing", // Payment being verified
    "payment_failed", // Payment failed
    "completed",     // Investment completed, shares allocated
    "cancelled",     // Cancelled before payment
    "refunded"       // Payment refunded
  ]).notNull().default("reserved"),
  
  // Reservation Management
  reservedAt: timestamp("reservedAt").defaultNow().notNull(),
  reservationExpiresAt: timestamp("reservationExpiresAt").notNull(), // 15-30 minutes from reservation
  
  // Payment Information
  paymentMethod: mysqlEnum("paymentMethod", [
    "bank_transfer",
    "credit_card",
    "debit_card",
    "wallet",
    "wire_transfer",
    "check"
  ]),
  paymentStatus: mysqlEnum("paymentStatus", [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded"
  ]).default("pending"),
  paymentReference: varchar("paymentReference", { length: 255 }), // Transaction ID from payment gateway
  paymentProofUrl: text("paymentProofUrl"), // For bank transfers
  paymentProofKey: text("paymentProofKey"), // S3 key for payment proof
  paidAt: timestamp("paidAt"),
  
  // Investor Verification
  isAccreditedInvestor: boolean("isAccreditedInvestor").default(false).notNull(),
  accreditationVerifiedAt: timestamp("accreditationVerifiedAt"),
  accreditationDocumentUrl: text("accreditationDocumentUrl"),
  
  // Agreement & Documents
  agreementAcceptedAt: timestamp("agreementAcceptedAt"),
  agreementIpAddress: varchar("agreementIpAddress", { length: 45 }),
  agreementUserAgent: text("agreementUserAgent"),
  
  // Certificate
  certificateIssued: boolean("certificateIssued").default(false),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  certificateNumber: varchar("certificateNumber", { length: 100 }),
  certificateUrl: text("certificateUrl"),
  
  // Completion
  completedAt: timestamp("completedAt"),
  
  // Distribution Settings
  distributionFrequency: mysqlEnum("distributionFrequency", [
    "monthly",
    "quarterly",
    "semi_annual",
    "annual"
  ]),
  firstDistributionDate: timestamp("firstDistributionDate"),
  
  // Exit
  exitedAt: timestamp("exitedAt"),
  exitReason: text("exitReason"),
  exitAmount: int("exitAmount"), // in cents
  
  // Metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  notes: text("notes"), // Admin notes
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("offering_investments_user_id_idx").on(table.userId),
  offeringIdIdx: index("offering_investments_offering_id_idx").on(table.offeringId),
  propertyIdIdx: index("offering_investments_property_id_idx").on(table.propertyId),
  statusIdx: index("offering_investments_status_idx").on(table.status),
  paymentStatusIdx: index("offering_investments_payment_status_idx").on(table.paymentStatus),
  reservationExpiresIdx: index("offering_investments_reservation_expires_idx").on(table.reservationExpiresAt),
}));

export type OfferingInvestment = typeof offeringInvestments.$inferSelect;
export type InsertOfferingInvestment = typeof offeringInvestments.$inferInsert;

// ============================================
// INVESTMENT DOCUMENTS
// ============================================

export const offeringInvestmentDocuments = mysqlTable("offering_investment_documents", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull().references(() => offeringInvestments.id, { onDelete: "cascade" }),
  
  documentType: mysqlEnum("documentType", [
    "subscription_agreement",
    "operating_agreement",
    "accreditation_verification",
    "payment_proof",
    "share_certificate",
    "tax_document",
    "other"
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // in bytes
  
  uploadedBy: int("uploadedBy").references(() => users.id),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  
  // Signature tracking for agreements
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"), // Base64 signature image or digital signature
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  investmentIdIdx: index("offering_investment_docs_investment_id_idx").on(table.investmentId),
  documentTypeIdx: index("offering_investment_docs_type_idx").on(table.documentType),
}));

export type OfferingInvestmentDocument = typeof offeringInvestmentDocuments.$inferSelect;
export type InsertOfferingInvestmentDocument = typeof offeringInvestmentDocuments.$inferInsert;

// ============================================
// INCOME DISTRIBUTIONS
// ============================================

export const offeringDistributions = mysqlTable("offering_distributions", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull().references(() => offeringInvestments.id, { onDelete: "cascade" }),
  offeringId: int("offeringId").notNull().references(() => offerings.id),
  userId: int("userId").notNull().references(() => users.id),
  
  // Distribution Details
  distributionType: mysqlEnum("distributionType", [
    "rental_income",
    "capital_gain",
    "dividend",
    "interest",
    "other"
  ]).notNull(),
  
  distributionPeriod: varchar("distributionPeriod", { length: 50 }), // e.g., "Q1 2024", "January 2024"
  distributionDate: timestamp("distributionDate").notNull(),
  
  // Amounts (in cents)
  grossAmount: int("grossAmount").notNull(), // Before taxes/fees
  taxWithheld: int("taxWithheld").default(0), // Tax withheld
  feesDeducted: int("feesDeducted").default(0), // Management fees, etc.
  netAmount: int("netAmount").notNull(), // Amount paid to investor
  
  // Payment
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  paymentStatus: mysqlEnum("paymentStatus", [
    "pending",
    "processing",
    "completed",
    "failed"
  ]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  
  // Metadata
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  investmentIdIdx: index("offering_distributions_investment_id_idx").on(table.investmentId),
  offeringIdIdx: index("offering_distributions_offering_id_idx").on(table.offeringId),
  userIdIdx: index("offering_distributions_user_id_idx").on(table.userId),
  distributionDateIdx: index("offering_distributions_date_idx").on(table.distributionDate),
  paymentStatusIdx: index("offering_distributions_payment_status_idx").on(table.paymentStatus),
}));

export type OfferingDistribution = typeof offeringDistributions.$inferSelect;
export type InsertOfferingDistribution = typeof offeringDistributions.$inferInsert;

// ============================================
// INVESTMENT STATUS HISTORY
// ============================================

export const offeringInvestmentHistory = mysqlTable("offering_investment_history", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull().references(() => offeringInvestments.id, { onDelete: "cascade" }),
  
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  
  changeReason: text("changeReason"),
  changeNotes: text("changeNotes"),
  
  changedBy: int("changedBy").references(() => users.id),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  
  // Metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
}, (table) => ({
  investmentIdIdx: index("offering_investment_history_investment_id_idx").on(table.investmentId),
  changedAtIdx: index("offering_investment_history_changed_at_idx").on(table.changedAt),
}));

export type OfferingInvestmentHistory = typeof offeringInvestmentHistory.$inferSelect;
export type InsertOfferingInvestmentHistory = typeof offeringInvestmentHistory.$inferInsert;
