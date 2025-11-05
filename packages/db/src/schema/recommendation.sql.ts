import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { timestamps, ulid } from "../types";
import { applicationTable } from "./application.sql";
import { userTable } from "./dashboard-auth.sql";

/**
 * Recommendation status enum - Lifecycle of recommendations
 */
export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending",
  "accepted",
  "rejected",
  "modified",
]);

/**
 * application_recommendation table - Committee/coordinator recommendations
 * When committee members or coordinators recommend an amount for an application
 * Staff reviews and can accept, reject, or modify the recommendation
 */
export const applicationRecommendationTable = pgTable(
  "application_recommendation",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applicationTable.id, { onDelete: "cascade" }),
    recommendedByUserId: ulid("user")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }), // Coordinator or committee member
    recommendedAmount: numeric("recommended_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    recommendationDate: timestamp("recommendation_date")
      .notNull()
      .defaultNow(),
    notes: text("notes"), // Justification for the recommendation
    status: recommendationStatusEnum("status").notNull().default("pending"),
    reviewedByUserId: ulid("user").references(() => userTable.id, {
      onDelete: "set null",
    }), // Staff member who reviewed
    reviewedAt: timestamp("reviewed_at"),
    ...timestamps,
  },
  (table) => [
    index("application_recommendation_application_id_index").on(
      table.applicationId,
    ),
    index("application_recommendation_recommended_by_user_id_index").on(
      table.recommendedByUserId,
    ),
    index("application_recommendation_status_index").on(table.status),
    index("application_recommendation_recommendation_date_index").on(
      table.recommendationDate,
    ),
  ],
);

/**
 * Relations
 */
export const applicationRecommendationRelations = relations(
  applicationRecommendationTable,
  ({ one }) => ({
    application: one(applicationTable, {
      fields: [applicationRecommendationTable.applicationId],
      references: [applicationTable.id],
    }),
    recommendedBy: one(userTable, {
      fields: [applicationRecommendationTable.recommendedByUserId],
      references: [userTable.id],
      relationName: "recommendation_recommended_by",
    }),
    reviewedBy: one(userTable, {
      fields: [applicationRecommendationTable.reviewedByUserId],
      references: [userTable.id],
      relationName: "recommendation_reviewed_by",
    }),
  }),
);

