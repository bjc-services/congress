import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT } from "jose";

import { and, createID, eq, gt, isNull } from "@acme/db";
import { db } from "@acme/db/client";
import {
  beneficiaryAccountTable,
  beneficiaryPasswordResetTable,
  beneficiarySessionTable,
} from "@acme/db/schema";

import { authEnv } from "../env";

/**
 * Password hashing configuration
 */
const SALT_ROUNDS = 10;

const JWT_SECRET = authEnv().AUTH_SECRET;
/**
 * JWT configuration
 */
if (!JWT_SECRET) {
  throw new Error("AUTH_SECRET must be set");
}

const JWT_EXPIRES_IN = 60 * 60 * 24 * 30; // 30 days in seconds
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30; // 30 days in milliseconds

/**
 * Password utilities
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await compare(password, hash);
}

/**
 * JWT token utilities
 */
export async function createSessionToken(accountId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ accountId, type: "beneficiary" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN)
    .sign(secret);

  return token;
}

export async function verifySessionToken(token: string): Promise<{
  accountId: string;
} | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (
      payload.type !== "beneficiary" ||
      typeof payload.accountId !== "string"
    ) {
      return null;
    }

    return { accountId: payload.accountId };
  } catch {
    return null;
  }
}

/**
 * Session management
 */
export async function createSession(
  accountId: string,
  token: string,
  options?: { ipAddress?: string; userAgent?: string },
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

  await db.insert(beneficiarySessionTable).values({
    id: createID("beneficiarySession"),
    accountId,
    token,
    expiresAt,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

export async function getSession(token: string): Promise<{
  id: string;
  accountId: string;
  expiresAt: Date;
} | null> {
  const session = await db.query.beneficiarySessionTable.findFirst({
    where: and(
      eq(beneficiarySessionTable.token, token),
      gt(beneficiarySessionTable.expiresAt, new Date()),
    ),
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    accountId: session.accountId,
    expiresAt: session.expiresAt,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await db
    .delete(beneficiarySessionTable)
    .where(eq(beneficiarySessionTable.token, token));
}

export async function deleteAllSessions(accountId: string): Promise<void> {
  await db
    .delete(beneficiarySessionTable)
    .where(eq(beneficiarySessionTable.accountId, accountId));
}

/**
 * Password reset token utilities
 */
export async function createPasswordResetToken(
  accountId: string,
  options?: { ipAddress?: string },
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  await db.insert(beneficiaryPasswordResetTable).values({
    accountId,
    token,
    expiresAt,
    ipAddress: options?.ipAddress,
  });

  return token;
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const reset = await db.query.beneficiaryPasswordResetTable.findFirst({
    where: and(
      eq(beneficiaryPasswordResetTable.token, token),
      gt(beneficiaryPasswordResetTable.expiresAt, new Date()),
      isNull(beneficiaryPasswordResetTable.usedAt),
    ),
  });

  if (!reset) {
    return null;
  }

  return reset.accountId;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await db
    .update(beneficiaryPasswordResetTable)
    .set({ usedAt: new Date() })
    .where(eq(beneficiaryPasswordResetTable.token, token));
}

/**
 * Account locking utilities (for brute force protection)
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 1000 * 60 * 30; // 30 minutes

export async function incrementFailedLoginAttempts(
  accountId: string,
): Promise<void> {
  const account = await db.query.beneficiaryAccountTable.findFirst({
    where: eq(beneficiaryAccountTable.id, accountId),
  });

  if (!account) {
    return;
  }

  const failedAttempts = account.failedLoginAttempts + 1;
  const updates: {
    failedLoginAttempts: number;
    lockedUntil?: Date;
  } = {
    failedLoginAttempts: failedAttempts,
  };

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    updates.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await db
    .update(beneficiaryAccountTable)
    .set(updates)
    .where(eq(beneficiaryAccountTable.id, accountId));
}

export async function resetFailedLoginAttempts(
  accountId: string,
): Promise<void> {
  await db
    .update(beneficiaryAccountTable)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(beneficiaryAccountTable.id, accountId));
}

export async function isAccountLocked(accountId: string): Promise<boolean> {
  const account = await db.query.beneficiaryAccountTable.findFirst({
    where: eq(beneficiaryAccountTable.id, accountId),
  });

  if (!account) {
    return true;
  }

  if (account.lockedUntil && account.lockedUntil > new Date()) {
    return true;
  }

  return false;
}
