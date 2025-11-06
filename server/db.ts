import { eq, and, desc, asc, sql, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, kycProgress, InsertKycProgress,
  userProfiles,
  InsertUserProfile,
  kycDocuments,
  InsertKycDocument,
  kycQuestionnaires,
  InsertKycQuestionnaire,
  verificationStatus,
  properties,
  InsertProperty,
  propertyDocuments,
  InsertPropertyDocument,
  propertyMedia,
  InsertPropertyMedia,
  propertyWaitlist,
  investments,
  InsertInvestment,
  incomeDistributions,
  InsertIncomeDistribution,
  transactions,
  InsertTransaction,
  offerings,
  InsertOffering,
  offeringDocuments,
  secondaryMarketListings,
  InsertSecondaryMarketListing,
  secondaryMarketDeals,
  InsertSecondaryMarketDeal,
  feeSettings,
  platformWallet,
  notifications,
  InsertNotification,
  developerProfiles,
  InsertDeveloperProfile,
  referrals,
  type User,
  type Property,
  type Investment,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER MANAGEMENT
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  
  // If no profile exists, create a default one
  if (result.length === 0) {
    await db.insert(userProfiles).values({ userId });
    const newResult = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return newResult[0] || null;
  }
  
  return result[0];
}

export async function createOrUpdateUserProfile(profile: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserProfile(profile.userId);
  if (existing) {
    await db.update(userProfiles).set(profile).where(eq(userProfiles.userId, profile.userId));
  } else {
    await db.insert(userProfiles).values(profile);
  }
}

export async function getVerificationStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(verificationStatus).where(eq(verificationStatus.userId, userId)).limit(1);
  
  // If no verification status exists, create a default one
  if (result.length === 0) {
    await db.insert(verificationStatus).values({ 
      userId,
      level: 'level_0'
    });
    const newResult = await db.select().from(verificationStatus).where(eq(verificationStatus.userId, userId)).limit(1);
    return newResult[0] || null;
  }
  
  return result[0];
}

export async function updateVerificationStatus(userId: number, updates: Partial<typeof verificationStatus.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getVerificationStatus(userId);
  if (existing) {
    await db.update(verificationStatus).set(updates).where(eq(verificationStatus.userId, userId));
  } else {
    await db.insert(verificationStatus).values({ userId, ...updates });
  }
}

// ============================================
// KYC/AML
// ============================================

export async function createKycDocument(doc: InsertKycDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kycDocuments).values(doc);
  return result;
}

export async function getUserKycDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId)).orderBy(desc(kycDocuments.uploadedAt));
}

export async function updateKycDocumentStatus(docId: number, status: "pending" | "approved" | "rejected", verifiedBy?: number, rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kycDocuments).set({
    status,
    verifiedAt: status === "approved" ? new Date() : undefined,
    verifiedBy,
    rejectionReason,
  }).where(eq(kycDocuments.id, docId));
}

export async function createKycQuestionnaire(questionnaire: InsertKycQuestionnaire) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kycQuestionnaires).values(questionnaire);
  return result;
}

export async function getUserKycQuestionnaire(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kycQuestionnaires).where(eq(kycQuestionnaires.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingKycVerifications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(kycDocuments).where(eq(kycDocuments.status, "pending")).orderBy(desc(kycDocuments.uploadedAt));
}

// ============================================
// PROPERTIES
// ============================================

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(properties).values(property);
  return result;
}

export async function getPropertyById(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAvailableProperties() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(properties).where(eq(properties.status, "available")).orderBy(desc(properties.publishedAt));
}

export async function getPropertiesByType(propertyType: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(properties).where(
    and(
      eq(properties.propertyType, propertyType as any),
      eq(properties.status, "available")
    )
  ).orderBy(desc(properties.publishedAt));
}

export async function searchProperties(filters: {
  propertyType?: string;
  investmentType?: string;
  minValue?: number;
  maxValue?: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.propertyType) conditions.push(eq(properties.propertyType, filters.propertyType as any));
  if (filters.investmentType) conditions.push(eq(properties.investmentType, filters.investmentType as any));
  if (filters.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters.minValue) conditions.push(gte(properties.totalValue, filters.minValue));
  if (filters.maxValue) conditions.push(lte(properties.totalValue, filters.maxValue));
  
  return await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.publishedAt));
}

export async function updateProperty(propertyId: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(properties).set(updates).where(eq(properties.id, propertyId));
}

export async function getPropertyDocuments(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(propertyDocuments).where(eq(propertyDocuments.propertyId, propertyId)).orderBy(desc(propertyDocuments.uploadedAt));
}

export async function createPropertyDocument(doc: InsertPropertyDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(propertyDocuments).values(doc);
  return result;
}

export async function getPropertyMedia(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, propertyId)).orderBy(asc(propertyMedia.displayOrder));
}

export async function createPropertyMedia(media: InsertPropertyMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(propertyMedia).values(media);
  return result;
}

export async function joinPropertyWaitlist(propertyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(propertyWaitlist).values({ propertyId, userId });
    await db.update(properties).set({
      waitlistCount: sql`${properties.waitlistCount} + 1`
    }).where(eq(properties.id, propertyId));
  } catch (error) {
    // Ignore duplicate entry errors
    if (!(error as any).message?.includes('Duplicate entry')) {
      throw error;
    }
  }
}

