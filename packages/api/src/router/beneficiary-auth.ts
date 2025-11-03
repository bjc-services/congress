import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import {
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
  verifyPassword,
  verifyPasswordResetToken,
} from "@acme/auth/beneficiary";
import { createID, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  beneficiaryAccountTable,
  personContactTable,
  personTable,
} from "@acme/db/schema";

import { publicProcedure } from "../trpc";

/**
 * Validators for beneficiary auth
 */
const nationalIdSchema = z.string().min(1).max(50);
const phoneNumberSchema = z.string().min(10).max(20);
const passwordSchema = z.string().min(8).max(128);

const signupSchema = z.object({
  nationalId: nationalIdSchema,
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
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

export const beneficiaryAuthRouter = {
  /**
   * Signup - Create a new beneficiary account
   * Account will be in "pending" status until approved by admin
   */
  signup: publicProcedure({ captcha: true })
    .input(signupSchema)
    .mutation(async ({ input }) => {
      // Check if account already exists
      const existingAccount = await db.query.beneficiaryAccountTable.findFirst({
        where: eq(beneficiaryAccountTable.nationalId, input.nationalId),
      });

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this national ID already exists",
        });
      }

      // Check if person exists (should exist or create)
      let person = await db.query.personTable.findFirst({
        where: eq(personTable.nationalId, input.nationalId),
      });

      if (!person) {
        // Create person if doesn't exist
        const [newPerson] = await db
          .insert(personTable)
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
        await db.insert(personContactTable).values({
          id: createID("personContact"),
          personId: person.id,
          value: input.phoneNumber,
          contactType: "phone" as const,
          isPrimary: true,
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create account
      const accountId = createID("beneficiaryAccount");
      await db.insert(beneficiaryAccountTable).values({
        id: accountId,
        nationalId: input.nationalId,
        phoneNumber: input.phoneNumber,
        passwordHash,
        status: "pending",
      });

      // Upload documents
      if (input.documents.length > 0) {
        await db.insert(beneficiaryDocumentTable).values(
          input.documents.map((doc) => ({
            id: createID("beneficiaryDocument"),
            accountId,
            documentType: doc.documentType,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            status: "pending" as const,
          })),
        );
      }

      return {
        success: true,
        message:
          "Account created successfully. Please wait for admin approval before you can login.",
        accountId,
      };
    }),

  /**
   * Login - Authenticate with national ID and password
   */
  login: publicProcedure({ captcha: true })
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      // Find account by national ID
      const account = await db.query.beneficiaryAccountTable.findFirst({
        where: eq(beneficiaryAccountTable.nationalId, input.nationalId),
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

      // Check account status
      if (account.status === "pending") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your account is pending approval. Please wait for admin review.",
        });
      }

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

      return {
        success: true,
        token,
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
  getSession: publicProcedure({ captcha: false }).query(async ({ ctx }) => {
    const token = ctx.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const session = await getSession(token);

    if (!session) {
      return null;
    }

    const account = await db.query.beneficiaryAccountTable.findFirst({
      where: eq(beneficiaryAccountTable.id, session.accountId),
    });

    if (!account?.status || account.status !== "approved") {
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
  logout: publicProcedure({ captcha: false }).mutation(async ({ ctx }) => {
    const token = ctx.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      await deleteSession(token);
    }

    return { success: true };
  }),

  /**
   * Request password reset - Generate token and send via voice call
   * In production, you'll integrate with a voice service (Twilio, etc.)
   */
  requestPasswordReset: publicProcedure({ captcha: true })
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.beneficiaryAccountTable.findFirst({
        where: eq(beneficiaryAccountTable.nationalId, input.nationalId),
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
        devToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
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
          .update(beneficiaryAccountTable)
          .set({ passwordHash })
          .where(eq(beneficiaryAccountTable.id, accountId)),
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
      const account = await db.query.beneficiaryAccountTable.findFirst({
        where: eq(beneficiaryAccountTable.nationalId, input.nationalId),
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
