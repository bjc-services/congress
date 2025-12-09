/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the oRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { ORPCError, os } from "@orpc/server";
import { getCookie } from "@tanstack/react-start/server";
import { z, ZodError } from "zod/v4";

import type { DashboardAuth, DashboardSession } from "@congress/auth";
import * as beneficiaryAuth from "@congress/auth/beneficiary";
import { eq } from "@congress/db";
import { db } from "@congress/db/client";
import { BeneficiaryAccount } from "@congress/db/schema";

const getSession = async (
  authApi: DashboardAuth,
  headers: Headers,
): Promise<DashboardSession | null> => {
  const session = await authApi.api.getSession({
    headers: headers,
  });
  return session;
};

const getBeneficiarySession = async () => {
  const token = getCookie("congress_bat");

  if (!token) return null;

  const session = await beneficiaryAuth.getSession(token);

  return session;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for an oRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://orpc.dev/docs/context
 */

export const createORPCContext = async (opts: {
  auth: DashboardAuth;
  headers: Headers;
}) => {
  const session = await getSession(opts.auth, opts.headers);
  const beneficiarySession = await getBeneficiarySession();
  return {
    session,
    beneficiarySession,
    headers: opts.headers,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the orpc api is initialized, connecting the context
 */
const o = os.$context<Awaited<ReturnType<typeof createORPCContext>>>();

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your oRPC API. You should import these
 * a lot in the /src/router folder
 */

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * oRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = ({ captcha: _ }: { captcha?: boolean }) => o;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `context.session.user` is not null.
 *
 * @see https://orpc.dev/docs/procedure
 */
export const protectedProcedure = o.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      // infers the `session` as non-nullable
      session: { ...context.session, user: context.session.user },
      beneficiarySession: context.beneficiarySession,
      headers: context.headers,
    },
  });
});

/**
 * Protected procedure for beneficiary users
 *
 * Verifies JWT token from cookie and ensures account is approved
 */
export const beneficiaryProtectedProcedure = o.use(
  async ({ context, next }) => {
    if (!context.beneficiarySession) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid or expired token",
      });
    }

    const [account] = await db
      .select()
      .from(BeneficiaryAccount)
      .where(eq(BeneficiaryAccount.id, context.beneficiarySession.accountId))
      .limit(1);

    if (!account?.status || account.status !== "approved") {
      throw new ORPCError("FORBIDDEN", {
        message: "Account not approved or not found",
      });
    }

    return next({
      context: {
        ...context,
        beneficiaryAccount: account,
        beneficiarySession: context.beneficiarySession,
      },
    });
  },
);
