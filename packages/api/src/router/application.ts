import z from "zod";

import { and, columnSelector, desc, eq } from "@congress/db";
import { db } from "@congress/db/client";
import * as schema from "@congress/db/schema";

import { beneficiaryProtectedProcedure } from "../orpc";

export const applicationRouter = {
  list: beneficiaryProtectedProcedure({ allowUnapproved: true })
    .input(
      z.object({
        activeOnly: z.boolean().optional().default(true),
      }),
    )
    .handler(async ({ context, input }) => {
      const applications = await db
        .select({
          application: columnSelector(schema.Application).pick(
            "id",
            "status",
            "timeSubmitted",
            "timeReviewed",
            "timeApproved",
            "rejectionReason",
            "timeUpdated",
          ).columns,
          program: {
            ...columnSelector(schema.Program).pick("id", "name", "description")
              .columns,
            versionName: schema.ProgramVersion.versionName,
            startDate: schema.ProgramVersion.startDate,
            endDate: schema.ProgramVersion.endDate,
            isActive: schema.ProgramVersion.isActive,
          },
        })
        .from(schema.Application)
        .innerJoin(
          schema.ProgramVersion,
          eq(schema.Application.programVersionId, schema.ProgramVersion.id),
        )
        .innerJoin(
          schema.Program,
          eq(schema.ProgramVersion.programId, schema.Program.id),
        )
        .where(
          and(
            eq(
              schema.Application.beneficiaryAccountId,
              context.beneficiaryAccount.id,
            ),
            eq(schema.ProgramVersion.isActive, true).if(input.activeOnly),
          ),
        )
        .orderBy(desc(schema.Application.timeUpdated));

      return applications;
    }),
};
