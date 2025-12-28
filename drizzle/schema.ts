import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, unique, json, tinyint } from "drizzle-orm/mysql-core";

/**
 * Emtelaak Platform Database Schema
 * Comprehensive schema for fractional real estate investment platform
 */

// ============================================
// USERS AND AUTHENTICATION
// ============================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }), // Hashed password for password-based auth
  passwordResetToken: varchar("passwordResetToken", { length: 255 }), // Token for password reset
  passwordResetExpiry: timestamp("passwordResetExpiry"), // Expiry time for reset token
  emailVerified: boolean("emailVerified").default(false).notNull(), // Email verification status
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }), // Token for email verification
  emailVerificationExpiry: timestamp("emailVerificationExpiry"), // Expiry time for verification token
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "investor", "fund_manager", "admin", "super_admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "pending_verification", "approved"]).default("pending_verification").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"), // Last successful login timestamp
});

export const adminPermissions = mysqlTable("admin_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  // User Management
  canManageUsers: boolean("canManageUsers").default(false).notNull(),
  canBulkUploadUsers: boolean("canBulkUploadUsers").default(false).notNull(),
  // Content Management
  canEditContent: boolean("canEditContent").default(false).notNull(),
  canManageProperties: boolean("canManageProperties").default(false).notNull(),
  // KYC & Verification
  canReviewKYC: boolean("canReviewKYC").default(false).notNull(),
  canApproveInvestments: boolean("canApproveInvestments").default(false).notNull(),
  // Financial
  canManageTransactions: boolean("canManageTransactions").default(false).notNull(),
  canViewFinancials: boolean("canViewFinancials").default(false).notNull(),
  canEditInvoices: boolean("canEditInvoices").default(false).notNull(),
  canDeleteInvoices: boolean("canDeleteInvoices").default(false).notNull(),
  // System
  canAccessCRM: boolean("canAccessCRM").default(false).notNull(),
  canViewAnalytics: boolean("canViewAnalytics").default(false).notNull(),
  canManageSettings: boolean("canManageSettings").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("password_reset_user_id_idx").on(table.userId),
  tokenIdx: index("password_reset_token_idx").on(table.token),
}));

export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: text("sessionId").notNull(), // JWT token ID or unique session identifier
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceInfo: text("deviceInfo"), // Device name, OS, browser
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  location: varchar("location", { length: 255 }), // City, Country
  browser: varchar("browser", { length: 100 }), // Browser name and version
  loginTime: timestamp("loginTime").defaultNow().notNull(),
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
  sessionIdIdx: index("user_sessions_session_id_idx").on(table.sessionId),
  expiresAtIdx: index("user_sessions_expires_at_idx").on(table.expiresAt),
  // Composite index for session cleanup queries (userId + expiresAt)
  userExpiresIdx: index("user_sessions_user_expires_idx").on(table.userId, table.expiresAt),
}));

export const permissionRoleTemplates = mysqlTable("permission_role_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  // User Management
  canManageUsers: boolean("canManageUsers").default(false).notNull(),
  canBulkUploadUsers: boolean("canBulkUploadUsers").default(false).notNull(),
  // Content Management
  canEditContent: boolean("canEditContent").default(false).notNull(),
  canManageProperties: boolean("canManageProperties").default(false).notNull(),
  // KYC & Verification
  canReviewKYC: boolean("canReviewKYC").default(false).notNull(),
  canApproveInvestments: boolean("canApproveInvestments").default(false).notNull(),
  // Financial
  canManageTransactions: boolean("canManageTransactions").default(false).notNull(),
  canViewFinancials: boolean("canViewFinancials").default(false).notNull(),
  // System
  canAccessCRM: boolean("canAccessCRM").default(false).notNull(),
  canViewAnalytics: boolean("canViewAnalytics").default(false).notNull(),
  canManageSettings: boolean("canManageSettings").default(false).notNull(),
  isSystem: boolean("isSystem").default(false).notNull(), // System templates cannot be deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  profilePicture: text("profilePicture"),
  firstNameEn: varchar("firstNameEn", { length: 100 }),
  lastNameEn: varchar("lastNameEn", { length: 100 }),
  firstNameAr: varchar("firstNameAr", { length: 100 }),
  lastNameAr: varchar("lastNameAr", { length: 100 }),
  dateOfBirth: timestamp("dateOfBirth"),
  nationality: varchar("nationality", { length: 100 }),
  addressLine1: text("addressLine1"),
  addressLine2: text("addressLine2"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  employmentStatus: varchar("employmentStatus", { length: 50 }),
  employmentInfo: text("employmentInfo"),
  annualIncomeRange: varchar("annualIncomeRange", { length: 50 }),
  investorType: mysqlEnum("investorType", ["individual", "institutional"]),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "ar"]).default("en"),
  preferredCurrency: mysqlEnum("preferredCurrency", ["USD", "EGP", "EUR", "GBP", "SAR", "AED"]).default("EGP"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

// ============================================
// KYC/AML VERIFICATION
// ============================================

export const kycDocuments = mysqlTable("kyc_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: mysqlEnum("documentType", ["id_card", "passport", "proof_of_address", "income_verification", "accreditation"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy").references(() => users.id),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const kycQuestionnaires = mysqlTable("kyc_questionnaires", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Financial Information
  annualIncome: varchar("annualIncome", { length: 50 }),
  netWorth: varchar("netWorth", { length: 50 }),
  liquidAssets: varchar("liquidAssets", { length: 50 }),
  employmentStatus: varchar("employmentStatus", { length: 50 }),
  occupation: varchar("occupation", { length: 255 }),
  // Investment Experience
  investmentExperience: varchar("investmentExperience", { length: 50 }),
  realEstateExperience: varchar("realEstateExperience", { length: 50 }),
  previousInvestments: text("previousInvestments"),
  riskTolerance: varchar("riskTolerance", { length: 50 }),
  // Investor Accreditation
  isAccredited: boolean("isAccredited").default(false),
  accreditationType: varchar("accreditationType", { length: 100 }),
  // Investment Goals
  investmentGoals: text("investmentGoals"),
  investmentHorizon: varchar("investmentHorizon", { length: 50 }),
  expectedReturnRate: varchar("expectedReturnRate", { length: 50 }),
  // Source of Funds
  sourceOfFunds: varchar("sourceOfFunds", { length: 100 }),
  sourceOfFundsDetails: text("sourceOfFundsDetails"),
  // Additional Information
  politicallyExposed: boolean("politicallyExposed").default(false),
  pepDetails: text("pepDetails"),
  additionalNotes: text("additionalNotes"),
  // Status and Review
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNotes: text("reviewNotes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy").references(() => users.id),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const verificationStatus = mysqlTable("verification_status", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  level: mysqlEnum("level", ["level_0", "level_1", "level_2"]).default("level_0").notNull(),
  emailVerified: boolean("emailVerified").default(false),
  phoneVerified: boolean("phoneVerified").default(false),
  documentsVerified: boolean("documentsVerified").default(false),
  questionnaireCompleted: boolean("questionnaireCompleted").default(false),
  canViewProperties: boolean("canViewProperties").default(true),
  canInvest: boolean("canInvest").default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// PROPERTIES
// ============================================

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  propertyType: mysqlEnum("propertyType", ["residential", "commercial", "administrative", "hospitality", "education", "logistics", "medical"]).notNull(),
  investmentType: mysqlEnum("investmentType", ["buy_to_let", "buy_to_sell"]).notNull(),
  status: mysqlEnum("status", ["draft", "coming_soon", "available", "funded", "exited", "cancelled"]).default("draft").notNull(),
  
  // Location
  addressLine1: text("addressLine1"),
  addressLine2: text("addressLine2"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  gpsLatitude: varchar("gpsLatitude", { length: 50 }),
  gpsLongitude: varchar("gpsLongitude", { length: 50 }),
  
  // Property Details
  propertySize: int("propertySize"), // in square meters
  numberOfUnits: int("numberOfUnits"),
  constructionYear: int("constructionYear"),
  propertyCondition: varchar("propertyCondition", { length: 100 }),
  amenities: text("amenities"), // JSON string
  
  // Financial Details
  totalValue: int("totalValue").notNull(), // in cents (USD)
  availableValue: int("availableValue").notNull(),
  minimumInvestment: int("minimumInvestment").default(10000).notNull(), // $100 in cents
  sharePrice: int("sharePrice").notNull(),
  totalShares: int("totalShares").notNull(),
  availableShares: int("availableShares").notNull(),
  
  // Buy to Let specific
  rentalYield: int("rentalYield"), // percentage * 100 (e.g., 1000 = 10%)
  annualYieldIncrease: int("annualYieldIncrease"), // percentage * 100
  managementFee: int("managementFee"), // percentage * 100
  otherCosts: int("otherCosts"), // percentage * 100
  projectedNetYield: int("projectedNetYield"), // percentage * 100
  
  // Buy to Sell specific
  fundTermMonths: int("fundTermMonths"),
  projectedSalePrice: int("projectedSalePrice"),
  expectedAppreciation: int("expectedAppreciation"), // percentage * 100
  
  // Distribution
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "annual"]),
  firstDistributionDate: timestamp("firstDistributionDate"),
  
  // Timeline
  fundingDeadline: timestamp("fundingDeadline"),
  acquisitionDate: timestamp("acquisitionDate"),
  completionDate: timestamp("completionDate"),
  expectedExitDate: timestamp("expectedExitDate"),
  
  // Additional Info
  vrTourUrl: text("vrTourUrl"),
  videoTourUrl: text("videoTourUrl"),
  
  // Developer/Fundraiser
  fundraiserId: int("fundraiserId").references(() => users.id),
  
  // Visibility
  visibility: mysqlEnum("visibility", ["public", "authenticated"]).default("authenticated").notNull(),
  
  // Waitlist
  waitlistEnabled: boolean("waitlistEnabled").default(false),
  waitlistCount: int("waitlistCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  propertyTypeIdx: index("property_type_idx").on(table.propertyType),
  investmentTypeIdx: index("investment_type_idx").on(table.investmentType),
  // Composite index for property listing queries (status + investmentType + createdAt)
  statusTypeCreatedIdx: index("status_type_created_idx").on(table.status, table.investmentType, table.createdAt),
}));

