import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, unique, json } from "drizzle-orm/mysql-core";

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
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "investor", "fundraiser", "admin", "super_admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "pending_verification"]).default("pending_verification").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
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
  distributionFrequency: mysqlEnum("distributionFrequency", ["monthly", "quarterly", "annual"]),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending"),
  transactionId: varchar("transactionId", { length: 255 }),
  investmentDate: timestamp("investmentDate").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  exitedAt: timestamp("exitedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
  statusIdx: index("status_idx").on(table.status),
}));

export const incomeDistributions = mysqlTable("income_distributions", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull().references(() => investments.id, { onDelete: "cascade" }),
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

// ============================================
// OFFERINGS (FUNDRAISER)
// ============================================

export const offerings = mysqlTable("offerings", {
  id: int("id").autoincrement().primaryKey(),
  fundraiserId: int("fundraiserId").notNull().references(() => users.id),
  propertyId: int("propertyId").references(() => properties.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fundingGoal: int("fundingGoal").notNull(),
  currentFunding: int("currentFunding").default(0),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "active", "funded", "closed"]).default("draft").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  closedAt: timestamp("closedAt"),
}, (table) => ({
  fundraiserIdIdx: index("fundraiser_id_idx").on(table.fundraiserId),
  statusIdx: index("status_idx").on(table.status),
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
export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;
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
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

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
  userId: int("userId").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "user.role.changed", "kyc.approved"
  targetType: varchar("targetType", { length: 50 }), // e.g., "user", "property", "kyc_document"
  targetId: int("targetId"),
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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
