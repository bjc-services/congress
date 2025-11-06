import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  char,
  date,
  index,
  numeric,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { Application } from "./application.sql";
import { User } from "./dashboard-auth.sql";
import { Person } from "./person.sql";
import { ProgramVersion } from "./program.sql";
import { Upload } from "./upload.sql";

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
export const Payment = createTable(
  "payment",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => Person.id, { onDelete: "restrict" }),
    applicationId: bigint("application_id", { mode: "number" }).references(
      () => Application.id,
      { onDelete: "set null" },
    ), // Nullable for ad-hoc payments
    programVersionId: bigint("program_version_id", {
      mode: "number",
    }).references(() => ProgramVersion.id, { onDelete: "set null" }), // For reporting, nullable
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentDate: date("payment_date", { mode: "date" }).notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    receiverName: text("receiver_name"), // Who physically received the payment
    receiverSignatureUploadId: ulid("upload").references(() => Upload.id, {
      onDelete: "set null",
    }),
    referenceNumber: text("reference_number"), // Check number, transaction ID, etc.
    bankAccountLast4: char("bank_account_last_4", { length: 4 }), // Last 4 digits of account
    notes: text("notes"), // Staff notes about the payment
    recordedByUserId: ulid("user")
      .notNull()
      .references(() => User.id, { onDelete: "set null" }),
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
export const paymentRelations = relations(Payment, ({ one }) => ({
  person: one(Person, {
    fields: [Payment.personId],
    references: [Person.id],
  }),
  application: one(Application, {
    fields: [Payment.applicationId],
    references: [Application.id],
  }),
  programVersion: one(ProgramVersion, {
    fields: [Payment.programVersionId],
    references: [ProgramVersion.id],
  }),
  receiverSignature: one(Upload, {
    fields: [Payment.receiverSignatureUploadId],
    references: [Upload.id],
  }),
  recordedBy: one(User, {
    fields: [Payment.recordedByUserId],
    references: [User.id],
  }),
}));
