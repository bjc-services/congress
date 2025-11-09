import { relations } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  pgEnum,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { User } from "./dashboard-auth.sql";

/**
 * Account status enum
 * - pending: Account created but awaiting approval
 * - approved: Account approved and can login
 * - rejected: Account rejected (can't login)
 * - suspended: Account suspended (can login but may have restrictions)
 */
export const beneficiaryAccountStatusEnum = pgEnum(
  "beneficiary_account_status",
  ["pending", "approved", "rejected", "suspended"],
);

/**
 * Document status enum for uploaded ID documents
 */
export const beneficiaryDocumentStatusEnum = pgEnum(
  "beneficiary_document_status",
  ["pending", "approved", "rejected"],
);

/**
 * beneficiary account table
 * Links to person table via national_id
 */
export const BeneficiaryAccount = createTable(
  "beneficiary_account",
  {
    id: ulid("beneficiaryAccount").primaryKey(),
    nationalId: varchar("national_id", { length: 10 }).notNull().unique(), // 10 digits
    phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(), // E.164 format +972501234567
    passwordHash: text("password_hash"), // Nullable - accounts can be created without password initially
    status: beneficiaryAccountStatusEnum("status").notNull().default("pending"),
    timeApproved: timestamp("time_approved"),
    approvedBy: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    suspendedReason: text("suspended_reason"),
    suspendedUntil: timestamp("suspended_until"),
    lastLoginTime: timestamp("last_login_time"),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"), // Account locked after too many failed attempts
  },
  (table) => [
    index("beneficiary_account_national_id_index").on(table.nationalId),
    index("beneficiary_account_status_index").on(table.status),
  ],
);

/**
 * beneficiary session table
 * Stores JWT tokens or session IDs for authentication
 */
export const BeneficiarySession = createTable(
  "beneficiary_session",
  {
    id: ulid("beneficiarySession").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => BeneficiaryAccount.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("beneficiary_session_account_id_index").on(table.accountId),
    index("beneficiary_session_token_index").on(table.token),
    index("beneficiary_session_expires_at_index").on(table.expiresAt),
  ],
);

/**
 * Password reset token table
 * Stores temporary tokens for password resets (sent via voice call)
 */
export const BeneficiaryPasswordReset = createTable(
  "beneficiary_password_reset",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => BeneficiaryAccount.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    ipAddress: text("ip_address"),
  },
  (table) => [
    index("beneficiary_password_reset_account_id_index").on(table.accountId),
    index("beneficiary_password_reset_token_index").on(table.token),
    index("beneficiary_password_reset_expires_at_index").on(table.expiresAt),
  ],
);

/**
 * OTP (One-Time Password) table
 * Stores OTP codes for password setup/reset (sent via Twilio voice call)
 */
export const BeneficiaryOTP = createTable(
  "beneficiary_otp",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => BeneficiaryAccount.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 6 }).notNull(), // 6-digit OTP code
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    ipAddress: text("ip_address"),
  },
  (table) => [
    index("beneficiary_otp_account_id_index").on(table.accountId),
    index("beneficiary_otp_code_index").on(table.code),
    index("beneficiary_otp_expires_at_index").on(table.expiresAt),
  ],
);

/**
 * Relations
 */
export const beneficiaryAccountRelations = relations(
  BeneficiaryAccount,
  ({ many }) => ({
    sessions: many(BeneficiarySession),
    passwordResets: many(BeneficiaryPasswordReset),
    otps: many(BeneficiaryOTP),
  }),
);

export const beneficiarySessionRelations = relations(
  BeneficiarySession,
  ({ one }) => ({
    account: one(BeneficiaryAccount, {
      fields: [BeneficiarySession.accountId],
      references: [BeneficiaryAccount.id],
    }),
  }),
);

export const beneficiaryPasswordResetRelations = relations(
  BeneficiaryPasswordReset,
  ({ one }) => ({
    account: one(BeneficiaryAccount, {
      fields: [BeneficiaryPasswordReset.accountId],
      references: [BeneficiaryAccount.id],
    }),
  }),
);

export const beneficiaryOTPRelations = relations(BeneficiaryOTP, ({ one }) => ({
  account: one(BeneficiaryAccount, {
    fields: [BeneficiaryOTP.accountId],
    references: [BeneficiaryAccount.id],
  }),
}));
