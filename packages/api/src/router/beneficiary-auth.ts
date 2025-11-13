import type { TRPCRouterRecord } from "@trpc/server";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { TRPCError } from "@trpc/server";

import type { BeneficiarySignupInput } from "@congress/validators";
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
import { and, createID, eq, inArray, isNull, or } from "@congress/db";
import { db } from "@congress/db/client";
import {
  BeneficiaryAccount,
  Person,
  PersonAddress,
  PersonContact,
  PersonDocument,
  PersonRelationship,
  Upload,
} from "@congress/db/schema";
import { sendVoiceOTP } from "@congress/transactional/twilio";
import {
  beneficiaryIdLookupSchema,
  beneficiaryLoginSchema,
  beneficiaryOtpChangePasswordSchema,
  beneficiaryOtpRequestSchema,
  beneficiaryOtpVerifySchema,
  beneficiaryPasswordResetRequestSchema,
  beneficiaryResetPasswordSchema,
  beneficiarySignupSchema,
} from "@congress/validators";
import {
  identityAppendixDocumentType,
  identityCardDocumentType,
} from "@congress/validators/constants";

import { env } from "../../env";
import { publicProcedure } from "../trpc";

const BENEFICIARY_AUTH_COOKIE_NAME = "congress_bat";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

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

  const trimmed = phoneNumber.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = (hasPlus ? "+" : "") + trimmed.replace(/[^\d+]/g, "");

  let local: string | null = null;

  if (digits.startsWith("+972")) {
    const rest = digits.slice(4);
    if (/^5\d{8}$/.test(rest)) local = `0${rest}`;
  } else if (digits.startsWith("972")) {
    const rest = digits.slice(3);
    if (/^5\d{8}$/.test(rest)) local = `0${rest}`;
  } else if (/^05\d{8}$/.test(digits)) {
    local = digits;
  } else if (/^5\d{8}$/.test(digits)) {
    local = `0${digits}`;
  }

  if (!local) {
    return "05********";
  }

  const first3 = local.slice(0, 3);
  const last2 = local.slice(-2);
  return `${first3}*****${last2}`;
}

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

type RelationshipType =
  (typeof PersonRelationship.$inferInsert)["relationshipType"];

async function upsertPerson(
  tx: TransactionClient,
  person: {
    nationalId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
  },
  allowUpdate = false,
) {
  const existing = await tx.query.Person.findFirst({
    where: eq(Person.nationalId, person.nationalId),
  });

  if (existing) {
    if (allowUpdate) {
      await tx
        .update(Person)
        .set({
          firstName: person.firstName,
          lastName: person.lastName,
          dateOfBirth: person.dateOfBirth,
        })
        .where(eq(Person.id, existing.id));
      return { ...existing, ...person };
    } else {
      return existing;
    }
  }

  const [created] = await tx
    .insert(Person)
    .values({
      nationalId: person.nationalId,
      firstName: person.firstName,
      lastName: person.lastName,
      dateOfBirth: person.dateOfBirth,
    })
    .returning();

  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "failed_to_create_person",
    });
  }

  return created;
}

async function upsertPhoneContacts(
  tx: TransactionClient,
  personId: number,
  primaryPhone: string,
  homePhone?: string,
) {
  const primary = await tx.query.PersonContact.findFirst({
    where: and(
      eq(PersonContact.personId, personId),
      eq(PersonContact.contactType, "phone"),
      eq(PersonContact.isPrimary, true),
    ),
  });

  if (primary) {
    await tx
      .update(PersonContact)
      .set({ value: primaryPhone })
      .where(eq(PersonContact.id, primary.id));
  } else {
    await tx.insert(PersonContact).values({
      id: createID("personContact"),
      personId,
      value: primaryPhone,
      contactType: "phone",
      isPrimary: true,
    });
  }

  if (!homePhone) return;

  const home = await tx.query.PersonContact.findFirst({
    where: and(
      eq(PersonContact.personId, personId),
      eq(PersonContact.contactType, "phone"),
      eq(PersonContact.isPrimary, false),
    ),
  });

  if (home) {
    await tx
      .update(PersonContact)
      .set({ value: homePhone })
      .where(eq(PersonContact.id, home.id));
  } else {
    await tx.insert(PersonContact).values({
      id: createID("personContact"),
      personId,
      value: homePhone,
      contactType: "phone",
      isPrimary: false,
    });
  }
}

