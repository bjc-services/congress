import { eq, isNull, sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { userTable } from "./dashboard-auth.sql";
import { personTable } from "./person.sql";

/**
 * organization_type table - Flexible community types
 * System-defined types created during migration, staff can create custom types
 */
export const organizationTypeTable = pgTable(
  "organization_type",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemDefined: boolean("is_system_defined").notNull().default(false),
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (table) => [
    index("organization_type_name_index").on(table.name),
    index("organization_type_is_system_defined_index").on(
      table.isSystemDefined,
    ),
  ],
);

/**
 * organization table - Communities/organizations
 * Represents synagogues, chabad houses, kollels, local communities, etc.
 */
export const organizationTable = pgTable(
  "organization",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    organizationTypeId: bigint("organization_type_id", { mode: "number" })
      .notNull()
      .references(() => organizationTypeTable.id, { onDelete: "restrict" }),
    organizationNumber: text("organization_number"), // Government registration number
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postalCode: text("postal_code"),
    phone: text("phone"),
    email: text("email"),
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (table) => [
    index("organization_name_index").on(table.name),
    index("organization_organization_type_id_index").on(
      table.organizationTypeId,
    ),
    index("organization_city_index").on(table.city),
  ],
);

/**
 * coordinator table - Organization coordinators
 * Links people to organizations they coordinate, can optionally have dashboard access
 */
export const coordinatorTable = pgTable(
  "coordinator",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "restrict" }),
    userId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }), // Dashboard user if they have access
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("coordinator_organization_id_index").on(table.organizationId),
    index("coordinator_person_id_index").on(table.personId),
    index("coordinator_user_id_index").on(table.userId),
    uniqueIndex("coordinator_organization_id_person_id_unique")
      .on(table.organizationId, table.personId)
      .where(isNull(table.endDate)),
  ],
);

/**
 * committee_member table - Committee members per coordinator
 * Each coordinator can have committee members (typically 3)
 */
export const committeeMemberTable = pgTable(
  "committee_member",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    coordinatorId: bigint("coordinator_id", { mode: "number" })
      .notNull()
      .references(() => coordinatorTable.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => personTable.id, { onDelete: "restrict" }),
    position: text("position"), // e.g., "Chair", "Member 1", "Member 2"
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("committee_member_coordinator_id_index").on(table.coordinatorId),
    index("committee_member_person_id_index").on(table.personId),
  ],
);

/**
 * Relations
 */
export const organizationTypeRelations = relations(
  organizationTypeTable,
  ({ many }) => ({
    organizations: many(organizationTable),
  }),
);

export const organizationRelations = relations(
  organizationTable,
  ({ one, many }) => ({
    organizationType: one(organizationTypeTable, {
      fields: [organizationTable.organizationTypeId],
      references: [organizationTypeTable.id],
    }),
    coordinators: many(coordinatorTable),
  }),
);

export const coordinatorRelations = relations(
  coordinatorTable,
  ({ one, many }) => ({
    organization: one(organizationTable, {
      fields: [coordinatorTable.organizationId],
      references: [organizationTable.id],
    }),
    person: one(personTable, {
      fields: [coordinatorTable.personId],
      references: [personTable.id],
    }),
    user: one(userTable, {
      fields: [coordinatorTable.userId],
      references: [userTable.id],
    }),
    committeeMembers: many(committeeMemberTable),
  }),
);

export const committeeMemberRelations = relations(
  committeeMemberTable,
  ({ one }) => ({
    coordinator: one(coordinatorTable, {
      fields: [committeeMemberTable.coordinatorId],
      references: [coordinatorTable.id],
    }),
    person: one(personTable, {
      fields: [committeeMemberTable.personId],
      references: [personTable.id],
    }),
  }),
);