export const propertyDocuments = mysqlTable("property_documents", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  documentType: mysqlEnum("documentType", ["legal", "financial", "technical", "regulatory", "insurance"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
}));

export const propertyMedia = mysqlTable("property_media", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  mediaType: mysqlEnum("mediaType", ["image", "video", "floor_plan"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  caption: text("caption"),
  displayOrder: int("displayOrder").default(0),
  isFeatured: boolean("isFeatured").default(false),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
}));

export const propertyWaitlist = mysqlTable("property_waitlist", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  notified: boolean("notified").default(false),
  notifiedAt: timestamp("notifiedAt"),
}, (table) => ({
  propertyUserUnique: unique("property_user_unique").on(table.propertyId, table.userId),
}));

export const userSavedProperties = mysqlTable("user_saved_properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
}, (table) => ({
  userPropertyUnique: unique("user_property_unique").on(table.userId, table.propertyId),
  userIdIdx: index("user_id_idx").on(table.userId),
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
}));

export const propertyViews = mysqlTable("property_views", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }), // null for anonymous views
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  sessionId: varchar("sessionId", { length: 255 }), // for tracking unique anonymous users
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
}, (table) => ({
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
  viewedAtIdx: index("viewed_at_idx").on(table.viewedAt),
}));

// ============================================
// INVESTMENTS
// ============================================

export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  propertyId: int("propertyId").notNull().references(() => properties.id),
  amount: int("amount").notNull(), // in cents
  shares: int("shares").notNull(),
  sharePrice: int("sharePrice").notNull(),
  ownershipPercentage: int("ownershipPercentage").notNull(), // percentage * 10000 (e.g., 100 = 0.01%)
  status: mysqlEnum("status", ["pending", "confirmed", "active", "exited", "cancelled"]).default("pending").notNull(),
  
  // Reservation fields
  reservationId: varchar("reservation_id", { length: 100 }),
  reservationExpiresAt: timestamp("reservation_expires_at"),
  shareQuantity: int("share_quantity"),
  sharePriceCents: int("share_price_cents"),
  totalCostCents: int("total_cost_cents"),
  
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "annual"]),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending"),
  
  // Escrow status
  escrowStatus: mysqlEnum("escrow_status", ["not_required", "pending", "held", "released", "refunded"]).default("not_required"),
  
  transactionId: varchar("transactionId", { length: 255 }),
  investmentDate: timestamp("investmentDate").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  certificateGeneratedAt: timestamp("certificate_generated_at"),
  exitedAt: timestamp("exitedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
  statusIdx: index("status_idx").on(table.status),
  // Composite index for portfolio queries (userId + status + createdAt)
  userStatusCreatedIdx: index("user_status_created_idx").on(table.userId, table.status, table.createdAt),
}));

