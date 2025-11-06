import { eq, isNull, relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  pgEnum,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { Person, PersonAddress } from "./person.sql";

/**
 * Household member role enum
 * Defines the role of a person within a household
 */
export const householdMemberRoleEnum = pgEnum("household_member_role", [
  "head",
  "spouse",
  "child",
  "dependent",
  "parent",
  "guardian",
  "other",
]);

/**
 * household table - Household entity
 * Represents a group of people living together
 * Separate from family relationships - this is about who lives together
 */
export const Household = createTable("household", {
  id: bigserial({ mode: "number" }).primaryKey(),
  primaryAddressId: ulid("personAddress").references(() => PersonAddress.id, {
    onDelete: "set null",
  }),
  name: text("name"), // Optional name like "Cohen Household"
});

/**
 * household_member table - Who lives in each household
 * Tracks household membership over time with start/end dates
 * One primary member per household (typically head of household)
 */
export const HouseholdMember = createTable(
  "household_member",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    householdId: bigint("household_id", { mode: "number" })
      .notNull()
      .references(() => Household.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => Person.id, { onDelete: "restrict" }),
    role: householdMemberRoleEnum("role").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }),
  },
  (table) => [
    index("household_member_household_id_index").on(table.householdId),
    index("household_member_person_id_index").on(table.personId),
    // Only one active membership per person per household
    uniqueIndex("household_member_household_id_person_id_unique")
      .on(table.householdId, table.personId)
      .where(isNull(table.endDate)),
    // Only one primary member per household at a time
    uniqueIndex("household_member_household_id_is_primary_unique")
      .on(table.householdId)
      .where(sql`${eq(table.isPrimary, true)} AND ${isNull(table.endDate)}`),
  ],
);

/**
 * Relations
 */
export const householdRelations = relations(Household, ({ one, many }) => ({
  primaryAddress: one(PersonAddress, {
    fields: [Household.primaryAddressId],
    references: [PersonAddress.id],
  }),
  members: many(HouseholdMember),
}));

export const householdMemberRelations = relations(
  HouseholdMember,
  ({ one }) => ({
    household: one(Household, {
      fields: [HouseholdMember.householdId],
      references: [Household.id],
    }),
    person: one(Person, {
      fields: [HouseholdMember.personId],
      references: [Person.id],
    }),
  }),
);
