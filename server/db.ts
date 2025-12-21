import { eq, and, desc, asc, sql, gte, lte, gt, ne, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users, adminPermissions, permissionRoleTemplates, kycProgress, InsertKycProgress,
  userProfiles,
  platformSettings,
  platformContent,
  mediaLibrary,
  InsertMediaLibraryItem,
  InsertUserProfile,
  kycDocuments,
  InsertKycDocument,
  kycQuestionnaires,
  exchangeRates,
  InsertKycQuestionnaire,
  verificationStatus,
  properties,
  InsertProperty,
  propertyDocuments,
  InsertPropertyDocument,
  propertyMedia,
  InsertPropertyMedia,
  propertyWaitlist,
  userSavedProperties,
  investments,
  InsertInvestment,
  incomeDistributions,
  InsertIncomeDistribution,
  transactions,
  InsertTransaction,
  invoices,
  InsertInvoice,
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
  emailTemplates,
  InsertEmailTemplate,
  developerProfiles,
  InsertDeveloperProfile,
  referrals,
  type User,
  type Property,
  type Investment,
  userWallets,
  userBankAccounts,
  walletTransactions,
  InsertUserWallet,
  InsertUserBankAccount,
  InsertWalletTransaction,
  userSessions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse the DATABASE_URL
      const dbUrl = new URL(process.env.DATABASE_URL);
      
      // Create mysql2 connection pool
      // Check if ssl=false is in the URL params
      const sslParam = dbUrl.searchParams.get('ssl');
      const useSSL = sslParam !== 'false';
      
      _pool = mysql.createPool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 3306,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1), // Remove leading '/'
        ...(useSSL ? { ssl: { rejectUnauthorized: true } } : {}),
        connectionLimit: 20, // Increased from 10 to handle more concurrent users
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      
      // Test the connection
      const connection = await _pool.getConnection();
      console.log("[Database] Successfully connected to TiDB Cloud");
      connection.release();
      
      // Create Drizzle instance with the pool
      _db = drizzle(_pool) as any;
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
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
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
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
  if (!db) return null;
  const result = await db.select().from(kycQuestionnaires).where(eq(kycQuestionnaires.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
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

// Property Analytics
export async function trackPropertyView(propertyId: number, userId?: number, sessionId?: string) {
  const db = await getDb();  
  if (!db) return;
  
  const { propertyViews } = await import("../drizzle/schema");
  await db.insert(propertyViews).values({
    propertyId,
    userId: userId || null,
    sessionId: sessionId || null,
  });
}

export async function getPropertyAnalytics(propertyId: number) {
  const db = await getDb();  
  if (!db) return null;
  
  const { propertyViews, propertyWaitlist, investments } = await import("../drizzle/schema");
  const { count, sql: sqlFunc } = await import("drizzle-orm");
  
  // Get property details
  const property = await getPropertyById(propertyId);
  if (!property) return null;
  
  // Get view count
  const [viewsResult] = await db.select({ count: count() })
    .from(propertyViews)
    .where(eq(propertyViews.propertyId, propertyId));
  
  // Get unique viewers (by userId and sessionId)
  const [uniqueViewersResult] = await db.select({ 
    count: sqlFunc<number>`COUNT(DISTINCT COALESCE(${propertyViews.userId}, ${propertyViews.sessionId}))`
  })
    .from(propertyViews)
    .where(eq(propertyViews.propertyId, propertyId));
  
  // Get waitlist count
  const [waitlistResult] = await db.select({ count: count() })
    .from(propertyWaitlist)
    .where(eq(propertyWaitlist.propertyId, propertyId));
  
  // Get investor count
  const [investorsResult] = await db.select({ count: count(sqlFunc`DISTINCT ${investments.userId}`) })
    .from(investments)
    .where(eq(investments.propertyId, propertyId));
  
  // Calculate funding progress
  const fundedAmount = property.totalValue - property.availableValue;
  const fundingPercentage = (fundedAmount / property.totalValue) * 100;
  
  return {
    property,
    views: viewsResult.count,
    uniqueViewers: uniqueViewersResult.count,
    waitlistCount: waitlistResult.count,
    investorCount: investorsResult.count,
    fundedAmount,
    fundingPercentage: Math.round(fundingPercentage * 100) / 100,
  };
}

export async function getAllPropertiesAnalytics() {
  const db = await getDb();
  if (!db) return [];
  
  const { propertyViews, propertyWaitlist, investments } = await import("../drizzle/schema");
  const { count, sql: sqlFunc } = await import("drizzle-orm");
  
  // Get all properties
  const allProperties = await db.select().from(properties).orderBy(desc(properties.createdAt));
  
  // Get analytics for each property
  const analyticsPromises = allProperties.map(async (property) => {
    // Get view count
    const [viewsResult] = await db.select({ count: count() })
      .from(propertyViews)
      .where(eq(propertyViews.propertyId, property.id));
    
    // Get waitlist count
    const [waitlistResult] = await db.select({ count: count() })
      .from(propertyWaitlist)
      .where(eq(propertyWaitlist.propertyId, property.id));
    
    // Get investor count
    const [investorsResult] = await db.select({ count: count(sqlFunc`DISTINCT ${investments.userId}`) })
      .from(investments)
      .where(eq(investments.propertyId, property.id));
    
    // Calculate funding progress
    const fundedAmount = property.totalValue - property.availableValue;
    const fundingPercentage = (fundedAmount / property.totalValue) * 100;
    
    return {
      ...property,
      views: viewsResult.count,
      waitlistCount: waitlistResult.count,
      investorCount: investorsResult.count,
      fundedAmount,
      fundingPercentage: Math.round(fundingPercentage * 100) / 100,
    };
  });
  
  return await Promise.all(analyticsPromises);
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

export async function isUserOnWaitlist(propertyId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(propertyWaitlist)
    .where(and(eq(propertyWaitlist.propertyId, propertyId), eq(propertyWaitlist.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function saveProperty(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(userSavedProperties).values({ userId, propertyId });
  } catch (error) {
    // Ignore duplicate entry errors
    if (!(error as any).message?.includes('Duplicate entry')) {
      throw error;
    }
  }
}

export async function unsaveProperty(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userSavedProperties)
    .where(and(eq(userSavedProperties.userId, userId), eq(userSavedProperties.propertyId, propertyId)));
}

export async function getSavedProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({ property: properties })
    .from(userSavedProperties)
    .innerJoin(properties, eq(userSavedProperties.propertyId, properties.id))
    .where(eq(userSavedProperties.userId, userId))
    .orderBy(desc(userSavedProperties.savedAt));
  
  return result.map(r => r.property);
}

export async function isPropertySaved(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(userSavedProperties)
    .where(and(eq(userSavedProperties.userId, userId), eq(userSavedProperties.propertyId, propertyId)))
    .limit(1);
  return result.length > 0;
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
// INVOICES
// ============================================

export async function generateInvoiceNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the last invoice number
  const lastInvoice = await db.select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .orderBy(desc(invoices.id))
    .limit(1);
  
  if (lastInvoice.length === 0) {
    return "INV-00001";
  }
  
  const lastNumber = parseInt(lastInvoice[0].invoiceNumber.split("-")[1]);
  const nextNumber = lastNumber + 1;
  return `INV-${nextNumber.toString().padStart(5, "0")}`;
}

export async function createInvoice(invoice: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate invoice number if not provided
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = await generateInvoiceNumber();
  }
  
  const result = await db.insert(invoices).values(invoice);
  return result;
}

export async function getInvoiceById(invoiceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
}

export async function updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date, transactionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (paidAt) updateData.paidAt = paidAt;
  if (transactionId) updateData.transactionId = transactionId;
  
  await db.update(invoices).set(updateData).where(eq(invoices.id, invoiceId));
}

export async function getInvoiceWithDetails(invoiceId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return null;
  
  const user = await getUserByOpenId(invoice.userId.toString());
  const property = await getPropertyById(invoice.propertyId);
  
  return {
    invoice,
    user,
    property,
  };
}

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all invoices with user and property details
  const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  
  const invoicesWithDetails = await Promise.all(
    allInvoices.map(async (invoice) => {
      const user = await getUserById(invoice.userId);
      const property = await getPropertyById(invoice.propertyId);
      return {
        ...invoice,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        propertyName: property?.name || 'Unknown',
      };
    })
  );
  
  return invoicesWithDetails;
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

// Platform Settings
export async function getPlatformSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function setPlatformSetting(key: string, value: string, updatedBy: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(platformSettings).values({
    settingKey: key,
    settingValue: value,
    updatedBy,
  }).onDuplicateKeyUpdate({
    set: {
      settingValue: value,
      updatedBy,
      updatedAt: new Date(),
    },
  });
}

// Type exports for convenience
export type { User, Property, Investment };


export async function getUserRecentActivity(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // Gather activities from multiple sources
  const activities: Array<{
    id: string;
    type: 'investment' | 'transaction' | 'kyc_update' | 'profile_update' | 'distribution';
    description: string;
    amount?: number;
    currency?: string;
    status?: string;
    timestamp: Date;
  }> = [];

  // Recent investments
  const recentInvestments = await db
    .select({
      id: investments.id,
      amount: investments.amount,
      shares: investments.shares,
      status: investments.status,
      investmentDate: investments.investmentDate,
      propertyId: investments.propertyId,
    })
    .from(investments)
    .where(eq(investments.userId, userId))
    .orderBy(desc(investments.investmentDate))
    .limit(5);

  for (const inv of recentInvestments) {
    activities.push({
      id: `inv-${inv.id}`,
      type: 'investment',
      description: `Invested in property #${inv.propertyId}`,
      amount: inv.amount,
      currency: 'USD',
      status: inv.status,
      timestamp: inv.investmentDate,
    });
  }

  // Recent transactions
  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(5);

  for (const txn of recentTransactions) {
    activities.push({
      id: `txn-${txn.id}`,
      type: 'transaction',
      description: `${txn.type} transaction`,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      timestamp: txn.createdAt,
    });
  }

  // Recent income distributions
  const userInvestments = await db
    .select({ id: investments.id })
    .from(investments)
    .where(eq(investments.userId, userId));

  if (userInvestments.length > 0) {
    const investmentIds = userInvestments.map(i => i.id);
    const recentDistributions = await db
      .select()
      .from(incomeDistributions)
      .where(sql`${incomeDistributions.investmentId} IN (${sql.join(investmentIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(incomeDistributions.distributionDate))
      .limit(5);

    for (const dist of recentDistributions) {
      activities.push({
        id: `dist-${dist.id}`,
        type: 'distribution',
        description: `Received ${dist.distributionType} distribution`,
        amount: dist.amount,
        currency: 'USD',
        status: dist.status,
        timestamp: dist.distributionDate,
      });
    }
  }

  // Recent KYC updates
  const kycUpdates = await db
    .select()
    .from(kycQuestionnaires)
    .where(eq(kycQuestionnaires.userId, userId))
    .orderBy(desc(kycQuestionnaires.submittedAt))
    .limit(2);

  for (const kyc of kycUpdates) {
    activities.push({
      id: `kyc-${kyc.id}`,
      type: 'kyc_update',
      description: `KYC questionnaire ${kyc.status}`,
      status: kyc.status,
      timestamp: kyc.submittedAt || new Date(),
    });
  }

  // Recent profile updates
  const profileUpdates = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .orderBy(desc(userProfiles.updatedAt))
    .limit(1);

  if (profileUpdates.length > 0 && profileUpdates[0].updatedAt) {
    activities.push({
      id: `profile-${profileUpdates[0].id}`,
      type: 'profile_update',
      description: 'Updated profile information',
      timestamp: profileUpdates[0].updatedAt,
    });
  }

  // Sort all activities by timestamp and return limited results
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}


// ============================================
// EXCHANGE RATES
// ============================================

export async function getLatestExchangeRates(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get exchange rates: database not available");
    return {};
  }

  try {
    const rates = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.baseCurrency, "USD"))
      .orderBy(desc(exchangeRates.fetchedAt))
      .limit(20); // Get latest rate for each currency

    const ratesMap: Record<string, number> = { USD: 1.0 };
    
    // Use the most recent rate for each currency
    const seenCurrencies = new Set<string>();
    for (const rate of rates) {
      if (!seenCurrencies.has(rate.targetCurrency)) {
        ratesMap[rate.targetCurrency] = Number(rate.rate);
        seenCurrencies.add(rate.targetCurrency);
      }
    }

    return ratesMap;
  } catch (error) {
    console.error("[Database] Failed to get exchange rates:", error);
    return {};
  }
}

export async function saveExchangeRates(rates: Record<string, number>, source: string = "exchangerate-api.com"): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save exchange rates: database not available");
    return;
  }

  try {
    const now = new Date();
    const rateEntries = Object.entries(rates)
      .filter(([currency]) => currency !== "USD")
      .map(([currency, rate]) => ({
        baseCurrency: "USD",
        targetCurrency: currency,
        rate: rate.toString(),
        source,
        fetchedAt: now,
        createdAt: now,
      }));

    if (rateEntries.length > 0) {
      await db.insert(exchangeRates).values(rateEntries);
      console.log(`[Database] Saved ${rateEntries.length} exchange rates`);
    }
  } catch (error) {
    console.error("[Database] Failed to save exchange rates:", error);
    throw error;
  }
}

export async function fetchAndSaveExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates from API");
    }
    const data = await response.json();
    const rates = data.rates as Record<string, number>;
    
    await saveExchangeRates(rates, "exchangerate-api.com");
    return rates;
  } catch (error) {
    console.error("[Exchange Rates] Failed to fetch and save rates:", error);
    throw error;
  }
}


// Admin user management functions
export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  } catch (error) {
    console.error("[Database] Failed to get users:", error);
    return [];
  }
}

export async function updateUserById(id: number, updates: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  try {
    await db.update(users).set(updates).where(eq(users.id, id));
    console.log(`[Database] Updated user ${id}`);
  } catch (error) {
    console.error("[Database] Failed to update user:", error);
    throw error;
  }
}

export async function deleteUserById(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }

  try {
    await db.delete(users).where(eq(users.id, id));
    console.log(`[Database] Deleted user ${id}`);
  } catch (error) {
    console.error("[Database] Failed to delete user:", error);
    throw error;
  }
}

export async function createUser(user: InsertUser): Promise<User> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(users).values(user);
    const insertId = Number(result[0].insertId);
    const newUser = await db.select().from(users).where(eq(users.id, insertId)).limit(1);
    return newUser[0];
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}


export async function bulkCreateUsers(usersData: InsertUser[]): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of usersData) {
    try {
      await db.insert(users).values(user);
      success++;
    } catch (error: any) {
      failed++;
      errors.push(`Failed to create user ${user.email || user.openId}: ${error.message}`);
    }
  }

  return { success, failed, errors };
}


// ============================================
// ADMIN PERMISSIONS
// ============================================

export async function getAdminPermissions(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertAdminPermissions(userId: number, permissions: Partial<typeof adminPermissions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAdminPermissions(userId);

  if (existing) {
    await db
      .update(adminPermissions)
      .set({ ...permissions, updatedAt: new Date() })
      .where(eq(adminPermissions.userId, userId));
  } else {
    // Provide default false values for all permission fields
    const permissionValues = {
      userId,
      canManageUsers: (permissions as any).canManageUsers ?? false,
      canBulkUploadUsers: (permissions as any).canBulkUploadUsers ?? false,
      canEditContent: (permissions as any).canEditContent ?? false,
      canManageProperties: (permissions as any).canManageProperties ?? false,
      canReviewKYC: (permissions as any).canReviewKYC ?? false,
      canApproveInvestments: (permissions as any).canApproveInvestments ?? false,
      canManageTransactions: (permissions as any).canManageTransactions ?? false,
      canViewFinancials: (permissions as any).canViewFinancials ?? false,
      canAccessCRM: (permissions as any).canAccessCRM ?? false,
      canViewAnalytics: (permissions as any).canViewAnalytics ?? false,
      canManageSettings: (permissions as any).canManageSettings ?? false,
    };
    
    await db.insert(adminPermissions).values(permissionValues);
  }

  return await getAdminPermissions(userId);
}

export async function getAllAdminPermissions() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: adminPermissions.id,
      userId: adminPermissions.userId,
      userName: users.name,
      userEmail: users.email,
      canManageUsers: adminPermissions.canManageUsers,
      canBulkUploadUsers: adminPermissions.canBulkUploadUsers,
      canEditContent: adminPermissions.canEditContent,
      canManageProperties: adminPermissions.canManageProperties,
      canReviewKYC: adminPermissions.canReviewKYC,
      canApproveInvestments: adminPermissions.canApproveInvestments,
      canManageTransactions: adminPermissions.canManageTransactions,
      canViewFinancials: adminPermissions.canViewFinancials,
      canAccessCRM: adminPermissions.canAccessCRM,
      canViewAnalytics: adminPermissions.canViewAnalytics,
      canManageSettings: adminPermissions.canManageSettings,
      createdAt: adminPermissions.createdAt,
      updatedAt: adminPermissions.updatedAt,
    })
    .from(adminPermissions)
    .leftJoin(users, eq(adminPermissions.userId, users.id));
}


// ============================================
// PERMISSION ROLE TEMPLATES
// ============================================

export async function getAllRoleTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(permissionRoleTemplates).orderBy(asc(permissionRoleTemplates.name));
}

export async function getRoleTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(permissionRoleTemplates)
    .where(eq(permissionRoleTemplates.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createRoleTemplate(template: typeof permissionRoleTemplates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(permissionRoleTemplates).values(template);
  return await getRoleTemplateById(Number((result as any).insertId));
}

export async function updateRoleTemplate(id: number, template: Partial<typeof permissionRoleTemplates.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(permissionRoleTemplates)
    .set({ ...template, updatedAt: new Date() })
    .where(eq(permissionRoleTemplates.id, id));

  return await getRoleTemplateById(id);
}

export async function deleteRoleTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if it's a system template
  const template = await getRoleTemplateById(id);
  if (template?.isSystem) {
    throw new Error("Cannot delete system templates");
  }

  await db.delete(permissionRoleTemplates).where(eq(permissionRoleTemplates.id, id));
}

export async function applyRoleTemplateToUser(userId: number, templateId: number) {
  const template = await getRoleTemplateById(templateId);
  if (!template) throw new Error("Template not found");

  const permissions = {
    canManageUsers: template.canManageUsers,
    canBulkUploadUsers: template.canBulkUploadUsers,
    canEditContent: template.canEditContent,
    canManageProperties: template.canManageProperties,
    canReviewKYC: template.canReviewKYC,
    canApproveInvestments: template.canApproveInvestments,
    canManageTransactions: template.canManageTransactions,
    canViewFinancials: template.canViewFinancials,
    canAccessCRM: template.canAccessCRM,
    canViewAnalytics: template.canViewAnalytics,
    canManageSettings: template.canManageSettings,
  };

  return await upsertAdminPermissions(userId, permissions);
}


// ============================================
// WALLET OPERATIONS
// ============================================

export async function getOrCreateUserWallet(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Try to get existing wallet
  const existing = await db.select().from(userWallets).where(eq(userWallets.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  // Create new wallet if doesn't exist
  await db.insert(userWallets).values({ userId, balance: 0, currency: "EGP" });
  const newWallet = await db.select().from(userWallets).where(eq(userWallets.userId, userId)).limit(1);
  return newWallet[0];
}

export async function getWalletBalance(userId: number) {
  const wallet = await getOrCreateUserWallet(userId);
  return wallet ? wallet.balance : 0;
}

export async function updateWalletBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(userWallets)
    .set({ balance: sql`balance + ${amount}` })
    .where(eq(userWallets.userId, userId));
}

export async function addBankAccount(account: InsertUserBankAccount) {
  const db = await getDb();
  if (!db) return null;

  // If this is set as default, unset other defaults
  if (account.isDefault) {
    await db.update(userBankAccounts)
      .set({ isDefault: false })
      .where(eq(userBankAccounts.userId, account.userId));
  }

  const result = await db.insert(userBankAccounts).values(account);
  return result;
}

export async function getUserBankAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userBankAccounts).where(eq(userBankAccounts.userId, userId));
}

export async function setDefaultBankAccount(userId: number, accountId: number) {
  const db = await getDb();
  if (!db) return;

  // Unset all defaults for this user
  await db.update(userBankAccounts)
    .set({ isDefault: false })
    .where(eq(userBankAccounts.userId, userId));

  // Set the specified account as default
  await db.update(userBankAccounts)
    .set({ isDefault: true })
    .where(and(eq(userBankAccounts.id, accountId), eq(userBankAccounts.userId, userId)));
}

export async function deleteBankAccount(userId: number, accountId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(userBankAccounts)
    .where(and(eq(userBankAccounts.id, accountId), eq(userBankAccounts.userId, userId)));
}

export async function createWalletTransaction(transaction: InsertWalletTransaction) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(walletTransactions).values(transaction);
  return result;
}

export async function getWalletTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

export async function updateTransactionStatusWallet(transactionId: number, status: "pending" | "completed" | "failed" | "cancelled") {
  const db = await getDb();
  if (!db) return;

  await db.update(walletTransactions)
    .set({ status })
    .where(eq(walletTransactions.id, transactionId));
}

export async function completeDepositTransaction(transactionId: number, userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;

  // Update transaction status
  await updateTransactionStatusWallet(transactionId, "completed");

  // Update wallet balance
  await updateWalletBalance(userId, amount);
}

export async function completeWithdrawalTransaction(transactionId: number, userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;

  // Check if user has sufficient balance
  const balance = await getWalletBalance(userId);
  if (balance < amount) {
    throw new Error("Insufficient balance");
  }

  // Update transaction status
  await updateTransactionStatusWallet(transactionId, "completed");

  // Deduct from wallet balance
  await updateWalletBalance(userId, -amount);
}


// Admin Wallet Management Functions
export async function getPendingWalletTransactions() {
  const db = await getDb();
  if (!db) return [];
  
  const transactions = await db
    .select({
      id: walletTransactions.id,
      userId: walletTransactions.userId,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      status: walletTransactions.status,
      paymentMethod: walletTransactions.paymentMethod,
      receiptUrl: walletTransactions.receiptUrl,
      reference: walletTransactions.reference,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.userId, users.id))
    .where(eq(walletTransactions.status, "pending"))
    .orderBy(desc(walletTransactions.createdAt));
  
  return transactions;
}

export async function getAllWalletTransactions(filters: {
  status?: "pending" | "completed" | "failed" | "cancelled" | "all";
  type?: "deposit" | "withdrawal" | "all";
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select({
      id: walletTransactions.id,
      userId: walletTransactions.userId,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      status: walletTransactions.status,
      paymentMethod: walletTransactions.paymentMethod,
      receiptUrl: walletTransactions.receiptUrl,
      reference: walletTransactions.reference,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.userId, users.id))
    .$dynamic();
  
  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(walletTransactions.status, filters.status));
  }
  if (filters.type && filters.type !== "all") {
    conditions.push(eq(walletTransactions.type, filters.type));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const transactions = await query
    .orderBy(desc(walletTransactions.createdAt))
    .limit(filters.limit || 100);
  
  return transactions;
}

export async function approveWalletTransaction(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get transaction details
  const [transaction] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, transactionId))
    .limit(1);
  
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  
  if (transaction.status !== "pending") {
    throw new Error("Transaction is not pending");
  }
  
  // Update transaction status
  await db
    .update(walletTransactions)
    .set({ status: "completed" })
    .where(eq(walletTransactions.id, transactionId));
  
  // Update wallet balance
  if (transaction.type === "deposit") {
    // Add to balance
    await db.execute(sql`
      UPDATE user_wallets 
      SET balance = balance + ${transaction.amount}
      WHERE userId = ${transaction.userId}
    `);
  } else if (transaction.type === "withdrawal") {
    // Subtract from balance
    await db.execute(sql`
      UPDATE user_wallets 
      SET balance = balance - ${transaction.amount}
      WHERE userId = ${transaction.userId}
    `);
  }
  
  return { success: true };
}

export async function rejectWalletTransaction(transactionId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get transaction details
  const [transaction] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, transactionId))
    .limit(1);
  
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  
  if (transaction.status !== "pending") {
    throw new Error("Transaction is not pending");
  }
  
  // Update transaction status
  await db
    .update(walletTransactions)
    .set({ 
      status: "failed",
      description: reason ? `${transaction.description} (Rejected: ${reason})` : transaction.description,
    })
    .where(eq(walletTransactions.id, transactionId));
  
  return { success: true };
}


// Platform Content Management
export async function getPlatformContent(key: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(platformContent).where(eq(platformContent.key, key)).limit(1);
  return result[0] || null;
}

export async function upsertPlatformContent(data: { key: string; content: any; contentAr?: any; updatedBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getPlatformContent(data.key);

  if (existing) {
    await db
      .update(platformContent)
      .set({
        content: data.content,
        contentAr: data.contentAr,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(platformContent.key, data.key));
  } else {
    await db.insert(platformContent).values({
      key: data.key,
      content: data.content,
      contentAr: data.contentAr,
      updatedBy: data.updatedBy,
    });
  }

  return getPlatformContent(data.key);
}


// ===== Media Library Functions =====

export async function getMediaLibraryItems(options: {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 50, offset = 0, search, tags } = options;

  let query = db.select().from(mediaLibrary);

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        like(mediaLibrary.fileName, `%${search}%`),
        like(mediaLibrary.title, `%${search}%`)
      )
    ) as any;
  }

  // Apply pagination
  const results = await query.limit(limit).offset(offset).orderBy(desc(mediaLibrary.createdAt));

  // Filter by tags if provided (JSON search is complex, so we filter in memory)
  if (tags && tags.length > 0) {
    return results.filter((item) => {
      const itemTags = (item.tags as string[]) || [];
      return tags.some((tag) => itemTags.includes(tag));
    });
  }

  return results;
}

export async function addMediaLibraryItem(item: InsertMediaLibraryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mediaLibrary).values(item);
  
  // Fetch and return the inserted item
  const insertedItem = await db
    .select()
    .from(mediaLibrary)
    .where(eq(mediaLibrary.id, result[0].insertId))
    .limit(1);

  return insertedItem[0];
}

export async function updateMediaLibraryItem(
  id: number,
  updates: {
    title?: string;
    altText?: string;
    tags?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(mediaLibrary).set(updates).where(eq(mediaLibrary.id, id));

  // Return updated item
  const updated = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1);
  return updated[0];
}

export async function deleteMediaLibraryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
  return { success: true };
}


// ============================================
// Email Templates
// ============================================

export async function getAllEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}

export async function getEmailTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmailTemplateByType(type: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Get active template for this type
  const result = await db.select()
    .from(emailTemplates)
    .where(and(
      eq(emailTemplates.type, type as any),
      eq(emailTemplates.isActive, true)
    ))
    .orderBy(desc(emailTemplates.isDefault))
    .limit(1);
    
  return result.length > 0 ? result[0] : null;
}

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailTemplates).values(template);
  return result[0].insertId;
}

export async function updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailTemplates).set(updates).where(eq(emailTemplates.id, id));
  return await getEmailTemplateById(id);
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  return { success: true };
}


// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createUserSession(session: {
  sessionId: string;
  userId: number;
  deviceInfo?: string;
  ipAddress?: string;
  location?: string;
  browser?: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Build the insert object with only defined values
  const insertData: any = {
    sessionId: session.sessionId,
    userId: session.userId,
    expiresAt: session.expiresAt,
  };
  
  // Only add optional fields if they have values
  if (session.deviceInfo) insertData.deviceInfo = session.deviceInfo;
  if (session.ipAddress) insertData.ipAddress = session.ipAddress;
  if (session.location) insertData.location = session.location;
  if (session.browser) insertData.browser = session.browser;
  
  const result = await db.insert(userSessions).values(insertData);
  return result;
}

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get only active sessions that haven't expired
  return await db.select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true),
        gt(userSessions.expiresAt, new Date())
      )
    )
    .orderBy(desc(userSessions.lastActivity));
}

export async function getSessionById(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(userSessions)
    .where(eq(userSessions.sessionId, sessionId))
    .limit(1);
    
  return result.length > 0 ? result[0] : null;
}

export async function updateSessionActivity(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userSessions)
    .set({ lastActivity: new Date() })
    .where(eq(userSessions.sessionId, sessionId));
}

export async function revokeSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userSessions)
    .set({ isActive: false })
    .where(eq(userSessions.sessionId, sessionId));
}

export async function revokeAllUserSessions(userId: number, exceptSessionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(userSessions.userId, userId)];
  if (exceptSessionId) {
    conditions.push(ne(userSessions.sessionId, exceptSessionId));
  }
  
  await db.update(userSessions)
    .set({ isActive: false })
    .where(and(...conditions));
}

export async function cleanupExpiredSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Mark expired sessions as inactive
  await db.update(userSessions)
    .set({ isActive: false })
    .where(
      and(
        eq(userSessions.isActive, true),
        lte(userSessions.expiresAt, new Date())
      )
    );
}

export async function updateUserLastLogin(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}