export const incomeDistributions = mysqlTable("income_distributions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Support BOTH old and new investment systems
  investmentId: int("investmentId").references(() => investments.id, { onDelete: "cascade" }),
  investmentTransactionId: int("investmentTransactionId").references(() => investmentTransactions.id, { onDelete: "cascade" }),
  
  amount: int("amount").notNull(), // in cents
  distributionType: mysqlEnum("distributionType", ["rental_income", "capital_gain", "exit_proceeds"]).notNull(),
  distributionDate: timestamp("distributionDate").notNull(),
  status: mysqlEnum("status", ["pending", "processed", "failed"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  investmentIdIdx: index("investment_id_idx").on(table.investmentId),
  statusIdx: index("status_idx").on(table.status),
}));

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["pay_in", "withdrawal", "investment", "payout", "fee"]).notNull(),
  amount: int("amount").notNull(), // in cents
  currency: mysqlEnum("currency", ["USD", "EGP"]).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentGateway: varchar("paymentGateway", { length: 50 }),
  transactionId: varchar("transactionId", { length: 255 }),
  referenceId: varchar("referenceId", { length: 255 }),
  relatedInvestmentId: int("relatedInvestmentId").references(() => investments.id),
  feeAmount: int("feeAmount").default(0),
  netAmount: int("netAmount"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
}));

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  investmentId: int("investmentId").references(() => investments.id, { onDelete: "set null" }),
  propertyId: int("propertyId").notNull().references(() => properties.id),
  
  // Invoice Details
  amount: int("amount").notNull(), // in cents
  shares: int("shares").notNull(),
  sharePrice: int("sharePrice").notNull(),
  currency: mysqlEnum("currency", ["USD", "EGP"]).default("USD").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "paid", "cancelled", "expired"]).default("pending").notNull(),
  
  // Dates
  issueDate: timestamp("issueDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  
  // Payment Details
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  transactionId: varchar("transactionId", { length: 255 }),
  
  // Additional Info
  notes: text("notes"),
  pdfUrl: text("pdfUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  investmentIdIdx: index("investment_id_idx").on(table.investmentId),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ============================================
// OFFERINGS (FUNDRAISER)
// ============================================

export const offerings = mysqlTable("offerings", {
  id: int("id").autoincrement().primaryKey(),
  fundraiserId: int("fundraiserId").notNull().references(() => users.id),
  propertyId: int("propertyId").references(() => properties.id),
  
  // Basic Information
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Offering Type & Regulation
  offeringType: mysqlEnum("offeringType", ["regulation_d_506c", "regulation_d_506b", "regulation_a_plus", "regulation_cf"]).notNull(),
  regulationType: varchar("regulationType", { length: 100 }),
  
  // Funding Structure
  totalOfferingAmount: int("totalOfferingAmount").notNull(), // in cents
  minimumOfferingAmount: int("minimumOfferingAmount"), // in cents
  maximumOfferingAmount: int("maximumOfferingAmount"), // in cents
  fundingGoal: int("fundingGoal").notNull(), // in cents (for backward compatibility)
  currentFunding: int("currentFunding").default(0), // in cents
  
  // Share Structure
  totalShares: int("totalShares").notNull(),
  availableShares: int("availableShares").notNull(),
  pricePerShare: int("pricePerShare").notNull(), // in cents
  minimumShares: int("minimumShares"),
  maximumShares: int("maximumShares"),
  
  // Ownership Structure
  ownershipStructure: mysqlEnum("ownershipStructure", ["llc_membership", "reit_shares", "corporation_stock", "limited_partnership", "other"]).notNull(),
  votingRights: text("votingRights"),
  distributionRights: text("distributionRights"),
  
  // Holding Period & Exit
  holdingPeriodMonths: int("holdingPeriodMonths"),
  exitStrategy: mysqlEnum("exitStrategy", ["property_sale", "refinance", "buyout", "ipo", "other"]),
  exitStrategyDetails: text("exitStrategyDetails"),
  
  // Timeline
  fundingStartDate: timestamp("fundingStartDate"),
  fundingEndDate: timestamp("fundingEndDate"),
  expectedClosingDate: timestamp("expectedClosingDate"),
  expectedExitDate: timestamp("expectedExitDate"),
  
  // Financial Projections Summary (calculated from offering_financial_projections)
  projectedIRR: int("projectedIRR"), // percentage * 100 (e.g., 12.5% = 1250)
  projectedROI: int("projectedROI"), // percentage * 100
  cashOnCashReturn: int("cashOnCashReturn"), // percentage * 100
  equityMultiple: int("equityMultiple"), // multiplier * 100 (e.g., 1.85x = 185)
  annualDistribution: int("annualDistribution"), // in cents
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "semi_annually", "annually"]),
  
  // Status & Workflow
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "active", "funded", "closed"]).default("draft").notNull(),
  rejectionReason: text("rejectionReason"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  closedAt: timestamp("closedAt"),
}, (table) => ({
  fundraiserIdIdx: index("fundraiser_id_idx").on(table.fundraiserId),
  statusIdx: index("status_idx").on(table.status),
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
}));

export const offeringDocuments = mysqlTable("offering_documents", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_id_idx").on(table.offeringId),
}));

export const offeringFinancialProjections = mysqlTable("offering_financial_projections", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Return Metrics
  projectedIRR: int("projectedIRR"), // percentage * 100
  projectedROI: int("projectedROI"), // percentage * 100
  cashOnCashReturn: int("cashOnCashReturn"), // percentage * 100
  equityMultiple: int("equityMultiple"), // multiplier * 100
  
  // Scenario Analysis
  bestCaseIRR: int("bestCaseIRR"), // percentage * 100
  baseCaseIRR: int("baseCaseIRR"), // percentage * 100
  worstCaseIRR: int("worstCaseIRR"), // percentage * 100
  
  // Distribution Projections
  annualDistribution: int("annualDistribution"), // in cents
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "semi_annually", "annually"]),
  firstDistributionDate: timestamp("firstDistributionDate"),
  
  // Property Value Projections
  initialPropertyValue: int("initialPropertyValue"), // in cents
  projectedPropertyValue: int("projectedPropertyValue"), // in cents
  appreciationRate: int("appreciationRate"), // percentage * 100
  
  // Income Projections
  yearlyRentalIncome: int("yearlyRentalIncome"), // in cents
  rentalYield: int("rentalYield"), // percentage * 100
  occupancyRate: int("occupancyRate"), // percentage * 100
  
  // Expense Projections
  yearlyOperatingExpenses: int("yearlyOperatingExpenses"), // in cents
  yearlyMaintenanceExpenses: int("yearlyMaintenanceExpenses"), // in cents
  yearlyPropertyTax: int("yearlyPropertyTax"), // in cents
  yearlyInsurance: int("yearlyInsurance"), // in cents
  
  // Cash Flow
  yearlyNetCashFlow: int("yearlyNetCashFlow"), // in cents
  
  // Sensitivity Analysis Data (JSON)
  sensitivityAnalysis: text("sensitivityAnalysis"), // JSON with various scenarios
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_id_idx").on(table.offeringId),
}));

export const offeringFees = mysqlTable("offering_fees", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Platform Fee
  platformFeePercentage: int("platformFeePercentage"), // percentage * 100
  platformFeeAmount: int("platformFeeAmount"), // in cents (if fixed)
  
  // Management Fee
  managementFeePercentage: int("managementFeePercentage"), // percentage * 100 (annual)
  managementFeeAmount: int("managementFeeAmount"), // in cents (if fixed)
  
  // Performance Fee (Carried Interest)
  performanceFeePercentage: int("performanceFeePercentage"), // percentage * 100
  performanceHurdleRate: int("performanceHurdleRate"), // percentage * 100 (e.g., 8% hurdle)
  
  // Maintenance Fee
  maintenanceFeePercentage: int("maintenanceFeePercentage"), // percentage * 100
  maintenanceFeeAmount: int("maintenanceFeeAmount"), // in cents (if fixed)
  
  // Acquisition Fee (one-time)
  acquisitionFeePercentage: int("acquisitionFeePercentage"), // percentage * 100
  acquisitionFeeAmount: int("acquisitionFeeAmount"), // in cents
  
  // Disposition Fee (at exit)
  dispositionFeePercentage: int("dispositionFeePercentage"), // percentage * 100
  dispositionFeeAmount: int("dispositionFeeAmount"), // in cents
  
  // Other Fees
  otherFeesDescription: text("otherFeesDescription"),
  otherFeesAmount: int("otherFeesAmount"), // in cents
  
  // Total Fee Impact
  totalAnnualFees: int("totalAnnualFees"), // in cents (calculated)
  feeImpactOnReturns: int("feeImpactOnReturns"), // percentage * 100 (calculated)
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_id_idx").on(table.offeringId),
}));

