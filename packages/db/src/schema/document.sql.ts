import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  text,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { User } from "./dashboard-auth.sql";
import { Person } from "./person.sql";
import { ProgramDocumentRequirement } from "./program-requirements.sql";
import { Upload } from "./upload.sql";

/**
 * document_type table - Predefined and custom document types
 * System-defined types are created during migration
 * Staff can create custom types as needed
 */
export const DocumentType = createTable(
  "document_type",
  {
    id: ulid("documentType").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemDefined: boolean("is_system_defined").notNull().default(false), // cannot be deleted if true
    createdByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    maxAllowedFiles: integer("max_allowed_files").notNull().default(1),
    allowedFileTypes: text("allowed_file_types").array().notNull(),
    maxFileSize: bigint({ mode: "number" }).notNull().default(5242880), // 10MB
  },
  (table) => [index("document_type_name_index").on(table.name)],
);

export const documentTypeRelations = relations(
  DocumentType,
  ({ one, many }) => ({
    createdBy: one(User, {
      fields: [DocumentType.createdByUserId],
      references: [User.id],
    }),
    programRequirements: many(ProgramDocumentRequirement),
  }),
);

export const PersonDocument = createTable(
  "person_document",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    personId: bigint({ mode: "number" })
      .references(() => Person.id, {
        onDelete: "cascade",
      })
      .notNull(),
    documentTypeId: ulid("documentType")
      .notNull()
      .references(() => DocumentType.id, {
        onDelete: "cascade",
      }),
    uploadId: ulid("upload")
      .notNull()
      .references(() => Upload.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    index("person_document_person_id_index").on(table.personId),
    index("person_document_document_type_id_index").on(table.documentTypeId),
    index("person_document_upload_id_index").on(table.uploadId),
  ],
);

export const personDocumentRelations = relations(PersonDocument, ({ one }) => ({
  person: one(Person, {
    fields: [PersonDocument.personId],
    references: [Person.id],
  }),
  documentType: one(DocumentType, {
    fields: [PersonDocument.documentTypeId],
    references: [DocumentType.id],
  }),
  upload: one(Upload, {
    fields: [PersonDocument.uploadId],
    references: [Upload.id],
  }),
}));