export async function getPropertyWaitlist(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(propertyWaitlist).where(eq(propertyWaitlist.propertyId, propertyId)).orderBy(desc(propertyWaitlist.joinedAt));
}

// ============================================
// INVESTMENTS
// ============================================

export async function createInvestment(investment: InsertInvestment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(investments).values(investment);
  return result;
}

export async function getInvestmentById(investmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.investmentDate));
}

export async function getPropertyInvestments(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(investments).where(eq(investments.propertyId, propertyId)).orderBy(desc(investments.investmentDate));
}

export async function updateInvestmentStatus(investmentId: number, status: string, updates?: Partial<InsertInvestment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investments).set({ status: status as any, ...updates }).where(eq(investments.id, investmentId));
}

export async function getUserPortfolioSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const userInvestments = await getUserInvestments(userId);
  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const activeInvestments = userInvestments.filter(inv => inv.status === "active").length;
  
  return {
    totalInvested,
    activeInvestments,
    investments: userInvestments,
  };
}

// ============================================
// INCOME DISTRIBUTIONS
// ============================================

export async function createIncomeDistribution(distribution: InsertIncomeDistribution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(incomeDistributions).values(distribution);
  return result;
}

export async function getInvestmentDistributions(investmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(incomeDistributions).where(eq(incomeDistributions.investmentId, investmentId)).orderBy(desc(incomeDistributions.distributionDate));
}

export async function getUserIncomeHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const userInvestments = await getUserInvestments(userId);
  const investmentIds = userInvestments.map(inv => inv.id);
  
  if (investmentIds.length === 0) return [];
  
  return await db.select().from(incomeDistributions).where(
    inArray(incomeDistributions.investmentId, investmentIds)
  ).orderBy(desc(incomeDistributions.distributionDate));
}

// ============================================
// TRANSACTIONS
// ============================================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(transaction);
  return result;
}

export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
}

export async function updateTransactionStatus(transactionId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set({
    status: status as any,
    completedAt: status === "completed" ? new Date() : undefined
  }).where(eq(transactions.id, transactionId));
}

// ============================================
// OFFERINGS (FUNDRAISER)
// ============================================

export async function createOffering(offering: InsertOffering) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(offerings).values(offering);
  return result;
}

export async function getOfferingById(offeringId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(offerings).where(eq(offerings.id, offeringId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFundraiserOfferings(fundraiserId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(offerings).where(eq(offerings.fundraiserId, fundraiserId)).orderBy(desc(offerings.createdAt));
}

export async function getPendingOfferings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(offerings).where(eq(offerings.status, "pending_approval")).orderBy(desc(offerings.submittedAt));
}

export async function updateOfferingStatus(offeringId: number, status: string, approvedBy?: number, rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(offerings).set({
    status: status as any,
    approvedAt: status === "approved" ? new Date() : undefined,
    approvedBy,
    rejectionReason,
  }).where(eq(offerings.id, offeringId));
}

// ============================================
// SECONDARY MARKET
// ============================================

export async function createSecondaryMarketListing(listing: InsertSecondaryMarketListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(secondaryMarketListings).values(listing);
  return result;
}

export async function getActiveSecondaryMarketListings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(secondaryMarketListings).where(eq(secondaryMarketListings.status, "active")).orderBy(desc(secondaryMarketListings.createdAt));
}

export async function createSecondaryMarketDeal(deal: InsertSecondaryMarketDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(secondaryMarketDeals).values(deal);
  return result;
}

export async function getPendingSecondaryMarketDeals() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(secondaryMarketDeals).where(eq(secondaryMarketDeals.status, "pending")).orderBy(desc(secondaryMarketDeals.createdAt));
}

// ============================================
// FEE SETTINGS
// ============================================

export async function getFeeSettings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(feeSettings);
}

export async function updateFeeSettings(transactionType: string, updates: Partial<typeof feeSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(feeSettings).set(updates).where(eq(feeSettings.transactionType, transactionType as any));
}

export async function getPlatformWallet() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformWallet).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getUserNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.read, false));
  
  return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
}

// ============================================
// DEVELOPER PROFILES
// ============================================

export async function createDeveloperProfile(profile: InsertDeveloperProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(developerProfiles).values(profile);
  return result;
}

export async function getDeveloperProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(developerProfiles).where(eq(developerProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVerifiedDevelopers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(developerProfiles).where(eq(developerProfiles.verified, true)).orderBy(desc(developerProfiles.totalFunding));
}

// ============================================
// KYC PROGRESS TRACKING
// ============================================

export async function saveKycProgress(data: InsertKycProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if progress exists for this user
  const existing = await db.select().from(kycProgress).where(eq(kycProgress.userId, data.userId)).limit(1);
  
  if (existing.length > 0) {
    // Update existing progress
    await db.update(kycProgress)
      .set({
        ...data,
        lastSavedAt: new Date(),
      })
      .where(eq(kycProgress.userId, data.userId));
  } else {
    // Insert new progress
    await db.insert(kycProgress).values({
      ...data,
      lastSavedAt: new Date(),
    });
  }
}

export async function getKycProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(kycProgress).where(eq(kycProgress.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function clearKycProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kycProgress).where(eq(kycProgress.userId, userId));
}

// Type exports for convenience
export type { User, Property, Investment };