export const offeringTimeline = mysqlTable("offering_timeline", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Milestone Information
  milestoneType: mysqlEnum("milestoneType", [
    "custom",
    "approved",
    "fully_funded",
    "first_distribution",
    "offering_created",
    "submitted_for_review",
    "funding_started",
    "25_percent_funded",
    "50_percent_funded",
    "75_percent_funded",
    "100_percent_funded",
    "funding_ended",
    "property_acquired",
    "offering_closed"
  ]).notNull(),
  milestoneDate: timestamp("milestoneDate").notNull(),
  milestoneTitle: varchar("milestoneTitle", { length: 255 }).notNull(),
  milestoneDescription: text("milestoneDescription"),
  
  // Status
  status: mysqlEnum("status", ["upcoming", "in_progress", "completed", "delayed", "cancelled"]).default("upcoming").notNull(),
  completedAt: timestamp("completedAt"),
  
  // Notifications
  notifyInvestors: boolean("notifyInvestors").default(false),
  notificationSent: boolean("notificationSent").default(false),
  notificationSentAt: timestamp("notificationSentAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_id_idx").on(table.offeringId),
  milestoneDateIdx: index("milestone_date_idx").on(table.milestoneDate),
  statusIdx: index("status_idx").on(table.status),
}));

export const offeringStatusHistory = mysqlTable("offering_status_history", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  
  // Status Change
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  
  // Change Details
  changedBy: int("changedBy").notNull().references(() => users.id),
  reason: text("reason"),
  notes: text("notes"),
  
  // Approval/Rejection Details
  reviewerComments: text("reviewerComments"),
  
  // Timestamp
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => ({
  offeringIdIdx: index("offering_id_idx").on(table.offeringId),
  changedAtIdx: index("changed_at_idx").on(table.changedAt),
}));

// Type exports for new tables
export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;
export type OfferingDocument = typeof offeringDocuments.$inferSelect;
export type InsertOfferingDocument = typeof offeringDocuments.$inferInsert;
export type OfferingFinancialProjection = typeof offeringFinancialProjections.$inferSelect;
export type InsertOfferingFinancialProjection = typeof offeringFinancialProjections.$inferInsert;
export type OfferingFee = typeof offeringFees.$inferSelect;
export type InsertOfferingFee = typeof offeringFees.$inferInsert;
export type OfferingTimeline = typeof offeringTimeline.$inferSelect;
export type InsertOfferingTimeline = typeof offeringTimeline.$inferInsert;
export type OfferingStatusHistory = typeof offeringStatusHistory.$inferSelect;
export type InsertOfferingStatusHistory = typeof offeringStatusHistory.$inferInsert;

/**
 * Offering Approvals Table
 * Multi-stage approval workflow tracking
 */
