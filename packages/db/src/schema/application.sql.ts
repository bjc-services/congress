import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { beneficiaryAccountTable } from "./beneficiary-auth.sql";
import { userTable } from "./dashboard-auth.sql";
import { personTable } from "./person.sql";
import { documentTypeTable } from "./program-requirements.sql";
import { programVersionTable } from "./program.sql";
import { uploadTable } from "./upload.sql";

/**
 * Application status enum - Lifecycle states for applications
 */
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "pending_documents",
  "committee_review",
  "approved",
  "rejected",
  "payment_approved",
]);

/**
 * application table - Core application record
 * Can be self-enrolled (beneficiary submits) or committee-enrolled (staff submits)
 */
export const applicationTable = pgTable(
  "application",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => programVersionTable.id, { onDelete: "restrict" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "restrict" }),
    beneficiaryAccountId: ulid("beneficiaryAccount").references(
      () => beneficiaryAccountTable.id,
      { onDelete: "set null" },
    ), // Null for committee-enrolled
    status: applicationStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at"),
    submittedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }), // Staff member who submitted for committee
    reviewedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    approvedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),
    notes: text("notes"), // Internal staff notes
    ...timestamps,
  },
  (table) => [
    index("application_person_id_index").on(table.personId),
    index("application_status_index").on(table.status),
    index("application_program_version_id_index").on(table.programVersionId),
    index("application_beneficiary_account_id_index").on(
      table.beneficiaryAccountId,
    ),
    index("application_submitted_at_index").on(table.submittedAt),
  ],
);

/**
 * Application document status enum
 */
export const applicationDocumentStatusEnum = pgEnum(
  "application_document_status",
  ["pending", "approved", "rejected"],
);

/**
 * application_document table - Links uploaded documents to applications
 * Tracks which documents were provided for which application
 */
export const applicationDocumentTable = pgTable(
  "application_document",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applicationTable.id, { onDelete: "cascade" }),
    documentTypeId: bigint("document_type_id", { mode: "number" })
      .notNull()
      .references(() => documentTypeTable.id, { onDelete: "restrict" }),
    uploadId: ulid("upload")
      .notNull()
      .references(() => uploadTable.id, { onDelete: "restrict" }),
    status: applicationDocumentStatusEnum("status")
      .notNull()
      .default("pending"),
    reviewedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    ...timestamps,
  },
  (table) => [
    index("application_document_application_id_index").on(table.applicationId),
    index("application_document_upload_id_index").on(table.uploadId),
    index("application_document_status_index").on(table.status),
  ],
);

/**
 * Relations
 */
export const applicationRelations = relations(
  applicationTable,
  ({ one, many }) => ({
    programVersion: one(programVersionTable, {
      fields: [applicationTable.programVersionId],
      references: [programVersionTable.id],
    }),
    person: one(personTable, {
      fields: [applicationTable.personId],
      references: [personTable.id],
    }),
    beneficiaryAccount: one(beneficiaryAccountTable, {
      fields: [applicationTable.beneficiaryAccountId],
      references: [beneficiaryAccountTable.id],
    }),
    submittedBy: one(userTable, {
      fields: [applicationTable.submittedByUserId],
      references: [userTable.id],
      relationName: "application_submitted_by",
    }),
    reviewedBy: one(userTable, {
      fields: [applicationTable.reviewedByUserId],
      references: [userTable.id],
      relationName: "application_reviewed_by",
    }),
    approvedBy: one(userTable, {
      fields: [applicationTable.approvedByUserId],
      references: [userTable.id],
      relationName: "application_approved_by",
    }),
    documents: many(applicationDocumentTable),
  }),
);

export const applicationDocumentRelations = relations(
  applicationDocumentTable,
  ({ one }) => ({
    application: one(applicationTable, {
      fields: [applicationDocumentTable.applicationId],
      references: [applicationTable.id],
    }),
    documentType: one(documentTypeTable, {
      fields: [applicationDocumentTable.documentTypeId],
      references: [documentTypeTable.id],
    }),
    upload: one(uploadTable, {
      fields: [applicationDocumentTable.uploadId],
      references: [uploadTable.id],
    }),
    reviewedBy: one(userTable, {
      fields: [applicationDocumentTable.reviewedByUserId],
      references: [userTable.id],
    }),
  }),
);

