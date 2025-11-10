import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, index, unique } from "drizzle-orm/mysql-core";
import { users } from "./schema";
import { offerings } from "./offerings-schema";

/**
 * INVESTMENT FLOW SCHEMA
 * User-specified tables for investment reservation, eligibility, payments, and escrow
 */

// ============================================
// INVESTMENT RESERVATIONS
// ============================================

export const investmentReservations = mysqlTable("investment_reservations", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offering_id").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareQuantity: int("share_quantity").notNull(),
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  status: mysqlEnum("status", ["active", "expired", "converted", "cancelled"]).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  offeringIdIdx: index("investment_reservations_offering_id_idx").on(table.offeringId),
  userIdIdx: index("investment_reservations_user_id_idx").on(table.userId),
  statusIdx: index("investment_reservations_status_idx").on(table.status),
  expiresAtIdx: index("investment_reservations_expires_at_idx").on(table.expiresAt),
}));

export type InvestmentReservation = typeof investmentReservations.$inferSelect;
export type InsertInvestmentReservation = typeof investmentReservations.$inferInsert;

// ============================================
// INVESTMENT ELIGIBILITY
// ============================================

export const investmentEligibility = mysqlTable("investment_eligibility", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offeringId: int("offering_id").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  isEligible: boolean("is_eligible").notNull().default(false),
  accreditationStatus: mysqlEnum("accreditation_status", [
    "not_checked",
    "pending",
    "verified",
    "rejected",
    "expired"
  ]).notNull().default("not_checked"),
  jurisdictionCheck: mysqlEnum("jurisdiction_check", [
    "not_checked",
    "allowed",
    "restricted",
    "prohibited"
  ]).notNull().default("not_checked"),
  investmentLimit: int("investment_limit"), // Maximum investment amount in cents
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // When eligibility check expires
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  userOfferingUnique: unique("investment_eligibility_user_offering_unique").on(table.userId, table.offeringId),
  userIdIdx: index("investment_eligibility_user_id_idx").on(table.userId),
  offeringIdIdx: index("investment_eligibility_offering_id_idx").on(table.offeringId),
  statusIdx: index("investment_eligibility_status_idx").on(table.isEligible, table.accreditationStatus),
}));

export type InvestmentEligibility = typeof investmentEligibility.$inferSelect;
export type InsertInvestmentEligibility = typeof investmentEligibility.$inferInsert;

// ============================================
// INVESTMENT PAYMENTS
// ============================================

export const investmentPayments = mysqlTable("investment_payments", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investment_id").notNull(),
  paymentMethod: mysqlEnum("payment_method", [
    "bank_transfer",
    "wire_transfer",
    "credit_card",
    "debit_card",
    "ach",
    "check",
    "crypto",
    "other"
  ]).notNull(),
  amountCents: int("amount_cents").notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }), // Transaction ID
  verificationStatus: mysqlEnum("verification_status", [
    "pending",
    "verifying",
    "verified",
    "failed",
    "rejected"
  ]).notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: int("verified_by").references(() => users.id, { onDelete: "set null" }), // Admin who verified
  receiptUrl: text("receipt_url"), // URL to payment receipt
  receiptKey: text("receipt_key"), // S3 key for receipt
  paymentDate: timestamp("payment_date"), // Date payment was made by investor
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  investmentIdIdx: index("investment_payments_investment_id_idx").on(table.investmentId),
  statusIdx: index("investment_payments_status_idx").on(table.verificationStatus),
  methodIdx: index("investment_payments_method_idx").on(table.paymentMethod),
}));

export type InvestmentPayment = typeof investmentPayments.$inferSelect;
export type InsertInvestmentPayment = typeof investmentPayments.$inferInsert;

// ============================================
// ESCROW ACCOUNTS
// ============================================

export const escrowAccounts = mysqlTable("escrow_accounts", {
  id: int("id").autoincrement().primaryKey(),
  offeringId: int("offering_id").notNull().references(() => offerings.id, { onDelete: "cascade" }),
  accountNumber: varchar("account_number", { length: 100 }).notNull(), // Escrow account number
  accountName: varchar("account_name", { length: 255 }), // Name on the escrow account
  bankName: varchar("bank_name", { length: 255 }), // Bank holding the escrow
  totalHeldCents: int("total_held_cents").notNull().default(0), // Total in escrow
  releaseConditions: text("release_conditions"), // Conditions for releasing funds
  status: mysqlEnum("status", [
    "pending_setup",
    "active",
    "releasing",
    "released",
    "closed"
  ]).notNull().default("pending_setup"),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  accountNumberUnique: unique("escrow_accounts_account_number_unique").on(table.accountNumber),
  offeringIdIdx: index("escrow_accounts_offering_id_idx").on(table.offeringId),
  statusIdx: index("escrow_accounts_status_idx").on(table.status),
}));

export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type InsertEscrowAccount = typeof escrowAccounts.$inferInsert;