export const offeringApprovals = mysqlTable("offering_approvals", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offeringId").notNull(),
  approvalStage: mysqlEnum("approvalStage", [
    "initial_review",
    "financial_review",
    "legal_review",
    "compliance_review",
    "executive_approval",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "changes_requested"])
    .default("pending")
    .notNull(),
  assignedTo: int("assignedTo"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  comments: text("comments"),
  changesRequested: text("changesRequested"),
  approvalNotes: text("approvalNotes"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OfferingApproval = typeof offeringApprovals.$inferSelect;
export type InsertOfferingApproval = typeof offeringApprovals.$inferInsert;

// ============================================
// SECONDARY MARKET
// ============================================

export const secondaryMarketListings = mysqlTable("secondary_market_listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull().references(() => users.id),
  investmentId: int("investmentId").notNull().references(() => investments.id),
  shares: int("shares").notNull(),
  pricePerShare: int("pricePerShare").notNull(),
  totalPrice: int("totalPrice").notNull(),
  status: mysqlEnum("status", ["active", "pending", "sold", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  soldAt: timestamp("soldAt"),
}, (table) => ({
  sellerIdIdx: index("seller_id_idx").on(table.sellerId),
  statusIdx: index("status_idx").on(table.status),
}));

export const secondaryMarketDeals = mysqlTable("secondary_market_deals", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull().references(() => secondaryMarketListings.id),
  buyerId: int("buyerId").notNull().references(() => users.id),
  sellerId: int("sellerId").notNull().references(() => users.id),
  shares: int("shares").notNull(),
  pricePerShare: int("pricePerShare").notNull(),
  totalPrice: int("totalPrice").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "settled", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  settledAt: timestamp("settledAt"),
}, (table) => ({
  buyerIdIdx: index("buyer_id_idx").on(table.buyerId),
  sellerIdIdx: index("seller_id_idx").on(table.sellerId),
  statusIdx: index("status_idx").on(table.status),
}));

// ============================================
// FEE SETTINGS
// ============================================

export const feeSettings = mysqlTable("fee_settings", {
  id: int("id").autoincrement().primaryKey(),
  transactionType: mysqlEnum("transactionType", ["pay_in", "withdrawal", "investment", "payout"]).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  feeType: mysqlEnum("feeType", ["addition", "deduction"]).notNull(),
  percentageFee: int("percentageFee").default(0), // percentage * 100
  fixedFee: int("fixedFee").default(0), // in cents
  useHigherAmount: boolean("useHigherAmount").default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const platformWallet = mysqlTable("platform_wallet", {
  id: int("id").autoincrement().primaryKey(),
  balance: int("balance").default(0).notNull(),
  currency: mysqlEnum("currency", ["USD", "EGP"]).default("USD").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["investment", "distribution", "kyc", "property", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  readIdx: index("read_idx").on(table.read),
}));

// ============================================
// DEVELOPER/FUNDRAISER PROFILES
// ============================================

export const developerProfiles = mysqlTable("developer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyNameAr: varchar("companyNameAr", { length: 255 }),
  logoUrl: text("logoUrl"),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  website: varchar("website", { length: 255 }),
  establishedYear: int("establishedYear"),
  totalProjects: int("totalProjects").default(0),
  totalFunding: int("totalFunding").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// REFERRAL PROGRAM
// ============================================

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull().references(() => users.id),
  referredUserId: int("referredUserId").references(() => users.id),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  rewardAmount: int("rewardAmount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  referrerIdIdx: index("referrer_id_idx").on(table.referrerId),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = typeof kycDocuments.$inferInsert;
export type KycQuestionnaire = typeof kycQuestionnaires.$inferSelect;
export type InsertKycQuestionnaire = typeof kycQuestionnaires.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type InsertPropertyDocument = typeof propertyDocuments.$inferInsert;
export type PropertyMedia = typeof propertyMedia.$inferSelect;
export type InsertPropertyMedia = typeof propertyMedia.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
export type IncomeDistribution = typeof incomeDistributions.$inferSelect;
export type InsertIncomeDistribution = typeof incomeDistributions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type SecondaryMarketListing = typeof secondaryMarketListings.$inferSelect;
export type InsertSecondaryMarketListing = typeof secondaryMarketListings.$inferInsert;
export type SecondaryMarketDeal = typeof secondaryMarketDeals.$inferSelect;
export type InsertSecondaryMarketDeal = typeof secondaryMarketDeals.$inferInsert;

// KYC Progress Tracking
export const kycProgress = mysqlTable("kyc_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentStep: int("currentStep").notNull().default(0),
  personalInfoData: text("personalInfoData"), // JSON string
  documentUploadData: text("documentUploadData"), // JSON string
  questionnaireData: text("questionnaireData"), // JSON string
  completionPercentage: int("completionPercentage").notNull().default(0),
  lastSavedAt: timestamp("lastSavedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KycProgress = typeof kycProgress.$inferSelect;
export type InsertKycProgress = typeof kycProgress.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type DeveloperProfile = typeof developerProfiles.$inferSelect;
export type InsertDeveloperProfile = typeof developerProfiles.$inferInsert;

// Platform Settings for dynamic configuration
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 255 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

// Access Requests for Private Mode Registration
export const accessRequests = mysqlTable("access_requests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  investmentInterest: varchar("investmentInterest", { length: 100 }),
  investmentBudget: varchar("investmentBudget", { length: 100 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  invitationCode: varchar("invitationCode", { length: 20 }),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("access_requests_email_idx").on(table.email),
  statusIdx: index("access_requests_status_idx").on(table.status),
}));

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

// Platform Invitations (for private mode registration)
export const platformInvitations = mysqlTable("platform_invitations", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 320 }), // Optional: restrict to specific email
  maxUses: int("maxUses").default(1).notNull(),
  usedCount: int("usedCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  codeIdx: index("platform_invitations_code_idx").on(table.code),
  emailIdx: index("platform_invitations_email_idx").on(table.email),
}));

export type PlatformInvitation = typeof platformInvitations.$inferSelect;
export type InsertPlatformInvitation = typeof platformInvitations.$inferInsert;

// Permissions and Roles System
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // e.g., "users", "kyc", "properties", "analytics"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(), // System roles cannot be deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: int("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionId: int("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  grantedBy: int("grantedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: int("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: int("assignedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// CRM - SALES CLOUD
// ============================================

export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 100 }),
  source: mysqlEnum("source", ["website", "referral", "social_media", "facebook", "instagram", "whatsapp", "event", "advertisement", "other"]).notNull(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  score: int("score").default(0), // 0-100
  industry: varchar("industry", { length: 100 }),
  investmentInterest: varchar("investmentInterest", { length: 255 }),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  notes: text("notes"),
  assignedTo: int("assignedTo").references(() => users.id),
  convertedToOpportunityId: int("convertedToOpportunityId"),
  convertedToAccountId: int("convertedToAccountId"),
  convertedToContactId: int("convertedToContactId"),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  emailIdx: index("email_idx").on(table.email),
}));

export const crmOpportunities = mysqlTable("crm_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  accountId: int("accountId"),
  contactId: int("contactId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  stage: mysqlEnum("stage", ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]).default("prospecting").notNull(),
  probability: int("probability").default(10), // 0-100
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),
  propertyId: int("propertyId").references(() => properties.id),
  propertyType: varchar("propertyType", { length: 100 }),
  investmentAmount: decimal("investmentAmount", { precision: 15, scale: 2 }),
  numberOfShares: int("numberOfShares"),
  source: varchar("source", { length: 100 }),
  description: text("description"),
  nextStep: varchar("nextStep", { length: 255 }),
  competitorInfo: text("competitorInfo"),
  lossReason: varchar("lossReason", { length: 255 }),
  assignedTo: int("assignedTo").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  stageIdx: index("stage_idx").on(table.stage),
  accountIdx: index("account_idx").on(table.accountId),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  closeDateIdx: index("close_date_idx").on(table.expectedCloseDate),
}));

