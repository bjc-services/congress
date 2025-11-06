import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { User } from "./dashboard-auth.sql";
import { ProgramVersion } from "./program.sql";

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
export const EligibilityCriteria = createTable(
  "eligibility_criteria",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => ProgramVersion.id, { onDelete: "cascade" }),
    fieldName: text("field_name").notNull(),
    operator: eligibilityCriteriaOperatorEnum("operator").notNull(),
    value: jsonb("value").notNull(), // Can be single value or array for 'in'/'not_in'
    description: text("description"), // Human-readable explanation
    displayOrder: integer("display_order").notNull().default(0),
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
export const DocumentType = createTable(
  "document_type",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemDefined: boolean("is_system_defined").notNull().default(false),
    createdByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }),
    timeArchived: timestamp("time_archived"),
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
export const ProgramDocumentRequirement = createTable(
  "program_document_requirement",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => ProgramVersion.id, { onDelete: "cascade" }),
    documentTypeId: bigint("document_type_id", { mode: "number" })
      .notNull()
      .references(() => DocumentType.id, { onDelete: "restrict" }),
    isRequired: boolean("is_required").notNull().default(true),
    description: text("description"), // Specific instructions for this program
    displayOrder: integer("display_order").notNull().default(0),
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
  EligibilityCriteria,
  ({ one }) => ({
    programVersion: one(ProgramVersion, {
      fields: [EligibilityCriteria.programVersionId],
      references: [ProgramVersion.id],
    }),
  }),
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

export const programDocumentRequirementRelations = relations(
  ProgramDocumentRequirement,
  ({ one }) => ({
    programVersion: one(ProgramVersion, {
      fields: [ProgramDocumentRequirement.programVersionId],
      references: [ProgramVersion.id],
    }),
    documentType: one(DocumentType, {
      fields: [ProgramDocumentRequirement.documentTypeId],
      references: [DocumentType.id],
    }),
  }),
);
