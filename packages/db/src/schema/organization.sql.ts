import { isNull, relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { User } from "./dashboard-auth.sql";
import { Person } from "./person.sql";

/**
 * organization_type table - Flexible community types
 * System-defined types created during migration, staff can create custom types
 */
export const OrganizationType = createTable(
  "organization_type",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemDefined: boolean("is_system_defined").notNull().default(false),
    timeArchived: timestamp("time_archived"),
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
export const Organization = createTable(
  "organization",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    organizationTypeId: bigint("organization_type_id", { mode: "number" })
      .notNull()
      .references(() => OrganizationType.id, { onDelete: "restrict" }),
    organizationNumber: text("organization_number"), // Government registration number
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postalCode: text("postal_code"),
    phone: text("phone"),
    email: text("email"),
    timeArchived: timestamp("time_archived"),
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
export const Coordinator = createTable(
  "coordinator",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => Person.id, { onDelete: "restrict" }),
    userId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }), // Dashboard user if they have access
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }),
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
export const CommitteeMember = createTable(
  "committee_member",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    coordinatorId: bigint("coordinator_id", { mode: "number" })
      .notNull()
      .references(() => Coordinator.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => Person.id, { onDelete: "restrict" }),
    position: text("position"), // e.g., "Chair", "Member 1", "Member 2"
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }),
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
  OrganizationType,
  ({ many }) => ({
    organizations: many(Organization),
  }),
);

export const organizationRelations = relations(
  Organization,
  ({ one, many }) => ({
    organizationType: one(OrganizationType, {
      fields: [Organization.organizationTypeId],
      references: [OrganizationType.id],
    }),
    coordinators: many(Coordinator),
  }),
);

export const coordinatorRelations = relations(Coordinator, ({ one, many }) => ({
  organization: one(Organization, {
    fields: [Coordinator.organizationId],
    references: [Organization.id],
  }),
  person: one(Person, {
    fields: [Coordinator.personId],
    references: [Person.id],
  }),
  user: one(User, {
    fields: [Coordinator.userId],
    references: [User.id],
  }),
  committeeMembers: many(CommitteeMember),
}));

export const committeeMemberRelations = relations(
  CommitteeMember,
  ({ one }) => ({
    coordinator: one(Coordinator, {
      fields: [CommitteeMember.coordinatorId],
      references: [Coordinator.id],
    }),
    person: one(Person, {
      fields: [CommitteeMember.personId],
      references: [Person.id],
    }),
  }),
);