export const crmAccounts = mysqlTable("crm_accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["investor", "partner", "vendor", "other"]).default("investor").notNull(),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  billingAddress: text("billingAddress"),
  shippingAddress: text("shippingAddress"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  annualRevenue: decimal("annualRevenue", { precision: 15, scale: 2 }),
  numberOfEmployees: int("numberOfEmployees"),
  description: text("description"),
  parentAccountId: int("parentAccountId"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  nameIdx: index("name_idx").on(table.name),
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export const crmContacts = mysqlTable("crm_contacts", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").references(() => crmAccounts.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  title: varchar("title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  isPrimary: boolean("isPrimary").default(false),
  mailingAddress: text("mailingAddress"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  birthdate: timestamp("birthdate"),
  description: text("description"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
  emailIdx: index("email_idx").on(table.email),
}));

// ============================================
// CRM - SERVICE CLOUD
// ============================================

export const crmCases = mysqlTable("crm_cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["new", "in_progress", "pending_customer", "resolved", "closed"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  type: mysqlEnum("type", ["question", "problem", "feature_request", "complaint"]).default("question").notNull(),
  origin: mysqlEnum("origin", ["web", "email", "phone", "chat", "social_media"]).default("web").notNull(),
  accountId: int("accountId").references(() => crmAccounts.id),
  contactId: int("contactId").references(() => crmContacts.id),
  userId: int("userId").references(() => users.id),
  propertyId: int("propertyId").references(() => properties.id),
  assignedTo: int("assignedTo").references(() => users.id),
  escalated: boolean("escalated").default(false),
  resolution: text("resolution"),
  customerSatisfaction: int("customerSatisfaction"), // 1-5
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  accountIdx: index("account_idx").on(table.accountId),
  contactIdx: index("contact_idx").on(table.contactId),
  caseNumberIdx: unique("case_number_idx").on(table.caseNumber),
}));

export const crmCaseComments = mysqlTable("crm_case_comments", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull().references(() => crmCases.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  isInternal: boolean("isInternal").default(false),
  isFromCustomer: boolean("isFromCustomer").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

// ============================================
// CRM - ACTIVITIES
// ============================================

export const crmActivities = mysqlTable("crm_activities", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["note", "task", "call", "email", "meeting"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  relatedToType: mysqlEnum("relatedToType", ["lead", "opportunity", "account", "contact", "case"]),
  relatedToId: int("relatedToId"),
  assignedTo: int("assignedTo").references(() => users.id),
  isInternal: boolean("isInternal").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  relatedIdx: index("related_idx").on(table.relatedToType, table.relatedToId),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  dueDateIdx: index("due_date_idx").on(table.dueDate),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id), // The user affected by the action
  performedBy: int("performedBy").references(() => users.id), // The admin/user who performed the action
  action: varchar("action", { length: 100 }).notNull(), // e.g., "user.role.changed", "kyc.approved", "invoice.marked_paid"
  targetType: varchar("targetType", { length: 50 }), // e.g., "user", "property", "kyc_document", "invoice"
  targetId: int("targetId"),
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt", { mode: 'string', fsp: 3 }).defaultNow().notNull(), // Millisecond precision
}, (table) => ({
  userIdIdx: index("audit_user_id_idx").on(table.userId),
  performedByIdx: index("audit_performed_by_idx").on(table.performedBy),
  targetIdx: index("audit_target_idx").on(table.targetType, table.targetId),
  createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
}));

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Two-Factor Authentication
export const user2fa = mysqlTable("user_2fa", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  backupCodes: text("backupCodes"), // JSON array of backup codes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User2FA = typeof user2fa.$inferSelect;
export type InsertUser2FA = typeof user2fa.$inferInsert;

// Security Events
export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "failed_login",
    "account_lockout",
    "rate_limit_hit",
    "suspicious_activity",
    "password_reset_request",
    "unauthorized_access_attempt",
    "2fa_failed",
    "ip_blocked",
    "ip_unblocked",
    "ip_bulk_unblock"
  ]).notNull(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  email: varchar("email", { length: 320 }),
  endpoint: varchar("endpoint", { length: 255 }),
  details: json("details"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy").references(() => users.id, { onDelete: "set null" }),
  placeholderAr: text("placeholderAr"),
  // Field dependencies for conditional visibility (JSON)
  dependencies: text("dependencies"),
  // Validation rules (JSON)
  validationRules: text("validationRules"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),}, (table) => ({
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  userIdIdx: index("user_id_idx").on(table.userId),
  ipAddressIdx: index("ip_address_idx").on(table.ipAddress),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  severityIdx: index("severity_idx").on(table.severity),
  resolvedIdx: index("resolved_idx").on(table.resolved),
}));

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

// Email Templates
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["password_reset", "invoice", "payment_confirmation", "kyc_approved", "kyc_rejected", "custom"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  textContent: text("textContent"),
  variables: json("variables"), // Available variables for this template
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// CRM Types
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;
export type CrmOpportunity = typeof crmOpportunities.$inferSelect;
export type InsertCrmOpportunity = typeof crmOpportunities.$inferInsert;
export type CrmAccount = typeof crmAccounts.$inferSelect;
export type InsertCrmAccount = typeof crmAccounts.$inferInsert;
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;
export type CrmCase = typeof crmCases.$inferSelect;
export type InsertCrmCase = typeof crmCases.$inferInsert;
export type CrmCaseComment = typeof crmCaseComments.$inferSelect;
export type InsertCrmCaseComment = typeof crmCaseComments.$inferInsert;
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;


// ============================================
// CURRENCY EXCHANGE RATES
// ============================================

export const exchangeRates = mysqlTable("exchange_rates", {
  id: int("id").autoincrement().primaryKey(),
  baseCurrency: varchar("baseCurrency", { length: 3 }).notNull().default("USD"),
  targetCurrency: varchar("targetCurrency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  source: varchar("source", { length: 100 }).default("exchangerate-api.com"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  currencyPairIdx: index("currency_pair_idx").on(table.baseCurrency, table.targetCurrency),
  fetchedAtIdx: index("fetched_at_idx").on(table.fetchedAt),
}));

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;


// ============================================
// HELP DESK & CUSTOMER SUPPORT
// ============================================

export const ticketCategories = mysqlTable("ticket_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  departmentType: mysqlEnum("departmentType", ["customer_support", "technical", "billing", "kyc", "investment", "internal"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 20 }).notNull().unique(), // e.g., TKT-2024-00001
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").references(() => ticketCategories.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_customer", "waiting_internal", "resolved", "closed"]).default("open").notNull(),
  assignedToId: int("assignedToId").references(() => users.id), // Support agent
  departmentType: mysqlEnum("departmentType", ["customer_support", "technical", "billing", "kyc", "investment", "internal"]).notNull(),
  source: mysqlEnum("source", ["web", "email", "chat", "phone"]).default("web").notNull(),
  customerSatisfactionRating: int("customerSatisfactionRating"), // 1-5 stars
  customerFeedback: text("customerFeedback"),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  assignedToIdx: index("assigned_to_idx").on(table.assignedToId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
  categoryIdx: index("category_idx").on(table.categoryId),
  departmentIdx: index("department_idx").on(table.departmentType),
}));

export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id),
  message: text("message").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(), // Internal notes not visible to customer
  attachments: json("attachments").$type<Array<{ url: string; filename: string; size: number }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_id_idx").on(table.ticketId),
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: varchar("conversationId", { length: 50 }).notNull().unique(), // e.g., CHAT-2024-00001
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAgentId: int("assignedAgentId").references(() => users.id),
  status: mysqlEnum("status", ["waiting", "active", "resolved", "closed"]).default("waiting").notNull(),
  departmentType: mysqlEnum("departmentType", ["customer_support", "technical", "billing", "kyc", "investment", "internal"]).default("customer_support").notNull(),
  customerSatisfactionRating: int("customerSatisfactionRating"), // 1-5 stars
  lastMessageAt: timestamp("lastMessageAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  assignedAgentIdx: index("assigned_agent_idx").on(table.assignedAgentId),
  statusIdx: index("status_idx").on(table.status),
}));

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  senderId: int("senderId").notNull().references(() => users.id),
  message: text("message").notNull(),
  messageType: mysqlEnum("messageType", ["text", "file", "system"]).default("text").notNull(),
  attachments: json("attachments").$type<Array<{ url: string; filename: string; size: number }>>(),
  detectedLanguage: varchar("detectedLanguage", { length: 10 }),
  translations: json("translations").$type<Record<string, string>>(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("conversation_id_idx").on(table.conversationId),
  senderIdIdx: index("sender_id_idx").on(table.senderId),
}));

export const knowledgeBaseCategories = mysqlTable("knowledge_base_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const knowledgeBaseArticles = mysqlTable("knowledge_base_articles", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => knowledgeBaseCategories.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  content: text("content").notNull(),
  contentAr: text("contentAr"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  tags: json("tags"),
  views: int("views").default(0).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  notHelpfulCount: int("notHelpfulCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdIdx: index("category_id_idx").on(table.categoryId),
  slugIdx: index("slug_idx").on(table.slug),
  isPublishedIdx: index("is_published_idx").on(table.isPublished),
}));

export const cannedResponses = mysqlTable("canned_responses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  shortcut: varchar("shortcut", { length: 20 }).notNull().unique(), // e.g., /welcome, /refund
  content: text("content").notNull(),
  contentAr: text("contentAr"),
  categoryId: int("categoryId").references(() => ticketCategories.id),
  isActive: boolean("isActive").default(true).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdById: int("createdById").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  shortcutIdx: index("shortcut_idx").on(table.shortcut),
  categoryIdx: index("category_idx").on(table.categoryId),
}));

// Type exports
export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = typeof ticketCategories.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type KnowledgeBaseCategory = typeof knowledgeBaseCategories.$inferSelect;
export type InsertKnowledgeBaseCategory = typeof knowledgeBaseCategories.$inferInsert;
export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type InsertKnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferInsert;
export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

