import { relations } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { userTable } from "./dashboard-auth.sql";

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
export const beneficiaryAccountTable = pgTable(
  "beneficiary_account",
  {
    id: ulid("beneficiaryAccount").primaryKey(),
    nationalId: varchar("national_id", { length: 10 }).notNull().unique(), // 10 digits
    phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(), // E.164 format +972501234567
    passwordHash: text("password_hash").notNull(),
    status: beneficiaryAccountStatusEnum("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at"),
    approvedBy: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    suspendedReason: text("suspended_reason"),
    suspendedUntil: timestamp("suspended_until"),
    lastLoginAt: timestamp("last_login_at"),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"), // Account locked after too many failed attempts
    ...timestamps,
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
export const beneficiarySessionTable = pgTable(
  "beneficiary_session",
  {
    id: ulid("beneficiarySession").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => beneficiaryAccountTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
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
export const beneficiaryPasswordResetTable = pgTable(
  "beneficiary_password_reset",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => beneficiaryAccountTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    ipAddress: text("ip_address"),
    ...timestamps,
  },
  (table) => [
    index("beneficiary_password_reset_account_id_index").on(table.accountId),
    index("beneficiary_password_reset_token_index").on(table.token),
    index("beneficiary_password_reset_expires_at_index").on(table.expiresAt),
  ],
);

/**
 * Relations
 */
export const beneficiaryAccountRelations = relations(
  beneficiaryAccountTable,
  ({ many }) => ({
    sessions: many(beneficiarySessionTable),
    passwordResets: many(beneficiaryPasswordResetTable),
  }),
);

export const beneficiarySessionRelations = relations(
  beneficiarySessionTable,
  ({ one }) => ({
    account: one(beneficiaryAccountTable, {
      fields: [beneficiarySessionTable.accountId],
      references: [beneficiaryAccountTable.id],
    }),
  }),
);

export const beneficiaryPasswordResetRelations = relations(
  beneficiaryPasswordResetTable,
  ({ one }) => ({
    account: one(beneficiaryAccountTable, {
      fields: [beneficiaryPasswordResetTable.accountId],
      references: [beneficiaryAccountTable.id],
    }),
  }),
);
