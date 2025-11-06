import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  jsonb,
  numeric,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { Application } from "./application.sql";
import { User } from "./dashboard-auth.sql";
import { ProgramVersion } from "./program.sql";

/**
 * program_payment_formula table - Base amount and field-based calculation
 * Stores the formula definition for calculating suggested payment amounts
 * Example formula_fields: [{"field": "numberOfPersons", "multiplier": 100}, {"field": "hasSpecialNeeds", "bonus": 500}]
 */
export const ProgramPaymentFormula = createTable(
  "program_payment_formula",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programVersionId: bigint("program_version_id", { mode: "number" })
      .notNull()
      .references(() => ProgramVersion.id, { onDelete: "cascade" }),
    baseAmount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
    formulaFields: jsonb("formula_fields"), // Array of field calculations: [{field: "numberOfPersons", multiplier: 100}, ...]
    description: text("description"),
    createdByUserId: ulid("user")
      .notNull()
      .references(() => User.id, { onDelete: "set null" }),
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
export const ApplicationCalculation = createTable(
  "application_calculation",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => Application.id, { onDelete: "cascade" }),
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
      .references(() => User.id, { onDelete: "set null" }),
    timeCalculated: timestamp("time_calculated").notNull().defaultNow(),
  },
  (table) => [
    index("application_calculation_application_id_index").on(
      table.applicationId,
    ),
    index("application_calculation_time_calculated_index").on(
      table.timeCalculated,
    ),
  ],
);

/**
 * Relations
 */
export const programPaymentFormulaRelations = relations(
  ProgramPaymentFormula,
  ({ one }) => ({
    programVersion: one(ProgramVersion, {
      fields: [ProgramPaymentFormula.programVersionId],
      references: [ProgramVersion.id],
    }),
    createdBy: one(User, {
      fields: [ProgramPaymentFormula.createdByUserId],
      references: [User.id],
    }),
  }),
);

export const applicationCalculationRelations = relations(
  ApplicationCalculation,
  ({ one }) => ({
    application: one(Application, {
      fields: [ApplicationCalculation.applicationId],
      references: [Application.id],
    }),
    calculatedBy: one(User, {
      fields: [ApplicationCalculation.calculatedByUserId],
      references: [User.id],
    }),
  }),
);