// ============================================
// WALLET AND PAYMENT SYSTEM
// ============================================

export const userWallets = mysqlTable("user_wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  balance: int("balance").default(0).notNull(), // Balance in EGP cents (e.g., 10000 = EGP 100.00)
  currency: varchar("currency", { length: 3 }).default("EGP").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const userBankAccounts = mysqlTable("user_bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  iban: varchar("iban", { length: 34 }),
  accountHolderName: varchar("accountHolderName", { length: 200 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["deposit", "withdrawal", "investment", "distribution", "refund"]).notNull(),
  amount: int("amount").notNull(), // Amount in EGP cents
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "instapay", "fawry", "card", "wallet"]),
  receiptUrl: text("receiptUrl"), // S3 URL for uploaded receipt (for bank transfers)
  reference: varchar("reference", { length: 100 }), // External payment reference (Fawry code, card transaction ID, etc.)
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  typeIdx: index("type_idx").on(table.type),
  // Composite index for transaction history queries (userId + status + createdAt)
  userStatusCreatedIdx: index("wallet_user_status_created_idx").on(table.userId, table.status, table.createdAt),
}));

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = typeof userWallets.$inferInsert;
export type UserBankAccount = typeof userBankAccounts.$inferSelect;
export type InsertUserBankAccount = typeof userBankAccounts.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

export const platformContent = mysqlTable("platform_content", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // e.g., "homepage_hero", "homepage_features"
  content: json("content").notNull(), // JSON object with content data
  contentAr: json("contentAr"), // Arabic version of content
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  keyIdx: index("key_idx").on(table.key),
}));

export type PlatformContent = typeof platformContent.$inferSelect;
export type InsertPlatformContent = typeof platformContent.$inferInsert;

export const mediaLibrary = mysqlTable("media_library", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull().unique(), // S3 key
  url: text("url").notNull(), // Public S3 URL
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // Size in bytes
  width: int("width"), // Image width in pixels
  height: int("height"), // Image height in pixels
  title: varchar("title", { length: 255 }),
  altText: text("altText"),
  tags: json("tags"), // Array of tags for categorization
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = typeof mediaLibrary.$inferInsert;



export const blockedIPs = mysqlTable("blocked_ips", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),
  reason: text("reason"),
  blockedBy: int("blocked_by").references(() => users.id),
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: int("is_active").default(1).notNull(),
  blockType: mysqlEnum("block_type", ["manual", "automatic"]).default("manual").notNull(),
}, (table) => ({
  ipAddressIdx: index("idx_ip_address").on(table.ipAddress),
  isActiveIdx: index("idx_is_active").on(table.isActive),
  expiresAtIdx: index("idx_expires_at").on(table.expiresAt),
}));

export type BlockedIP = typeof blockedIPs.$inferSelect;
export type InsertBlockedIP = typeof blockedIPs.$inferInsert;

