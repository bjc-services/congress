import { eq, isNull, ne, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  char,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  personContactTypes,
  personRelationshipTypes,
} from "@acme/validators/person";

import { timestamp, timestamps, ulid } from "../types";

export const personTable = pgTable(
  "person",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    national_id: text().notNull().unique(),
    firstName: text(),
    lastName: text(),
    gender: char({ length: 1 }),
    dateOfBirth: date({ mode: "date" }),
    ...timestamps,
  },
  (table) => [check("gender_check", sql`${table.gender} IN ('M', 'F')`)],
);

const contactTypeEnum = pgEnum("contact_type", personContactTypes);

export const personContactTable = pgTable(
  "person_contact",
  {
    id: ulid("personContact").primaryKey(),
    personId: bigint({ mode: "number" }).notNull(),
    value: text().notNull(),
    contactType: contactTypeEnum(),
    isPrimary: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index().on(table.personId),
    uniqueIndex().on(table.personId, table.value),
    uniqueIndex()
      .on(table.personId, table.contactType)
      .where(eq(table.contactType, true).inlineParams()),
  ],
);

export const personAddressTable = pgTable(
  "person_address",
  {
    id: ulid("personAddress").primaryKey(),
    personId: bigint({ mode: "number" }).notNull(),
    addressLine1: text().notNull(),
    addressLine2: text(),
    city: text(),
    postalCode: text(),
    country: char({ length: 2 }),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    ...timestamps,
  },
  (table) => [
    index().on(table.personId),
    check(
      "end_date_check",
      sql`${table.endDate} IS NULL OR ${table.endDate} > ${table.startDate}`,
    ),
    uniqueIndex().on(table.personId).where(isNull(table.endDate)),
  ],
);

const relationshipTypeEnum = pgEnum(
  "relationship_type",
  personRelationshipTypes,
);

/**
 * Always create a relationship in one direction:
 * - Parent -> Child
 * - Guardian -> Child
 * - Spouse <-> Spouse (Husband <-> Wife)
 *
 * Siblings are implicitly created when a parent creates a relationship with multiple children.
 */
export const personRelationshipTable = pgTable(
  "person_relationship",
  {
    id: ulid("personRelationship").primaryKey(),
    personId: bigint({ mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "cascade" }),
    relatedPersonId: bigint({ mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "cascade" }),
    relationshipType: relationshipTypeEnum(),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    endReason: text(),
    details: text(),
    ...timestamps,
  },
  (table) => [
    index().on(table.personId),
    index().on(table.relatedPersonId),
    uniqueIndex()
      .on(
        sql`(LEAST(${table.personId}, ${table.relatedPersonId}), GREATEST(${table.personId}, ${table.relatedPersonId}))`,
      )
      .where(
        sql`${eq(table.relationshipType, "spouse").inlineParams()} AND ${isNull(table.endDate)}`,
      ),
    check(
      "person_is_different_from_related_person",
      ne(table.personId, table.relatedPersonId),
    ),
  ],
);
