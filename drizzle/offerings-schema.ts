import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, index, unique } from "drizzle-orm/mysql-core";
import { users, properties } from "./schema";

/**
 * OFFERINGS SYSTEM SCHEMA
 * Phase 1: Core Offering Management
 * 
 * This schema supports comprehensive property offering management with:
 * - Multiple offering types (Regulation D, A, Crowdfunding)
 * - Financial projections and modeling
 * - Fee structure management
 * - Document management with versioning
 * - Lifecycle and approval workflow
 */

// ============================================
// CORE OFFERINGS
// ============================================

export const offerings = mysqlTable("offerings", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fundraiserId: int("fundraiserId").notNull().references(() => users.id),
  
  // Offering Structure
  offeringType: mysqlEnum("offeringType", [
    "regulation_d_506b",
    "regulation_d_506c", 
    "regulation_a_tier1",
    "regulation_a_tier2",
    "regulation_cf",
    "private_placement",
    "other"
  ]).notNull(),
  
  // Offering Amounts (in cents)
  totalOfferingAmount: int("totalOfferingAmount").notNull(),
  minimumOfferingAmount: int("minimumOfferingAmount"),
  maximumOfferingAmount: int("maximumOfferingAmount"),
  currentFundedAmount: int("currentFundedAmount").default(0).notNull(),
  
  // Share/Token Structure
  shareType: varchar("shareType", { length: 100 }), // e.g., "Common Shares", "Preferred Units"
  totalShares: int("totalShares").notNull(),
  pricePerShare: int("pricePerShare").notNull(),
  availableShares: int("availableShares").notNull(),
  minimumSharePurchase: int("minimumSharePurchase").default(1).notNull(),
  maximumSharePurchase: int("maximumSharePurchase"),
  
  // Ownership Structure
  ownershipStructure: mysqlEnum("ownershipStructure", [
    "llc_membership",
    "corporation_stock",
    "limited_partnership",
    "reit_shares",
    "tokenized_ownership",
    "other"
  ]).notNull(),
  ownershipStructureDetails: text("ownershipStructureDetails"),
  
  // Holding Period and Exit
  holdingPeriodMonths: int("holdingPeriodMonths"),
  lockupPeriodMonths: int("lockupPeriodMonths"),
  exitStrategy: mysqlEnum("exitStrategy", [
    "property_sale",
    "refinance",
    "buyback",
    "secondary_market",
    "ipo",
    "other"
  ]),
  exitStrategyDetails: text("exitStrategyDetails"),
  expectedExitDate: timestamp("expectedExitDate"),
  
  // Lifecycle Status
  status: mysqlEnum("status", [
    "draft",
    "under_review",
    "approved",
    "active",
    "funding",
    "fully_funded",
    "closed",
    "cancelled"
  ]).default("draft").notNull(),
  
  // Timeline
  fundingStartDate: timestamp("fundingStartDate"),
  fundingEndDate: timestamp("fundingEndDate"),
  expectedClosingDate: timestamp("expectedClosingDate"),
  actualClosingDate: timestamp("actualClosingDate"),
  
  // Investor Count
  currentInvestorCount: int("currentInvestorCount").default(0),
  maximumInvestors: int("maximumInvestors"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedForReviewAt: timestamp("submittedForReviewAt"),
  approvedAt: timestamp("approvedAt"),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  propertyIdIdx: index("offering_property_id_idx").on(table.propertyId),
  fundraiserIdIdx: index("offering_fundraiser_id_idx").on(table.fundraiserId),
  statusIdx: index("offering_status_idx").on(table.status),
  offeringTypeIdx: index("offering_type_idx").on(table.offeringType),
}));

// ============================================
// FINANCIAL PROJECTIONS
// ============================================