export const trustedDevices = mysqlTable("trusted_devices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceFingerprint: varchar("deviceFingerprint", { length: 255 }).notNull(),
  deviceName: varchar("deviceName", { length: 255 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  lastUsed: timestamp("lastUsed").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = typeof trustedDevices.$inferInsert;

// Security Settings
export const securitySettings = mysqlTable("security_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type InsertSecuritySetting = typeof securitySettings.$inferInsert;



// ============================================
// LEGAL DOCUMENTS
// ============================================

export const legalDocuments = mysqlTable("legal_documents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  category: mysqlEnum("category", [
    "terms_of_service",
    "privacy_policy",
    "investment_agreement",
    "shareholder_agreement",
    "subscription_agreement",
    "risk_disclosure",
    "kyc_consent",
    "other"
  ]).notNull(),
  version: varchar("version", { length: 50 }).notNull(), // e.g., "1.0", "2.1"
  htmlContent: text("html_content").notNull(),
  pdfUrl: text("pdf_url"), // S3 URL to generated PDF
  variables: text("variables"), // JSON array of available variables
  isActive: tinyint("is_active").default(1).notNull(),
  isPublished: tinyint("is_published").default(0).notNull(),
  effectiveDate: timestamp("effective_date"),
  expiryDate: timestamp("expiry_date"),
  createdBy: int("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = typeof legalDocuments.$inferInsert;

// Track which users have accepted which legal documents
export const legalDocumentAcceptances = mysqlTable("legal_document_acceptances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: int("document_id").notNull().references(() => legalDocuments.id, { onDelete: "cascade" }),
  documentVersion: varchar("document_version", { length: 50 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});

export type LegalDocumentAcceptance = typeof legalDocumentAcceptances.$inferSelect;
export type InsertLegalDocumentAcceptance = typeof legalDocumentAcceptances.$inferInsert;


// ============================================
// CUSTOM FIELDS SYSTEM
// ============================================

/**
 * Custom Fields Definition Table
 * Stores the configuration for custom fields that can be added to any module
 */
export const customFields = mysqlTable("custom_fields", {
  id: int("id").autoincrement().primaryKey(),
  // Module this field belongs to (e.g., 'properties', 'users', 'leads', 'invoices')
  module: varchar("module", { length: 50 }).notNull(),
  // Field identifier (used in code, e.g., 'property_manager_name')
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(),
  // Display label in English
  labelEn: varchar("labelEn", { length: 255 }).notNull(),
  // Display label in Arabic
  labelAr: varchar("labelAr", { length: 255 }),
  // Field type: text, number, date, datetime, dropdown, multi_select, country, file, boolean, email, phone, url
  fieldType: varchar("fieldType", { length: 50 }).notNull(),
  // Configuration JSON for field (e.g., dropdown options, validation rules, file types)
  config: text("config"),
  // Is this field required?
  isRequired: boolean("isRequired").default(false).notNull(),
  // Show in admin interface?
  showInAdmin: boolean("showInAdmin").default(true).notNull(),
  // Show in user-facing forms?
  showInUserForm: boolean("showInUserForm").default(true).notNull(),
  // Display order (lower numbers appear first)
  displayOrder: int("displayOrder").default(0).notNull(),
  // Is this field active?
  isActive: boolean("isActive").default(true).notNull(),
  // Help text in English
  helpTextEn: text("helpTextEn"),
  // Help text in Arabic
  helpTextAr: text("helpTextAr"),
  // Placeholder text in English
  placeholderEn: varchar("placeholderEn", { length: 255 }),
  // Placeholder text in Arabic
  placeholderAr: varchar("placeholderAr", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
});

/**
 * Custom Field Values Table
 * Stores the actual values for custom fields
 */
export const customFieldValues = mysqlTable("custom_field_values", {
  id: int("id").autoincrement().primaryKey(),
  // Reference to the custom field definition
  fieldId: int("fieldId").notNull().references(() => customFields.id, { onDelete: "cascade" }),
  // ID of the record this value belongs to (e.g., property ID, user ID)
  recordId: int("recordId").notNull(),
  // Module this value belongs to (denormalized for faster queries)
  module: varchar("module", { length: 50 }).notNull(),
  // The actual value (stored as text, parsed based on field type)
  value: text("value"),
  // For file uploads, store the file URL
  fileUrl: varchar("fileUrl", { length: 500 }),
  // For file uploads, store the file name
  fileName: varchar("fileName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = typeof customFields.$inferInsert;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;


/**
 * Custom Field Templates Table
 * Stores predefined sets of custom fields for quick setup
 */
export const customFieldTemplates = mysqlTable("custom_field_templates", {
  id: int("id").autoincrement().primaryKey(),
  // Template name in English
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  // Template name in Arabic
  nameAr: varchar("nameAr", { length: 255 }),
  // Template description in English
  descriptionEn: text("descriptionEn"),
  // Template description in Arabic
  descriptionAr: text("descriptionAr"),
  // Module this template is for
  module: varchar("module", { length: 50 }).notNull(),
  // Template configuration (JSON array of field definitions)
  fields: text("fields").notNull(),
  // Is this a system template (cannot be deleted)?
  isSystem: boolean("isSystem").default(false).notNull(),
  // Is this template active?
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
});

export type CustomFieldTemplate = typeof customFieldTemplates.$inferSelect;
export type InsertCustomFieldTemplate = typeof customFieldTemplates.$inferInsert;


// Investment Transaction Tables (Enhanced)
export const investmentTransactions = mysqlTable("investment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  
  // Investment Details
  investmentAmount: int("investmentAmount").notNull(), // Amount in cents
  numberOfShares: int("numberOfShares").notNull(),
  pricePerShare: int("pricePerShare").notNull(), // Price in cents
  
  // Fees
  platformFee: int("platformFee").notNull().default(0), // In cents
  processingFee: int("processingFee").notNull().default(0), // In cents
  totalAmount: int("totalAmount").notNull(), // Investment + fees in cents
  
  // Status
  status: mysqlEnum("status", ["pending", "reserved", "processing", "completed", "failed", "cancelled", "refunded"]).notNull().default("pending"),
  
  // Reservation
  reservationExpiresAt: timestamp("reservationExpiresAt"),
  reservedAt: timestamp("reservedAt"),
  
  // Payment
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "processing", "completed", "failed", "refunded"]).default("pending"),
  paymentReference: varchar("paymentReference", { length: 255 }),
  paidAt: timestamp("paidAt"),
  
  // Completion
  completedAt: timestamp("completedAt"),
  certificateIssued: boolean("certificateIssued").default(false),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  
  // Metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  notes: text("notes"),
  
  // Additional Fields (Phase 2 Migration)
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "annual"]),
  exitedAt: timestamp("exitedAt"),
  ownershipPercentage: int("ownershipPercentage"), // percentage * 10000 (e.g., 100 = 0.01%)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentTransaction = typeof investmentTransactions.$inferSelect;
export type InsertInvestmentTransaction = typeof investmentTransactions.$inferInsert;

export const investmentDocuments = mysqlTable("investment_documents", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull(),
  
  documentType: mysqlEnum("documentType", [
    "subscription_agreement",
    "ppm", // Private Placement Memorandum
    "risk_disclosure",
    "accreditation_proof",
    "identity_verification",
    "bank_statement",
    "tax_form",
    "other"
  ]).notNull(),
  
  documentName: varchar("documentName", { length: 255 }).notNull(),
  documentUrl: text("documentUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Signature/Acceptance
  signed: boolean("signed").default(false),
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"), // Digital signature or acceptance record
  
  // Verification
  verified: boolean("verified").default(false),
  verifiedBy: int("verifiedBy"), // Admin user ID
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentDocument = typeof investmentDocuments.$inferSelect;
export type InsertInvestmentDocument = typeof investmentDocuments.$inferInsert;

export const investmentEligibility = mysqlTable("investment_eligibility", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Accreditation Status
  isAccredited: boolean("isAccredited").default(false),
  accreditationType: mysqlEnum("accreditationType", [
    "income", // Annual income threshold
    "net_worth", // Net worth threshold
    "professional", // Licensed professional
    "entity", // Qualified entity
    "none"
  ]).default("none"),
  accreditationVerified: boolean("accreditationVerified").default(false),
  accreditationVerifiedAt: timestamp("accreditationVerifiedAt"),
  accreditationExpiresAt: timestamp("accreditationExpiresAt"),
  
  // Investment Limits
  annualInvestmentLimit: int("annualInvestmentLimit"), // In cents, based on regulations
  currentYearInvested: int("currentYearInvested").default(0), // In cents
  lifetimeInvested: int("lifetimeInvested").default(0), // In cents
  
  // Jurisdiction
  country: varchar("country", { length: 2 }), // ISO country code
  state: varchar("state", { length: 50 }),
  investmentRestrictions: text("investmentRestrictions"), // JSON of restrictions
  
  // KYC/AML
  kycStatus: mysqlEnum("kycStatus", ["pending", "in_progress", "approved", "rejected", "expired"]).default("pending"),
  kycCompletedAt: timestamp("kycCompletedAt"),
  kycProvider: varchar("kycProvider", { length: 100 }),
  kycReference: varchar("kycReference", { length: 255 }),
  
  amlStatus: mysqlEnum("amlStatus", ["pending", "clear", "flagged", "rejected"]).default("pending"),
  amlCheckedAt: timestamp("amlCheckedAt"),
  
  // Risk Assessment
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]),
  investmentExperience: mysqlEnum("investmentExperience", ["none", "limited", "moderate", "extensive"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentEligibility = typeof investmentEligibility.$inferSelect;
export type InsertInvestmentEligibility = typeof investmentEligibility.$inferInsert;

export const investmentActivity = mysqlTable("investment_activity", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull(),
  
  activityType: mysqlEnum("activityType", [
    "created",
    "reserved",
    "payment_initiated",
    "payment_completed",
    "payment_failed",
    "documents_signed",
    "eligibility_verified",
    "completed",
    "cancelled",
    "refunded",
    "note_added"
  ]).notNull(),
  
  description: text("description").notNull(),
  performedBy: int("performedBy"), // User ID or null for system
  metadata: text("metadata"), // JSON for additional data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentActivity = typeof investmentActivity.$inferSelect;
export type InsertInvestmentActivity = typeof investmentActivity.$inferInsert;

// ============================================
// PROPERTY IMAGES
// ============================================

export const propertyImages = mysqlTable("property_images", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(), // Full S3 URL
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // S3 key for deletion
  isPrimary: boolean("isPrimary").default(false).notNull(), // Primary/featured image
  displayOrder: int("displayOrder").default(0).notNull(), // Order for display
  caption: varchar("caption", { length: 255 }), // Optional image caption
  captionAr: varchar("captionAr", { length: 255 }), // Arabic caption
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;


// ============================================
// OFFERINGS SYSTEM (Phase 1 Roadmap)
// ============================================

export * from "./offerings-schema";

// ============================================
// INVESTMENT FLOW SYSTEM (Phase B)
// ============================================

export * from "./investments-schema";

// ============================================
// INVESTMENT FLOW (User-Specified Tables)
// ============================================

export * from "./investment-flow-schema";

// ============================================
// INVESTOR QUALIFICATION SYSTEM (FRA Compliance)
// ============================================

export * from "./investor-qualification-schema";
