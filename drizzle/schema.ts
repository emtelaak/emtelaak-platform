import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, unique } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "investor", "fundraiser", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "pending_verification"]).default("pending_verification").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
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
  preferredCurrency: mysqlEnum("preferredCurrency", ["USD", "EGP"]).default("USD"),
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
  investmentExperience: varchar("investmentExperience", { length: 50 }),
  riskTolerance: varchar("riskTolerance", { length: 50 }),
  financialCapacity: varchar("financialCapacity", { length: 50 }),
  investmentGoals: text("investmentGoals"),
  isAccreditedInvestor: boolean("isAccreditedInvestor").default(false),
  accreditationDetails: text("accreditationDetails"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
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
  status: mysqlEnum("status", ["draft", "available", "funded", "exited", "cancelled"]).default("draft").notNull(),
  
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
