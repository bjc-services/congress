/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { DashboardAuth, DashboardSession } from "@acme/auth";
import * as beneficiaryAuth from "@acme/auth/beneficiary";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { BeneficiaryAccount } from "@acme/db/schema";

const getSession = async (
  authApi: DashboardAuth,
  headers: Headers,
): Promise<DashboardSession | null> => {
  const session = await authApi.api.getSession({
    headers: headers,
  });
  return session;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: DashboardAuth;
}) => {
  const session = await getSession(opts.auth, opts.headers);
  return {
    session,
    db,
    headers: opts.headers,
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = ({ captcha: _ }: { captcha?: boolean }) =>
  t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected procedure for beneficiary users
 *
 * Verifies JWT token from Authorization header and ensures account is approved
 */
export const beneficiaryProtectedProcedure = t.procedure.use(
  async ({ ctx, next }) => {
    const token = ctx.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No token provided",
      });
    }

    const session = await beneficiaryAuth.getSession(token);

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    const [account] = await db
      .select()
      .from(BeneficiaryAccount)
      .where(eq(BeneficiaryAccount.id, session.accountId))
      .limit(1);

    if (!account?.status || account.status !== "approved") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account not approved or not found",
      });
    }

    return next({
      ctx: {
        ...ctx,
        beneficiaryAccount: account,
        beneficiarySession: session,
      },
    });
  },
);
