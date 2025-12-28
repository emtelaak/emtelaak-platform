import { mysqlTable, int, varchar, text, timestamp, decimal, boolean, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Investor Qualification System Schema
 * FRA Decision 125/2025 Compliance
 * 
 * This schema implements the investor qualification requirements including:
 * - Knowledge Test System
 * - Investor Classification
 * - Investment Limit Calculation and Enforcement
 */

// ============================================
// KNOWLEDGE TEST SYSTEM
// ============================================

export const knowledgeTestQuestions = mysqlTable("knowledge_test_questions", {
  id: int("id").autoincrement().primaryKey(),
  questionText: text("questionText").notNull(),
  questionTextAr: text("questionTextAr"), // Arabic translation
  category: varchar("category", { length: 255 }).notNull(), // e.g., "Risk Management", "Portfolio Diversification"
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("knowledge_test_questions_category_idx").on(table.category),
  difficultyIdx: index("knowledge_test_questions_difficulty_idx").on(table.difficulty),
}));

export const knowledgeTestAnswers = mysqlTable("knowledge_test_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull().references(() => knowledgeTestQuestions.id, { onDelete: "cascade" }),
  answerText: text("answerText").notNull(),
  answerTextAr: text("answerTextAr"), // Arabic translation
  isCorrect: boolean("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  questionIdIdx: index("knowledge_test_answers_question_id_idx").on(table.questionId),
}));

export const knowledgeTestAttempts = mysqlTable("knowledge_test_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: int("score").notNull(), // Score out of 100
  totalQuestions: int("totalQuestions").notNull(),
  correctAnswers: int("correctAnswers").notNull(),
  passed: boolean("passed").notNull(),
  certificateId: varchar("certificateId", { length: 255 }).unique(),
  expiresAt: timestamp("expiresAt"), // Certificates typically expire after 2 years
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("knowledge_test_attempts_user_id_idx").on(table.userId),
  certificateIdIdx: index("knowledge_test_attempts_certificate_id_idx").on(table.certificateId),
  passedIdx: index("knowledge_test_attempts_passed_idx").on(table.passed),
}));

export const knowledgeTestResponses = mysqlTable("knowledge_test_responses", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => knowledgeTestAttempts.id, { onDelete: "cascade" }),
  questionId: int("questionId").notNull().references(() => knowledgeTestQuestions.id),
  selectedAnswerId: int("selectedAnswerId").references(() => knowledgeTestAnswers.id),
  isCorrect: boolean("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  attemptIdIdx: index("knowledge_test_responses_attempt_id_idx").on(table.attemptId),
}));

// ============================================
// INVESTOR CLASSIFICATION & LIMITS
// ============================================

export const investorQualificationStatus = mysqlTable("investor_qualification_status", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Investor Classification
  classification: mysqlEnum("classification", ["retail", "qualified", "accredited"]).notNull(),
  
  // Financial Information
  annualIncome: decimal("annualIncome", { precision: 15, scale: 2 }),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }),
  liquidAssets: decimal("liquidAssets", { precision: 15, scale: 2 }),
  investmentExperience: mysqlEnum("investmentExperience", ["none", "beginner", "intermediate", "advanced"]),
  
  // Investment Limits (calculated based on classification and financial info)
  perOfferingLimit: decimal("perOfferingLimit", { precision: 15, scale: 2 }).notNull(),
  totalPortfolioLimit: decimal("totalPortfolioLimit", { precision: 15, scale: 2 }).notNull(),
  annualInvestmentLimit: decimal("annualInvestmentLimit", { precision: 15, scale: 2 }).notNull(),
  
  // Knowledge Test Reference
  knowledgeTestAttemptId: int("knowledgeTestAttemptId").references(() => knowledgeTestAttempts.id),
  
  // Status and Timestamps
  status: mysqlEnum("status", ["pending", "active", "suspended", "expired"]).default("pending").notNull(),
  lastReviewedAt: timestamp("lastReviewedAt"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("investor_qualification_status_user_id_idx").on(table.userId),
  classificationIdx: index("investor_qualification_status_classification_idx").on(table.classification),
  statusIdx: index("investor_qualification_status_status_idx").on(table.status),
}));

// ============================================
// INVESTMENT LIMIT TRACKING
// ============================================

export const investmentLimitTracking = mysqlTable("investment_limit_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Current Year Tracking
  currentYearTotal: decimal("currentYearTotal", { precision: 15, scale: 2 }).default("0.00").notNull(),
  currentYearStart: timestamp("currentYearStart").notNull(),
  currentYearEnd: timestamp("currentYearEnd").notNull(),
  
  // Total Portfolio Tracking
  totalInvested: decimal("totalInvested", { precision: 15, scale: 2 }).default("0.00").notNull(),
  activeInvestmentsCount: int("activeInvestmentsCount").default(0).notNull(),
  
  // Last Updated
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("investment_limit_tracking_user_id_idx").on(table.userId),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type KnowledgeTestQuestion = typeof knowledgeTestQuestions.$inferSelect;
export type InsertKnowledgeTestQuestion = typeof knowledgeTestQuestions.$inferInsert;

export type KnowledgeTestAnswer = typeof knowledgeTestAnswers.$inferSelect;
export type InsertKnowledgeTestAnswer = typeof knowledgeTestAnswers.$inferInsert;

export type KnowledgeTestAttempt = typeof knowledgeTestAttempts.$inferSelect;
export type InsertKnowledgeTestAttempt = typeof knowledgeTestAttempts.$inferInsert;

export type KnowledgeTestResponse = typeof knowledgeTestResponses.$inferSelect;
export type InsertKnowledgeTestResponse = typeof knowledgeTestResponses.$inferInsert;

export type InvestorQualificationStatus = typeof investorQualificationStatus.$inferSelect;
export type InsertInvestorQualificationStatus = typeof investorQualificationStatus.$inferInsert;

export type InvestmentLimitTracking = typeof investmentLimitTracking.$inferSelect;
export type InsertInvestmentLimitTracking = typeof investmentLimitTracking.$inferInsert;
