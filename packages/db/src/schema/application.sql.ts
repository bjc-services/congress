import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgEnum,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { BeneficiaryAccount } from "./beneficiary-auth.sql";
import { User } from "./dashboard-auth.sql";
import { Person } from "./person.sql";
import { DocumentType } from "./program-requirements.sql";
import { ProgramVersion } from "./program.sql";
import { Upload } from "./upload.sql";

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
export const Application = createTable(
  "application",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => ProgramVersion.id, { onDelete: "restrict" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => Person.id, { onDelete: "restrict" }),
    beneficiaryAccountId: ulid("beneficiaryAccount").references(
      () => BeneficiaryAccount.id,
      { onDelete: "set null" },
    ), // Null for committee-enrolled
    status: applicationStatusEnum("status").notNull().default("draft"),
    timeSubmitted: timestamp("time_submitted"),
    submittedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }), // Staff member who submitted for committee
    reviewedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    timeReviewed: timestamp("time_reviewed"),
    approvedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    timeApproved: timestamp("time_approved"),
    rejectionReason: text("rejection_reason"),
    notes: text("notes"), // Internal staff notes
  },
  (table) => [
    index("application_person_id_index").on(table.personId),
    index("application_status_index").on(table.status),
    index("application_program_version_id_index").on(table.programVersionId),
    index("application_beneficiary_account_id_index").on(
      table.beneficiaryAccountId,
    ),
    index("application_time_submitted_index").on(table.timeSubmitted),
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
export const ApplicationDocument = createTable(
  "application_document",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => Application.id, { onDelete: "cascade" }),
    documentTypeId: bigint("document_type_id", { mode: "number" })
      .notNull()
      .references(() => DocumentType.id, { onDelete: "restrict" }),
    uploadId: ulid("upload")
      .notNull()
      .references(() => Upload.id, { onDelete: "restrict" }),
    status: applicationDocumentStatusEnum("status")
      .notNull()
      .default("pending"),
    reviewedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    timeReviewed: timestamp("time_reviewed"),
    rejectionReason: text("rejection_reason"),
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
export const applicationRelations = relations(Application, ({ one, many }) => ({
  programVersion: one(ProgramVersion, {
    fields: [Application.programVersionId],
    references: [ProgramVersion.id],
  }),
  person: one(Person, {
    fields: [Application.personId],
    references: [Person.id],
  }),
  beneficiaryAccount: one(BeneficiaryAccount, {
    fields: [Application.beneficiaryAccountId],
    references: [BeneficiaryAccount.id],
  }),
  submittedBy: one(User, {
    fields: [Application.submittedByUserId],
    references: [User.id],
    relationName: "application_submitted_by",
  }),
  reviewedBy: one(User, {
    fields: [Application.reviewedByUserId],
    references: [User.id],
    relationName: "application_reviewed_by",
  }),
  approvedBy: one(User, {
    fields: [Application.approvedByUserId],
    references: [User.id],
    relationName: "application_approved_by",
  }),
  documents: many(ApplicationDocument),
}));

export const applicationDocumentRelations = relations(
  ApplicationDocument,
  ({ one }) => ({
    application: one(Application, {
      fields: [ApplicationDocument.applicationId],
      references: [Application.id],
    }),
    documentType: one(DocumentType, {
      fields: [ApplicationDocument.documentTypeId],
      references: [DocumentType.id],
    }),
    upload: one(Upload, {
      fields: [ApplicationDocument.uploadId],
      references: [Upload.id],
    }),
    reviewedBy: one(User, {
      fields: [ApplicationDocument.reviewedByUserId],
      references: [User.id],
    }),
  }),
);
