import type { TRPCRouterRecord } from "@trpc/server";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import {
  createOTP,
  createPasswordResetToken,
  createSession,
  createSessionToken,
  deleteSession,
  getSession,
  hashPassword,
  incrementFailedLoginAttempts,
  isAccountLocked,
  markPasswordResetTokenUsed,
  resetFailedLoginAttempts,
  verifyOTP,
  verifyPassword,
  verifyPasswordResetToken,
} from "@congress/auth/beneficiary";
import { createID, eq } from "@congress/db";
import { db } from "@congress/db/client";
import { BeneficiaryAccount, Person, PersonContact } from "@congress/db/schema";
import { sendVoiceOTP } from "@congress/transactional/twilio";

import { env } from "../../env";
import { publicProcedure } from "../trpc";

const BENEFICIARY_AUTH_COOKIE_NAME = "congress_bat"; // congress beneficiary auth token
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function setAuthCookie(token: string) {
  setCookie(BENEFICIARY_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

function deleteAuthCookie() {
  deleteCookie(BENEFICIARY_AUTH_COOKIE_NAME, {
    path: "/",
  });
}

function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "05*****00";

  // Keep leading + if present, then digits; otherwise just digits
  const trimmed = phoneNumber.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = (hasPlus ? "+" : "") + trimmed.replace(/[^\d+]/g, "");

  // Normalize to local Israeli format: 0XXXXXXXXX (10 digits)
  // Acceptable inputs:
  // - +9725XXXXXXXX (e.g., +972533505770) -> 05XXXXXXXX
  // - 9725XXXXXXXX  (e.g., 972533505770)  -> 05XXXXXXXX
  // - 05XXXXXXXX    (e.g., 0533505770)    -> 05XXXXXXXX
  // - 5XXXXXXXX     (e.g., 533505770)     -> 05XXXXXXXX
  let local: string | null = null;

  if (digits.startsWith("+972")) {
    const rest = digits.slice(4); // after +972
    if (/^5\d{8}$/.test(rest)) local = "0" + rest; // 05XXXXXXXX
  } else if (digits.startsWith("972")) {
    const rest = digits.slice(3); // after 972
    if (/^5\d{8}$/.test(rest)) local = "0" + rest;
  } else if (/^05\d{8}$/.test(digits)) {
    local = digits;
  } else if (/^5\d{8}$/.test(digits)) {
    local = "0" + digits;
  }

  if (!local) {
    // Fallback predictable mask
    return "05********";
  }

  const first3 = local.slice(0, 3); // e.g., 053
  const last2 = local.slice(-2); // e.g., 70
  return `${first3}*****${last2}`;
}

/**
 * Validators for beneficiary auth
 */
const nationalIdSchema = z.string().min(1).max(50);
const phoneNumberSchema = z.string().min(10).max(20);
const passwordSchema = z.string().min(8).max(128);

const signupSchema = z.object({
  nationalId: nationalIdSchema,
  phoneNumber: phoneNumberSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  documents: z.array(
    z.object({
      documentType: z.string(),
      fileUrl: z.string().url(),
      fileName: z.string(),
      fileSize: z.string(),
      mimeType: z.string(),
    }),
  ),
});

const loginSchema = z.object({
  nationalId: nationalIdSchema,
  password: passwordSchema,
});

const requestPasswordResetSchema = z.object({
  nationalId: nationalIdSchema,
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordSchema,
});

const verifyOTPSchema = z.object({
  nationalId: nationalIdSchema,
  code: z.string().length(6),
  newPassword: passwordSchema,
});

export const beneficiaryAuthRouter = {
  /**
   * Check national ID - Check if account exists and if it has a password
   * Returns account status and whether password is set
   */
  checkNationalId: publicProcedure({ captcha: false })
    .input(z.object({ nationalId: nationalIdSchema }))
    .mutation(async ({ input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        return {
          exists: false,
          hasPassword: false,
          phoneNumberMasked: null,
        };
      }

      return {
        exists: true,
        hasPassword: !!account.passwordHash,
        phoneNumberMasked: maskPhoneNumber(account.phoneNumber),
        status: account.status,
      };
    }),

  /**
   * Send OTP - Send one-time code via Twilio voice call
   */
  sendOTP: publicProcedure({ captcha: true })
    .input(z.object({ nationalId: nationalIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        // Don't reveal if account exists for security
        return {
          success: true,
          message:
            "If an account exists with this national ID, a verification code has been sent to your phone.",
          phoneNumberMasked: null,
        };
      }

      // Generate and store OTP
      const code = await createOTP(account.id, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
      });

      // Send OTP via Twilio
      await sendVoiceOTP({
        to: account.phoneNumber,
        code,
      });

      return {
        success: true,
        message:
          "A verification code has been sent to your phone via voice call.",
        phoneNumberMasked: maskPhoneNumber(account.phoneNumber),
        // In development, return the code for testing
        devCode: env.NODE_ENV === "development" ? code : undefined,
      };
    }),

  /**
   * Verify OTP and set password - Verify OTP code and set/update password
   */
  verifyOTPAndSetPassword: publicProcedure({ captcha: true })
    .input(verifyOTPSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      // Verify OTP
      const isValidOTP = await verifyOTP(account.id, input.code);

      if (!isValidOTP) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }

      // Hash and set password
      const passwordHash = await hashPassword(input.newPassword);

      await db
        .update(BeneficiaryAccount)
        .set({ passwordHash })
        .where(eq(BeneficiaryAccount.id, account.id));

      // Reset failed attempts
      await resetFailedLoginAttempts(account.id);

      // Create session and log in
      const token = await createSessionToken(account.id);
      await createSession(account.id, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

      // Set auth cookie
      setAuthCookie(token);

      return {
        success: true,
        message: "Password set successfully. You are now logged in.",
        account: {
          id: account.id,
          nationalId: account.nationalId,
          status: account.status,
        },
      };
    }),

  /**
   * Signup - Create a new beneficiary account without password
   * Account will be in "pending" status until approved by admin
   * User is logged in immediately after signup
   */
  signup: publicProcedure({ captcha: true })
    .input(signupSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if account already exists
      const existingAccount = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this national ID already exists",
        });
      }

      // Check if person exists (should exist or create)
      let person = await db.query.Person.findFirst({
        where: eq(Person.nationalId, input.nationalId),
      });

      if (!person) {
        // Create person if doesn't exist
        const [newPerson] = await db
          .insert(Person)
          .values({
            nationalId: input.nationalId,
            firstName: input.firstName,
            lastName: input.lastName,
          })
          .returning();

        person = newPerson;
        if (!person) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create person",
          });
        }
        // Create phone contact
        await db.insert(PersonContact).values({
          id: createID("personContact"),
          personId: person.id,
          value: input.phoneNumber,
          contactType: "phone" as const,
          isPrimary: true,
        });
      }

      // Create account WITHOUT password (will be set via OTP flow)
      const accountId = createID("beneficiaryAccount");
      await db.insert(BeneficiaryAccount).values({
        id: accountId,
        nationalId: input.nationalId,
        phoneNumber: input.phoneNumber,
        passwordHash: null, // No password initially
        status: "pending",
      });

      // TODO: Implement document upload
      // // Upload documents
      // if (input.documents.length > 0) {
      //   await db.insert(BeneficiaryDocument).values(
      //     input.documents.map((doc) => ({
      //       id: createID("beneficiaryDocument"),
      //       accountId,
      //       documentType: doc.documentType,
      //       fileUrl: doc.fileUrl,
      //       fileName: doc.fileName,
      //       fileSize: doc.fileSize,
      //       mimeType: doc.mimeType,
      //       status: "pending" as const,
      //     })),
      //   );
      // }

      // Log in immediately after signup
      const token = await createSessionToken(accountId);
      await createSession(accountId, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

      // Set auth cookie
      setAuthCookie(token);

      return {
        success: true,
        message:
          "Account created successfully. Your account is pending verification, but you can still apply for programs.",
        account: {
          id: accountId,
          nationalId: input.nationalId,
          status: "pending" as const,
        },
      };
    }),

  /**
   * Login - Authenticate with national ID and password
   */
  login: publicProcedure({ captcha: true })
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      // Find account by national ID
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid national ID or password",
        });
      }

      // Check if account is locked
      if (await isAccountLocked(account.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Account is temporarily locked due to too many failed login attempts",
        });
      }

      // Check if account has a password
      if (!account.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Account does not have a password set. Please use the forgot password flow to set one.",
        });
      }

      // Allow login even if account is pending (but submissions won't be processed)
      // Only reject if account is rejected or suspended

      if (account.status === "rejected") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account has been rejected. Please contact support.",
        });
      }

      if (account.status === "suspended") {
        if (account.suspendedUntil && account.suspendedUntil > new Date()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account is suspended. Please contact support.",
          });
        }
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        input.password,
        account.passwordHash,
      );

      if (!isValidPassword) {
        await incrementFailedLoginAttempts(account.id);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid national ID or password",
        });
      }

      // Reset failed attempts and update last login
      await resetFailedLoginAttempts(account.id);

      // Create session
      const token = await createSessionToken(account.id);
      await createSession(account.id, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

      // Set auth cookie
      setAuthCookie(token);

      return {
        success: true,
        account: {
          id: account.id,
          nationalId: account.nationalId,
          status: account.status,
        },
      };
    }),

  /**
   * Get current session
   */
  getSession: publicProcedure({ captcha: false }).query(async () => {
    const token = getCookie(BENEFICIARY_AUTH_COOKIE_NAME);

    if (!token) {
      return null;
    }

    const session = await getSession(token);

    if (!session) {
      return null;
    }

    const account = await db.query.BeneficiaryAccount.findFirst({
      where: eq(BeneficiaryAccount.id, session.accountId),
    });

    // Return session even for pending accounts (they can still use the app)
    if (!account) {
      return null;
    }

    return {
      account: {
        id: account.id,
        nationalId: account.nationalId,
        status: account.status,
      },
    };
  }),

  /**
   * Logout - Delete session
   */
  logout: publicProcedure({ captcha: false }).mutation(async () => {
    const token = getCookie(BENEFICIARY_AUTH_COOKIE_NAME);
    if (token) {
      await deleteSession(token);
    }

    // Delete auth cookie
    deleteAuthCookie();

    return { success: true };
  }),

  /**
   * Request password reset - Generate token and send via voice call
   * In production, you'll integrate with a voice service (Twilio, etc.)
   */
  requestPasswordReset: publicProcedure({ captcha: true })
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        // Don't reveal if account exists for security
        return {
          success: true,
          message:
            "If an account exists with this national ID, a password reset code has been sent to your phone.",
        };
      }

      // Create reset token
      const resetToken = await createPasswordResetToken(account.id, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
      });

      // TODO: Integrate with voice call service (Twilio, Vonage, etc.)
      // For now, we'll return the token (in production, send via voice call)
      console.log(
        `[DEV] Password reset token for ${account.nationalId}: ${resetToken}`,
      );

      // In production:
      // await sendVoiceCall({
      //   to: account.phoneNumber,
      //   message: `Your password reset code is: ${resetToken}. This code expires in 15 minutes.`,
      // });

      return {
        success: true,
        message:
          "A password reset code has been sent to your phone via voice call.",
        // Remove this in production
        devToken: env.NODE_ENV === "development" ? resetToken : undefined,
      };
    }),

  /**
   * Reset password using token from voice call
   */
  resetPassword: publicProcedure({ captcha: true })
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const accountId = await verifyPasswordResetToken(input.token);

      if (!accountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(input.newPassword);

      // Update password and mark token as used
      await Promise.all([
        db
          .update(BeneficiaryAccount)
          .set({ passwordHash })
          .where(eq(BeneficiaryAccount.id, accountId)),
        markPasswordResetTokenUsed(input.token),
        resetFailedLoginAttempts(accountId), // Reset failed attempts
      ]);

      return {
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    }),

  /**
   * Check account status (for pending accounts to check if approved)
   */
  checkAccountStatus: publicProcedure({ captcha: true })
    .input(z.object({ nationalId: nationalIdSchema }))
    .query(async ({ input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      return {
        status: account.status,
        message:
          account.status === "pending"
            ? "Your account is pending approval."
            : account.status === "approved"
              ? "Your account has been approved. You can login now."
              : account.status === "rejected"
                ? `Your account has been rejected. ${account.rejectionReason ?? ""}`
                : "Your account status is unknown.",
      };
    }),
} satisfies TRPCRouterRecord;