async function upsertAddress(
  tx: TransactionClient,
  personId: number,
  address: BeneficiarySignupInput["address"],
) {
  const activeAddress = await tx.query.PersonAddress.findFirst({
    where: and(
      eq(PersonAddress.personId, personId),
      isNull(PersonAddress.endDate),
    ),
  });

  if (activeAddress) {
    if (
      activeAddress.cityId !== address.cityId ||
      activeAddress.streetId !== address.streetId ||
      activeAddress.houseNumber !== address.houseNumber ||
      activeAddress.addressLine2 !== address.addressLine2 ||
      activeAddress.postalCode !== address.postalCode
    ) {
      await tx
        .update(PersonAddress)
        .set({ endDate: new Date() })
        .where(eq(PersonAddress.id, activeAddress.id));
    } else {
      return; // Address is the same, so no need to update
    }
  }

  await tx.insert(PersonAddress).values({
    id: createID("personAddress"),
    personId,
    cityId: address.cityId,
    streetId: address.streetId,
    houseNumber: address.houseNumber,
    addressLine2: address.addressLine2,
    postalCode: address.postalCode,
    country: "IL",
  });
}

async function ensureRelationship(
  tx: TransactionClient,
  params: {
    personId: number;
    relatedPersonId: number;
    relationshipType: RelationshipType;
  },
) {
  const existing = await tx.query.PersonRelationship.findFirst({
    where: or(
      and(
        eq(PersonRelationship.personId, params.personId),
        eq(PersonRelationship.relatedPersonId, params.relatedPersonId),
        eq(PersonRelationship.relationshipType, params.relationshipType),
        isNull(PersonRelationship.endDate),
      ),
      and(
        eq(PersonRelationship.personId, params.relatedPersonId),
        eq(PersonRelationship.relatedPersonId, params.personId),
        eq(PersonRelationship.relationshipType, params.relationshipType),
        isNull(PersonRelationship.endDate),
      ),
    ),
  });

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(PersonRelationship)
    .values({
      id: createID("personRelationship"),
      personId: params.personId,
      relatedPersonId: params.relatedPersonId,
      relationshipType: params.relationshipType,
    })
    .returning();

  return created;
}

async function storeDocuments(
  tx: TransactionClient,
  personId: number,
  documents: {
    uploadId: string;
    documentTypeId: string;
  }[],
) {
  await tx
    .update(Upload)
    .set({
      status: "uploaded",
    })
    .where(
      inArray(
        Upload.id,
        documents.map((document) => document.uploadId),
      ),
    );
  await tx.insert(PersonDocument).values(
    documents.map((document) => ({
      personId,
      documentTypeId: document.documentTypeId,
      uploadId: document.uploadId,
    })),
  );
}

