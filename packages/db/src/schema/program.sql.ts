import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { User } from "./dashboard-auth.sql";

/**
 * Enrollment type enum
 * - self_enrolled: Beneficiaries can enroll themselves via the portal
 * - committee_enrolled: Only staff/committee can enroll beneficiaries
 */
export const enrollmentTypeEnum = pgEnum("enrollment_type", [
  "self_enrolled",
  "committee_enrolled",
]);

/**
 * program table - Base program template
 * Examples: "Avrechim Grant", "Community Need Assistance"
 */
export const Program = createTable(
  "program",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    enrollmentType: enrollmentTypeEnum("enrollment_type").notNull(),
    requiresHouseholdInfo: boolean("requires_household_info")
      .notNull()
      .default(false),
    isVisibleInPortal: boolean("is_visible_in_portal").notNull().default(true),
    createdByUserId: ulid("user")
      .notNull()
      .references(() => User.id, { onDelete: "set null" }),
    timeArchived: timestamp("time_archived"),
  },
  (table) => [index("program_name_index").on(table.name)],
);

/**
 * program_version table - Time-bound instances of programs
 * Examples: "Pesach 2026", "Chanukah 2025"
 * Each version has a specific enrollment period with start and end dates
 */
export const ProgramVersion = createTable(
  "program_version",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    programId: bigint("program_id", { mode: "number" })
      .notNull()
      .references(() => Program.id, { onDelete: "cascade" }),
    versionName: text("version_name").notNull(),
    description: text("description"),
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: ulid("user")
      .notNull()
      .references(() => User.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("program_version_program_id_version_name_unique").on(
      table.programId,
      table.versionName,
    ),
    index("program_version_program_id_index").on(table.programId),
    index("program_version_start_date_index").on(table.startDate),
    index("program_version_end_date_index").on(table.endDate),
    index("program_version_is_active_index").on(table.isActive),
  ],
);

/**
 * Relations
 */
export const programRelations = relations(Program, ({ one, many }) => ({
  createdBy: one(User, {
    fields: [Program.createdByUserId],
    references: [User.id],
  }),
  versions: many(ProgramVersion),
}));

export const programVersionRelations = relations(ProgramVersion, ({ one }) => ({
  program: one(Program, {
    fields: [ProgramVersion.programId],
    references: [Program.id],
  }),
  createdBy: one(User, {
    fields: [ProgramVersion.createdByUserId],
    references: [User.id],
  }),
}));
