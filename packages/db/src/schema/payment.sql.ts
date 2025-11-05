import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  char,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { applicationTable } from "./application.sql";
import { userTable } from "./dashboard-auth.sql";
import { personTable } from "./person.sql";
import { programVersionTable } from "./program.sql";
import { uploadTable } from "./upload.sql";

/**
 * Payment method enum - How the payment was made
 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "eft",
  "check",
  "coupon",
  "card",
  "other",
]);

/**
 * Payment status enum - Payment lifecycle
 */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * payment table - Actual payment records
 * Can be linked to an application or standalone (ad-hoc payments)
 * Staff has flexibility to record payments without linking to any program/application
 */
export const paymentTable = pgTable(
  "payment",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "restrict" }),
    applicationId: bigint("application_id", { mode: "number" }).references(
      () => applicationTable.id,
      { onDelete: "set null" },
    ), // Nullable for ad-hoc payments
    programVersionId: bigint("program_version_id", { mode: "number" }).references(
      () => programVersionTable.id,
      { onDelete: "set null" },
    ), // For reporting, nullable
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentDate: date("payment_date", { mode: "date" }).notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    receiverName: text("receiver_name"), // Who physically received the payment
    receiverSignatureUploadId: ulid("upload").references(() => uploadTable.id, {
      onDelete: "set null",
    }),
    referenceNumber: text("reference_number"), // Check number, transaction ID, etc.
    bankAccountLast4: char("bank_account_last_4", { length: 4 }), // Last 4 digits of account
    notes: text("notes"), // Staff notes about the payment
    recordedByUserId: ulid("user")
      .notNull()
      .references(() => userTable.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("payment_person_id_index").on(table.personId),
    index("payment_application_id_index").on(table.applicationId),
    index("payment_program_version_id_index").on(table.programVersionId),
    index("payment_payment_date_index").on(table.paymentDate),
    index("payment_status_index").on(table.status),
    index("payment_recorded_by_user_id_index").on(table.recordedByUserId),
  ],
);

/**
 * Relations
 */
export const paymentRelations = relations(paymentTable, ({ one }) => ({
  person: one(personTable, {
    fields: [paymentTable.personId],
    references: [personTable.id],
  }),
  application: one(applicationTable, {
    fields: [paymentTable.applicationId],
    references: [applicationTable.id],
  }),
  programVersion: one(programVersionTable, {
    fields: [paymentTable.programVersionId],
    references: [programVersionTable.id],
  }),
  receiverSignature: one(uploadTable, {
    fields: [paymentTable.receiverSignatureUploadId],
    references: [uploadTable.id],
  }),
  recordedBy: one(userTable, {
    fields: [paymentTable.recordedByUserId],
    references: [userTable.id],
  }),
}));