export const beneficiaryAuthRouter = {
  checkNationalId: publicProcedure({ captcha: false })
    .input(beneficiaryIdLookupSchema)
    .mutation(async ({ input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
        with: {
          person: {
            columns: {},
            with: {
              contacts: {
                columns: {
                  value: true,
                },
                where: and(
                  eq(PersonContact.contactType, "phone"),
                  eq(PersonContact.isPrimary, true),
                ),
              },
            },
          },
        },
      });

      if (!account?.person.contacts[0]?.value) {
        return {
          exists: false,
          nextStep: "signup" as const,
          phoneNumberMasked: null,
        };
      }

      const nextStep = account.passwordHash
        ? ("password" as const)
        : ("setPassword" as const);

      return {
        exists: true,
        nextStep,
        phoneNumberMasked: maskPhoneNumber(account.person.contacts[0].value),
        status: account.status,
      };
    }),

  sendOTP: publicProcedure({ captcha: true })
    .input(beneficiaryOtpRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
        with: {
          person: {
            with: {
              contacts: {
                columns: {
                  value: true,
                },
                where: and(
                  eq(PersonContact.contactType, "phone"),
                  eq(PersonContact.isPrimary, true),
                ),
              },
            },
          },
        },
      });

      if (!account?.person.contacts[0]?.value) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "no_phone_number_found_for_account_error",
        });
      }

      const code = await createOTP(account.id, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
      });

      await sendVoiceOTP({
        to: account.person.contacts[0].value,
        code,
      });

      return {
        success: true,
        message:
          "A verification code has been sent to your phone via voice call.",
        phoneNumberMasked: maskPhoneNumber(account.person.contacts[0].value),
        devCode: env.NODE_ENV === "development" ? code : undefined,
      };
    }),

  verifyOTP: publicProcedure({ captcha: true })
    .input(beneficiaryOtpVerifySchema)
    .mutation(async ({ input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const isValidOTP = await verifyOTP(account.id, input.code);

      if (!isValidOTP) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }

      return {
        success: true,
        message: "OTP verified successfully. You can now set your password.",
      };
    }),

  verifyOTPAndSetPassword: publicProcedure({ captcha: true })
    .input(beneficiaryOtpChangePasswordSchema)
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

      const isValidOTP = await verifyOTP(account.id, input.code);

      if (!isValidOTP) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }

      const passwordHash = await hashPassword(input.newPassword);

      await db
        .update(BeneficiaryAccount)
        .set({ passwordHash })
        .where(eq(BeneficiaryAccount.id, account.id));

      await resetFailedLoginAttempts(account.id);

      const token = await createSessionToken(account.id);
      await createSession(account.id, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

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

  signup: publicProcedure({ captcha: true })
    .input(beneficiarySignupSchema)
    .mutation(async ({ ctx, input }) => {
      const accountId = await db.transaction(async (tx) => {
        const existingAccount = await tx.query.BeneficiaryAccount.findFirst({
          where: eq(BeneficiaryAccount.nationalId, input.nationalId),
        });

        if (existingAccount) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this national ID already exists",
          });
        }

        const applicant = await upsertPerson(
          tx,
          {
            nationalId: input.nationalId,
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth
              ? new Date(input.dateOfBirth)
              : undefined,
          },
          true,
        );

        await upsertPhoneContacts(
          tx,
          applicant.id,
          input.personalPhoneNumber,
          input.homePhoneNumber,
        );
        await upsertAddress(tx, applicant.id, input.address);

        const beneficiaryAccountId = createID("beneficiaryAccount");
        await tx.insert(BeneficiaryAccount).values({
          id: beneficiaryAccountId,
          nationalId: input.nationalId,
          passwordHash: null,
          status: "pending",
        });

        if (input.maritalStatus !== "single" && input.spouse) {
          const relationshipType: RelationshipType =
            input.maritalStatus === "married" ? "spouse" : "former_spouse";

          const spousePerson = await upsertPerson(
            tx,
            {
              nationalId: input.spouse.nationalId,
              firstName: input.spouse.firstName,
              lastName: input.spouse.lastName,
              dateOfBirth: input.spouse.dateOfBirth
                ? new Date(input.spouse.dateOfBirth)
                : undefined,
            },
            false,
          );

          if (input.spouse.phoneNumber) {
            await upsertPhoneContacts(
              tx,
              spousePerson.id,
              input.spouse.phoneNumber,
            );
          }

          await ensureRelationship(tx, {
            personId: applicant.id,
            relatedPersonId: spousePerson.id,
            relationshipType,
          });
        }

        if (input.children.length > 0) {
          for (const child of input.children) {
            const childPerson = await upsertPerson(tx, {
              nationalId: child.nationalId,
              firstName: child.firstName,
              lastName: child.lastName,
              dateOfBirth: child.dateOfBirth
                ? new Date(child.dateOfBirth)
                : undefined,
            });

            await ensureRelationship(tx, {
              personId: applicant.id,
              relatedPersonId: childPerson.id,
              relationshipType: "child",
            });
            await ensureRelationship(tx, {
              personId: childPerson.id,
              relatedPersonId: applicant.id,
              relationshipType: "parent",
            });
          }
        }

        const documents = [];
        if (input.identityCardUploadId) {
          documents.push({
            uploadId: input.identityCardUploadId,
            documentTypeId: identityCardDocumentType.id,
          });
        }
        if (input.identityAppendixUploadId) {
          documents.push({
            uploadId: input.identityAppendixUploadId,
            documentTypeId: identityAppendixDocumentType.id,
          });
        }
        await storeDocuments(tx, applicant.id, documents);

        return beneficiaryAccountId;
      });

      const token = await createSessionToken(accountId);
      await createSession(accountId, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

      setAuthCookie(token);

      return {
        success: true,
        message: "account_created_successfully_pending_verification",
        account: {
          id: accountId,
          nationalId: input.nationalId,
          status: "pending" as const,
        },
      };
    }),

  login: publicProcedure({ captcha: true })
    .input(beneficiaryLoginSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid national ID or password",
        });
      }

      if (await isAccountLocked(account.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Account is temporarily locked due to too many failed login attempts",
        });
      }

      if (!account.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Account does not have a password set. Please use the forgot password flow to set one.",
        });
      }

      if (account.status === "rejected") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account has been rejected. Please contact support.",
        });
      }

      if (
        account.status === "suspended" &&
        account.suspendedUntil &&
        account.suspendedUntil > new Date()
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is suspended. Please contact support.",
        });
      }

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

      await resetFailedLoginAttempts(account.id);

      const token = await createSessionToken(account.id);
      await createSession(account.id, token, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
        userAgent: ctx.headers.get("user-agent") ?? undefined,
      });

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

  logout: publicProcedure({ captcha: false }).mutation(async () => {
    const token = getCookie(BENEFICIARY_AUTH_COOKIE_NAME);
    if (token) {
      await deleteSession(token);
    }

    deleteAuthCookie();

    return { success: true };
  }),

  requestPasswordReset: publicProcedure({ captcha: true })
    .input(beneficiaryPasswordResetRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db.query.BeneficiaryAccount.findFirst({
        where: eq(BeneficiaryAccount.nationalId, input.nationalId),
      });

      if (!account) {
        return {
          success: true,
          message:
            "If an account exists with this national ID, a password reset code has been sent to your phone.",
        };
      }

      const resetToken = await createPasswordResetToken(account.id, {
        ipAddress: ctx.headers.get("x-forwarded-for") ?? undefined,
      });

      console.info(
        `[DEV] Password reset token for ${account.nationalId}: ${resetToken}`,
      );

      return {
        success: true,
        message:
          "A password reset code has been sent to your phone via voice call.",
        devToken: env.NODE_ENV === "development" ? resetToken : undefined,
      };
    }),

  resetPassword: publicProcedure({ captcha: true })
    .input(beneficiaryResetPasswordSchema)
    .mutation(async ({ input }) => {
      const accountId = await verifyPasswordResetToken(input.token);

      if (!accountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const passwordHash = await hashPassword(input.newPassword);

      await Promise.all([
        db
          .update(BeneficiaryAccount)
          .set({ passwordHash })
          .where(eq(BeneficiaryAccount.id, accountId)),
        markPasswordResetTokenUsed(input.token),
        resetFailedLoginAttempts(accountId),
      ]);

      return {
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    }),

  checkAccountStatus: publicProcedure({ captcha: true })
    .input(beneficiaryIdLookupSchema)
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
