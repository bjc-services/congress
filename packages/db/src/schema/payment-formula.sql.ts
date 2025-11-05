import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { applicationTable } from "./application.sql";
import { userTable } from "./dashboard-auth.sql";
import { programVersionTable } from "./program.sql";

/**
 * program_payment_formula table - Base amount and field-based calculation
 * Stores the formula definition for calculating suggested payment amounts
 * Example formula_fields: [{"field": "numberOfPersons", "multiplier": 100}, {"field": "hasSpecialNeeds", "bonus": 500}]
 */
export const programPaymentFormulaTable = pgTable(
  "program_payment_formula",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => programVersionTable.id, { onDelete: "cascade" }),
    baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
    formulaFields: jsonb("formula_fields"), // Array of field calculations: [{field: "numberOfPersons", multiplier: 100}, ...]
    description: text("description"),
    createdByUserId: ulid("user")
      .notNull()
      .references(() => userTable.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("program_payment_formula_program_version_id_unique").on(
      table.programVersionId,
    ),
  ],
);

/**
 * application_calculation table - Audit trail for payment calculations
 * Stores a snapshot of the formula used, actual input values, and calculated result
 * This provides a complete audit trail showing how amounts were calculated
 */
export const applicationCalculationTable = pgTable(
  "application_calculation",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applicationTable.id, { onDelete: "cascade" }),
    formulaUsed: jsonb("formula_used").notNull(), // Snapshot of formula at calculation time
    inputValues: jsonb("input_values").notNull(), // Actual values used: {numberOfPersons: 5, maritalStatus: "married", ...}
    calculatedAmount: numeric("calculated_amount", {
      precision: 10,
      scale: 2,
    }).notNull(), // Result of formula calculation
    finalAmount: numeric("final_amount", { precision: 10, scale: 2 }).notNull(), // May be adjusted by staff
    adjustmentReason: text("adjustment_reason"), // Required if final differs from calculated
    calculatedByUserId: ulid("user")
      .notNull()
      .references(() => userTable.id, { onDelete: "set null" }),
    calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("application_calculation_application_id_index").on(
      table.applicationId,
    ),
    index("application_calculation_calculated_at_index").on(
      table.calculatedAt,
    ),
  ],
);

/**
 * Relations
 */
export const programPaymentFormulaRelations = relations(
  programPaymentFormulaTable,
  ({ one }) => ({
    programVersion: one(programVersionTable, {
      fields: [programPaymentFormulaTable.programVersionId],
      references: [programVersionTable.id],
    }),
    createdBy: one(userTable, {
      fields: [programPaymentFormulaTable.createdByUserId],
      references: [userTable.id],
    }),
  }),
);

export const applicationCalculationRelations = relations(
  applicationCalculationTable,
  ({ one }) => ({
    application: one(applicationTable, {
      fields: [applicationCalculationTable.applicationId],
      references: [applicationTable.id],
    }),
    calculatedBy: one(userTable, {
      fields: [applicationCalculationTable.calculatedByUserId],
      references: [userTable.id],
    }),
  }),
);