export const offeringFinancialProjections = mysqlTable("offering_financial_projections", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Return Metrics (stored as percentage * 10000, e.g., 1250 = 12.50%)
  projectedIRR: int("projectedIRR"), // Internal Rate of Return
  projectedROI: int("projectedROI"), // Return on Investment
  projectedCashOnCash: int("projectedCashOnCash"), // Cash-on-Cash Return
  projectedEquityMultiple: int("projectedEquityMultiple"), // Equity Multiple (stored as * 100, e.g., 180 = 1.80x)
  
  // Rental Yield Projections (for buy-to-let)
  year1RentalYield: int("year1RentalYield"),
  year2RentalYield: int("year2RentalYield"),
  year3RentalYield: int("year3RentalYield"),
  year4RentalYield: int("year4RentalYield"),
  year5RentalYield: int("year5RentalYield"),
  annualYieldGrowthRate: int("annualYieldGrowthRate"),
  
  // Appreciation Projections (for buy-to-sell)
  year1Appreciation: int("year1Appreciation"),
  year2Appreciation: int("year2Appreciation"),
  year3Appreciation: int("year3Appreciation"),
  year4Appreciation: int("year4Appreciation"),
  year5Appreciation: int("year5Appreciation"),
  annualAppreciationRate: int("annualAppreciationRate"),
  
  // Cash Flow Projections (in cents)
  year1CashFlow: int("year1CashFlow"),
  year2CashFlow: int("year2CashFlow"),
  year3CashFlow: int("year3CashFlow"),
  year4CashFlow: int("year4CashFlow"),
  year5CashFlow: int("year5CashFlow"),
  
  // Distribution Schedule
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "semi_annual", "annual"]),
  firstDistributionDate: timestamp("firstDistributionDate"),
  estimatedAnnualDistribution: int("estimatedAnnualDistribution"), // in cents
  
  // Assumptions and Notes
  assumptionsNotes: text("assumptionsNotes"),
  
  // Sensitivity Analysis
  bestCaseIRR: int("bestCaseIRR"),
  baseCaseIRR: int("baseCaseIRR"),
  worstCaseIRR: int("worstCaseIRR"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("financial_projection_offering_id_idx").on(table.offeringId),
}));

// ============================================
// FEE STRUCTURE
// ============================================

export const offeringFees = mysqlTable("offering_fees", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Platform Fees (percentage * 10000)
  platformFeePercentage: int("platformFeePercentage").default(0).notNull(),
  platformFeeFixed: int("platformFeeFixed").default(0).notNull(), // in cents
  platformFeeDescription: text("platformFeeDescription"),
  
  // Management Fees (percentage * 10000)
  managementFeePercentage: int("managementFeePercentage").default(0).notNull(),
  managementFeeFixed: int("managementFeeFixed").default(0).notNull(), // in cents
  managementFeeDescription: text("managementFeeDescription"),
  
  // Performance Fees (percentage * 10000)
  performanceFeePercentage: int("performanceFeePercentage").default(0).notNull(),
  performanceFeeHurdleRate: int("performanceFeeHurdleRate"), // minimum return before performance fee applies
  performanceFeeDescription: text("performanceFeeDescription"),
  
  // Maintenance Fees (percentage * 10000)
  maintenanceFeePercentage: int("maintenanceFeePercentage").default(0).notNull(),
  maintenanceFeeFixed: int("maintenanceFeeFixed").default(0).notNull(), // in cents
  maintenanceFeeDescription: text("maintenanceFeeDescription"),
  
  // Acquisition Fees (percentage * 10000)
  acquisitionFeePercentage: int("acquisitionFeePercentage").default(0).notNull(),
  acquisitionFeeFixed: int("acquisitionFeeFixed").default(0).notNull(), // in cents
  acquisitionFeeDescription: text("acquisitionFeeDescription"),
  
  // Disposition Fees (percentage * 10000)
  dispositionFeePercentage: int("dispositionFeePercentage").default(0).notNull(),
  dispositionFeeFixed: int("dispositionFeeFixed").default(0).notNull(), // in cents
  dispositionFeeDescription: text("dispositionFeeDescription"),
  
  // Other Fees
  otherFeesDescription: text("otherFeesDescription"),
  otherFeesAmount: int("otherFeesAmount").default(0).notNull(), // in cents
  
  // Total Fee Impact
  totalEstimatedAnnualFees: int("totalEstimatedAnnualFees"), // in cents
  feeImpactOnReturns: int("feeImpactOnReturns"), // percentage * 10000
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_fees_offering_id_idx").on(table.offeringId),
}));

// ============================================
// DOCUMENTS
// ============================================

