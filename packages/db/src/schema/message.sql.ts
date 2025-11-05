import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { applicationTable } from "./application.sql";
import { beneficiaryAccountTable } from "./beneficiary-auth.sql";
import { userTable } from "./dashboard-auth.sql";

/**
 * Message type enum - Hardcoded types for UI handling
 * Each type can have specific UI rendering and workflows
 */
export const messageTypeEnum = pgEnum("message_type", [
  "general",
  "document_request",
  "input_request",
  "status_update",
  "approval_notice",
  "rejection_notice",
  "payment_notice",
  "system_announcement",
]);

/**
 * Message recipient type enum - Who receives the message
 */
export const messageRecipientTypeEnum = pgEnum("message_recipient_type", [
  "specific_beneficiary",
  "all_beneficiaries",
  "staff_internal",
]);

/**
 * message table - Flat messaging system
 * Supports typed messages with metadata for specific actions
 * Example metadata for document_request: {requested_documents: ["national_id", "proof_of_residence"]}
 * Example metadata for input_request: {requested_fields: ["bankAccountNo", "bankBranchNo"]}
 */
export const messageTable = pgTable(
  "message",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    messageType: messageTypeEnum("message_type").notNull(),
    recipientType: messageRecipientTypeEnum("recipient_type").notNull(),
    recipientBeneficiaryAccountId: ulid("beneficiaryAccount").references(
      () => beneficiaryAccountTable.id,
      { onDelete: "cascade" },
    ), // For specific beneficiary messages
    applicationId: bigint("application_id", { mode: "number" }).references(
      () => applicationTable.id,
      { onDelete: "set null" },
    ), // Context if related to application
    senderUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }), // Staff member sender
    subject: text("subject"),
    body: text("body").notNull(),
    metadata: jsonb("metadata"), // Type-specific data: {requested_documents: [...], requested_fields: [...]}
    readAt: timestamp("read_at"),
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (table) => [
    index("message_recipient_beneficiary_account_id_index").on(
      table.recipientBeneficiaryAccountId,
    ),
    index("message_application_id_index").on(table.applicationId),
    index("message_message_type_index").on(table.messageType),
    index("message_recipient_type_index").on(table.recipientType),
    index("message_created_at_index").on(table.createdAt),
    index("message_read_at_index").on(table.readAt),
  ],
);

/**
 * Relations
 */
export const messageRelations = relations(messageTable, ({ one }) => ({
  recipientBeneficiaryAccount: one(beneficiaryAccountTable, {
    fields: [messageTable.recipientBeneficiaryAccountId],
    references: [beneficiaryAccountTable.id],
  }),
  application: one(applicationTable, {
    fields: [messageTable.applicationId],
    references: [applicationTable.id],
  }),
  sender: one(userTable, {
    fields: [messageTable.senderUserId],
    references: [userTable.id],
  }),
}));

