import { bigserial, pgEnum, text, varchar } from "drizzle-orm/pg-core";

import { createTable } from "../create-table";
import { ulid } from "../types";
import { Person } from "./person.sql";
import { Upload } from "./upload.sql";

export const yeshivaWorkTypeEnum = pgEnum("yeshiva_work_type", [
  "all_day",
  "half_day",
]);

export const yeshivaTypeEnum = pgEnum("yeshiva_type", ["kollel", "yeshiva"]);

export const YeshivaDetails = createTable("yeshiva_details", {
  id: bigserial({ mode: "number" }).primaryKey(),
  beneficiaryNationalId: varchar("beneficiary_national_id", { length: 10 })
    .notNull()
    .unique()
    .references(() => Person.nationalId, { onDelete: "restrict" }),
  yeshivaName: text("yeshiva_name"),
  headOfTheYeshivaName: text("head_of_the_yeshiva_name"),
  headOfTheYeshivaPhone: text("head_of_the_yeshiva_phone"),
  yeshivaWorkType: yeshivaWorkTypeEnum("yeshiva_work_type").default("all_day"),
  yeshivaCertificateUploadId: ulid("upload").references(() => Upload.id, {
    onDelete: "set null",
  }),
  yeshivaType: yeshivaTypeEnum("yeshiva_type").default("kollel"),
});