export const offeringDocuments = mysqlTable("offering_documents", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Document Classification
  documentCategory: mysqlEnum("documentCategory", [
    "legal",
    "financial",
    "compliance",
    "marketing",
    "other"
  ]).notNull(),
  
  documentType: mysqlEnum("documentType", [
    // Legal Documents
    "offering_memorandum",
    "subscription_agreement",
    "operating_agreement",
    "ppm", // Private Placement Memorandum
    "risk_disclosure",
    "terms_and_conditions",
    
    // Financial Documents
    "financial_model",
    "historical_financials",
    "pro_forma_statements",
    "tax_documents",
    "audit_report",
    
    // Compliance Documents
    "regulatory_approval",
    "certification",
    "compliance_report",
    "kyc_aml_policy",
    
    // Marketing Documents
    "presentation_deck",
    "property_brochure",
    "executive_summary",
    
    // Other
    "other"
  ]).notNull(),
  
  // Document Details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // File Information
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // in bytes
  
  // Version Control
  version: int("version").default(1).notNull(),
  isLatestVersion: boolean("isLatestVersion").default(true).notNull(),
  previousVersionId: int("previousVersionId").references((): any => offeringDocuments.id),
  
  // Access Control
  isPublic: boolean("isPublic").default(false).notNull(),
  requiresAccreditedInvestor: boolean("requiresAccreditedInvestor").default(false).notNull(),
  
  // Metadata
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_document_offering_id_idx").on(table.offeringId),
  documentCategoryIdx: index("offering_document_category_idx").on(table.documentCategory),
  documentTypeIdx: index("offering_document_type_idx").on(table.documentType),
}));

// ============================================
// TIMELINE AND MILESTONES
// ============================================

export const offeringTimeline = mysqlTable("offering_timeline", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  milestoneType: mysqlEnum("milestoneType", [
    "offering_created",
    "submitted_for_review",
    "approved",
    "funding_started",
    "25_percent_funded",
    "50_percent_funded",
    "75_percent_funded",
    "fully_funded",
    "funding_closed",
    "property_acquired",
    "first_distribution",
    "property_sold",
    "offering_closed",
    "custom"
  ]).notNull(),
  
  milestoneName: varchar("milestoneName", { length: 255 }).notNull(),
  milestoneDescription: text("milestoneDescription"),
  
  targetDate: timestamp("targetDate"),
  actualDate: timestamp("actualDate"),
  
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedBy: int("completedBy").references(() => users.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_timeline_offering_id_idx").on(table.offeringId),
  milestoneTypeIdx: index("offering_timeline_milestone_type_idx").on(table.milestoneType),
}));

// ============================================
// STATUS HISTORY (AUDIT TRAIL)
// ============================================

export const offeringStatusHistory = mysqlTable("offering_status_history", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  previousStatus: mysqlEnum("previousStatus", [
    "draft",
    "under_review",
    "approved",
    "active",
    "funding",
    "fully_funded",
    "closed",
    "cancelled"
  ]),
  
  newStatus: mysqlEnum("newStatus", [
    "draft",
    "under_review",
    "approved",
    "active",
    "funding",
    "fully_funded",
    "closed",
    "cancelled"
  ]).notNull(),
  
  changedBy: int("changedBy").notNull().references(() => users.id),
  changeReason: text("changeReason"),
  changeNotes: text("changeNotes"),
  
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_status_history_offering_id_idx").on(table.offeringId),
  changedAtIdx: index("offering_status_history_changed_at_idx").on(table.changedAt),
}));

// ============================================
// APPROVAL WORKFLOW
// ============================================

export const offeringApprovals = mysqlTable("offering_approvals", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  reviewerId: int("reviewerId").notNull().references(() => users.id),
  reviewerRole: mysqlEnum("reviewerRole", [
    "admin",
    "compliance_officer",
    "legal_reviewer",
    "financial_reviewer",
    "executive_approver"
  ]).notNull(),
  
  decision: mysqlEnum("decision", [
    "pending",
    "approved",
    "rejected",
    "changes_requested"
  ]).default("pending").notNull(),
  
  comments: text("comments"),
  reviewedAt: timestamp("reviewedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_approval_offering_id_idx").on(table.offeringId),
  reviewerIdIdx: index("offering_approval_reviewer_id_idx").on(table.reviewerId),
  decisionIdx: index("offering_approval_decision_idx").on(table.decision),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

export type OfferingFinancialProjection = typeof offeringFinancialProjections.$inferSelect;
export type InsertOfferingFinancialProjection = typeof offeringFinancialProjections.$inferInsert;

export type OfferingFee = typeof offeringFees.$inferSelect;
export type InsertOfferingFee = typeof offeringFees.$inferInsert;

export type OfferingDocument = typeof offeringDocuments.$inferSelect;
export type InsertOfferingDocument = typeof offeringDocuments.$inferInsert;

export type OfferingTimeline = typeof offeringTimeline.$inferSelect;
export type InsertOfferingTimeline = typeof offeringTimeline.$inferInsert;

export type OfferingStatusHistory = typeof offeringStatusHistory.$inferSelect;
export type InsertOfferingStatusHistory = typeof offeringStatusHistory.$inferInsert;

export type OfferingApproval = typeof offeringApprovals.$inferSelect;
export type InsertOfferingApproval = typeof offeringApprovals.$inferInsert;
