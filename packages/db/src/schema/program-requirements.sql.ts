import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { userTable } from "./dashboard-auth.sql";
import { programVersionTable } from "./program.sql";

/**
 * Operator enum for eligibility criteria
 * Used to compare field values against criteria values
 */
export const eligibilityCriteriaOperatorEnum = pgEnum(
  "eligibility_criteria_operator",
  [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_or_equal",
    "less_or_equal",
    "in",
    "not_in",
  ],
);

/**
 * eligibility_criteria table - Field-based rules for program eligibility
 * Stores simple field-based rules like "maritalStatus = married" or "numberOfPersons >= 5"
 */
export const eligibilityCriteriaTable = pgTable(
  "eligibility_criteria",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => programVersionTable.id, { onDelete: "cascade" }),
    fieldName: text("field_name").notNull(),
    operator: eligibilityCriteriaOperatorEnum("operator").notNull(),
    value: jsonb("value").notNull(), // Can be single value or array for 'in'/'not_in'
    description: text("description"), // Human-readable explanation
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("eligibility_criteria_program_version_id_index").on(
      table.programVersionId,
    ),
    index("eligibility_criteria_display_order_index").on(table.displayOrder),
  ],
);

/**
 * document_type table - Predefined and custom document types
 * System-defined types are created during migration
 * Staff can create custom types as needed
 */
export const documentTypeTable = pgTable(
  "document_type",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemDefined: boolean("is_system_defined").notNull().default(false),
    createdByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (table) => [
    index("document_type_name_index").on(table.name),
    index("document_type_is_system_defined_index").on(table.isSystemDefined),
  ],
);

/**
 * program_document_requirement table - What documents each program version needs
 * Links document types to program versions with requirement details
 */
export const programDocumentRequirementTable = pgTable(
  "program_document_requirement",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => programVersionTable.id, { onDelete: "cascade" }),
    documentTypeId: bigint("document_type_id", { mode: "number" })
      .notNull()
      .references(() => documentTypeTable.id, { onDelete: "restrict" }),
    isRequired: boolean("is_required").notNull().default(true),
    description: text("description"), // Specific instructions for this program
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex(
      "program_document_requirement_program_version_id_document_type_id_unique",
    ).on(table.programVersionId, table.documentTypeId),
    index("program_document_requirement_program_version_id_index").on(
      table.programVersionId,
    ),
    index("program_document_requirement_document_type_id_index").on(
      table.documentTypeId,
    ),
  ],
);

/**
 * Relations
 */
export const eligibilityCriteriaRelations = relations(
  eligibilityCriteriaTable,
  ({ one }) => ({
    programVersion: one(programVersionTable, {
      fields: [eligibilityCriteriaTable.programVersionId],
      references: [programVersionTable.id],
    }),
  }),
);

export const documentTypeRelations = relations(
  documentTypeTable,
  ({ one, many }) => ({
    createdBy: one(userTable, {
      fields: [documentTypeTable.createdByUserId],
      references: [userTable.id],
    }),
    programRequirements: many(programDocumentRequirementTable),
  }),
);

export const programDocumentRequirementRelations = relations(
  programDocumentRequirementTable,
  ({ one }) => ({
    programVersion: one(programVersionTable, {
      fields: [programDocumentRequirementTable.programVersionId],
      references: [programVersionTable.id],
    }),
    documentType: one(documentTypeTable, {
      fields: [programDocumentRequirementTable.documentTypeId],
      references: [documentTypeTable.id],
    }),
  }),
);

