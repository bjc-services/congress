import { relations } from "drizzle-orm";
import { bigint, boolean, index, pgEnum, text } from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { BeneficiaryAccount } from "./beneficiary-auth.sql";
import { User } from "./dashboard-auth.sql";

export const uploadSensitivityLevelEnum = pgEnum("upload_sensitivity_level", [
  "public",
  "private",
]);

export const uploadStatusEnum = pgEnum("upload_status", [
  "pending", // A signed upload link has been created and the upload is pending to be uploaded.
  "uploaded", // The upload has been uploaded to the storage bucket and commited to the entity.
  "expired", // The upload link has expired with no successful upload, we should delete the s3 object if it exists.
  "deleted", // The upload has been deleted by the user or the system.
  "cancelled", // The upload has been cancelled by the user or the system.
]);

export const Upload = createTable(
  "upload",
  {
    id: ulid("upload").primaryKey(),
    status: uploadStatusEnum("status").notNull().default("pending"),
    storageKey: text().notNull().unique(),
    bucket: text().notNull(),
    originalFileName: text(),
    contentType: text(),
    fileSize: bigint({ mode: "number" }),
    base64Md5Hash: text().notNull(),
    objectUrl: text().notNull(),
    uploadedByBeneficiaryAccountId: ulid("beneficiaryAccount").references(
      () => BeneficiaryAccount.id,
      { onDelete: "set null" },
    ),
    uploadedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    public: boolean().notNull().default(false),
  },
  (table) => [
    index("upload_uploaded_by_beneficiary_account_id_index").on(
      table.uploadedByBeneficiaryAccountId,
    ),
    index("upload_uploaded_by_user_id_index").on(table.uploadedByUserId),
    index("upload_status_index").on(table.status),
  ],
);

/**
 * Relations
 */
export const uploadRelations = relations(Upload, ({ one }) => ({
  uploadedByBeneficiaryAccount: one(BeneficiaryAccount, {
    fields: [Upload.uploadedByBeneficiaryAccountId],
    references: [BeneficiaryAccount.id],
  }),
  uploadedByUser: one(User, {
    fields: [Upload.uploadedByUserId],
    references: [User.id],
  }),
}));
