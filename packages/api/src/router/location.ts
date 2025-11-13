import type { TRPCRouterRecord } from "@trpc/server";

import { and, asc, desc, eq, ilike, sql, trgm } from "@congress/db";
import { db } from "@congress/db/client";
import { City, Street } from "@congress/db/schema";
import {
  citySearchSchema,
  streetSearchSchema,
} from "@congress/validators/location";
import { normalizeHebrew } from "@congress/validators/utils";

import { publicProcedure } from "../trpc";

export const locationRouter = {
  cities: publicProcedure({ captcha: false })
    .input(citySearchSchema)
    .query(async ({ input }) => {
      const hasSearch = !!input.search?.trim();
      const isShortQuery = hasSearch && (input.search?.length ?? 0) <= 2;

      const data = await db.query.City.findMany({
        columns: {
          id: true,
          nameHe: true,
          code: true,
        },
        where: and(
          trgm(City.nameHeNormalized, normalizeHebrew(input.search ?? "")).if(
            hasSearch && !isShortQuery,
          ),
          ilike(
            City.nameHeNormalized,
            `${normalizeHebrew(input.search ?? "")}%`,
          ).if(isShortQuery),
        ),
        orderBy: [
          hasSearch && !isShortQuery
            ? desc(
                sql`similarity(${City.nameHeNormalized}, ${normalizeHebrew(input.search ?? "")})`,
              )
            : asc(City.nameHeNormalized),
        ],
        limit: 10,
      });

      return data;
    }),
  streets: publicProcedure({ captcha: false })
    .input(streetSearchSchema)
    .query(async ({ input }) => {
      const hasSearch = !!input.search?.trim();
      const isShortQuery = hasSearch && (input.search?.length ?? 0) <= 2;

      const data = await db.query.Street.findMany({
        columns: {
          id: true,
          nameHe: true,
        },
        where: and(
          eq(Street.cityCode, input.cityCode),
          trgm(Street.nameHeNormalized, normalizeHebrew(input.search ?? "")).if(
            hasSearch && !isShortQuery,
          ),
          ilike(
            Street.nameHeNormalized,
            `${normalizeHebrew(input.search ?? "")}%`,
          ).if(isShortQuery),
        ),
        orderBy: [
          hasSearch && !isShortQuery
            ? desc(
                sql`similarity(${Street.nameHeNormalized}, ${normalizeHebrew(input.search ?? "")})`,
              )
            : asc(Street.nameHeNormalized),
        ],
        limit: 10,
      });

      return data;
    }),
} satisfies TRPCRouterRecord;
