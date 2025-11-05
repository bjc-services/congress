import { relations } from "drizzle-orm";
import { bigint, boolean, index, pgEnum, pgTable, text } from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { beneficiaryAccountTable } from "./beneficiary-auth.sql";
import { userTable } from "./dashboard-auth.sql";

export const uploadSensitivityLevelEnum = pgEnum("upload_sensitivity_level", [
  "public",
  "private",
]);

export const uploadStatusEnum = pgEnum("upload_status", [
  "pending", // A signed upload link has been created and the upload is pending to be uploaded.
  "uploaded", // The upload has been uploaded to the storage bucket and commited to the entity.
  "expired", // The upload link has expired with no successful upload, we should delete the s3 object if it exists.
  "deleted", // The upload has been deleted by the user or the system.
]);

export const uploadTable = pgTable(
  "upload",
  {
    id: ulid("upload").primaryKey(),
    status: uploadStatusEnum("status").notNull().default("pending"),
    storageKey: text().notNull().unique(),
    bucket: text().notNull(),
    originalFileName: text(),
    contentType: text(),
    fileSize: bigint({ mode: "number" }),
    checksum: text().notNull(),
    objectUrl: text().notNull(),
    uploadedByBeneficiaryAccountId: ulid("beneficiaryAccount").references(
      () => beneficiaryAccountTable.id,
      { onDelete: "set null" },
    ),
    uploadedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    public: boolean().notNull().default(false),
    ...timestamps,
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
export const uploadRelations = relations(uploadTable, ({ one }) => ({
  uploadedByBeneficiaryAccount: one(beneficiaryAccountTable, {
    fields: [uploadTable.uploadedByBeneficiaryAccountId],
    references: [beneficiaryAccountTable.id],
  }),
  uploadedByUser: one(userTable, {
    fields: [uploadTable.uploadedByUserId],
    references: [userTable.id],
  }),
}));
