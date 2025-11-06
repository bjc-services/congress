import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  numeric,
  pgEnum,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { Application } from "./application.sql";
import { User } from "./dashboard-auth.sql";

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
export const ApplicationRecommendation = createTable(
  "application_recommendation",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => Application.id, { onDelete: "cascade" }),
    recommendedByUserId: ulid("user")
      .notNull()
      .references(() => User.id, { onDelete: "restrict" }), // Coordinator or committee member
    recommendedAmount: numeric("recommended_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    recommendationDate: timestamp("recommendation_date").notNull().defaultNow(),
    notes: text("notes"), // Justification for the recommendation
    status: recommendationStatusEnum("status").notNull().default("pending"),
    reviewedByUserId: ulid("user").references(() => User.id, {
      onDelete: "set null",
    }), // Staff member who reviewed
    timeReviewed: timestamp("time_reviewed"),
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
  ApplicationRecommendation,
  ({ one }) => ({
    application: one(Application, {
      fields: [ApplicationRecommendation.applicationId],
      references: [Application.id],
    }),
    recommendedBy: one(User, {
      fields: [ApplicationRecommendation.recommendedByUserId],
      references: [User.id],
      relationName: "recommendation_recommended_by",
    }),
    reviewedBy: one(User, {
      fields: [ApplicationRecommendation.reviewedByUserId],
      references: [User.id],
      relationName: "recommendation_reviewed_by",
    }),
  }),
);
