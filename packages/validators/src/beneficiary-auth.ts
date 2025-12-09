import { differenceInYears } from "date-fns";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod/v4";

import { zodIsraeliId } from "./israeli-id";

const MARITAL_STATUSES = ["single", "married", "divorced"] as const;

const isoDateSchema = z
  .string({ message: "date_of_birth_required" })
  .trim()
  .min(1, { message: "date_of_birth_required" })
  .refine(
    (value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    },
    { message: "invalid_date" },
  );

export const phoneNumberSchema = z
  .string({ message: "phone_number_required" })
  .transform((value) => {
    return parsePhoneNumberFromString(value, "IL")!;
  })
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- value is not actually guaranteed, but we check it in the refine
  .refine((value) => value?.isValid() ?? false, {
    message: "invalid_phone_number",
  })
  .transform((value) => value.number) as unknown as z.ZodString;

export const optionalPhoneNumberSchema = z
  .string()
  .optional()
  .transform((value) => {
    return value ? parsePhoneNumberFromString(value, "IL")! : undefined;
  })
  .refine((value) => value?.isValid() ?? true, {
    message: "invalid_phone_number",
  })
  .transform(
    (value) => value?.number ?? undefined,
  ) as unknown as z.ZodOptional<z.ZodString>;

const nameSchema = z
  .string({ message: "name_required" })
  .trim()
  .min(2, { message: "name_too_short" })
  .max(100, { message: "name_too_long" });

const houseNumberSchema = z
  .string({ message: "house_number_required" })
  .trim()
  .min(1, { message: "house_number_required" })
  .max(10, { message: "house_number_too_long" });

const postalCodeSchema = z
  .string({ message: "postal_code_required" })
  .trim()
  .min(5, { message: "postal_code_too_short" })
  .max(7, { message: "postal_code_too_long" });

const addressSchema = z.object({
  cityId: z
    .number({ message: "city_required" })
    .int()
    .positive({ message: "city_required" }),
  streetId: z
    .number({ message: "street_required" })
    .int()
    .positive({ message: "street_required" }),
  houseNumber: houseNumberSchema,
  addressLine2: z
    .string({ message: "address_line2_required" })
    .trim()
    .max(50, { message: "address_line2_too_long" })
    .optional(),
  postalCode: postalCodeSchema,
});

const spouseSchema = z.object({
  nationalId: zodIsraeliId,
  firstName: nameSchema,
  lastName: nameSchema,
  phoneNumber: optionalPhoneNumberSchema,
  dateOfBirth: isoDateSchema,
});

const childSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  nationalId: zodIsraeliId,
  dateOfBirth: isoDateSchema,
});

export const maritalStatusSchema = z.enum(MARITAL_STATUSES);

export const beneficiaryDocumentSchema = z.object({
  documentType: z.string().min(1, { message: "document_type_required" }),
  uploadId: z.string().min(1, { message: "upload_id_required" }),
});

export const passwordSchema = z
  .string()
  .min(8, { message: "password_too_short" })
  .max(128, { message: "password_too_long" });

export const beneficiaryIdLookupSchema = z.object({
  nationalId: zodIsraeliId,
});

export const beneficiaryLoginSchema = z.object({
  nationalId: zodIsraeliId,
  password: passwordSchema,
});

export const beneficiaryOtpRequestSchema = z.object({
  nationalId: zodIsraeliId,
});

export const beneficiaryOtpVerifySchema = z.object({
  nationalId: zodIsraeliId,
  code: z
    .string()
    .trim()
    .length(4, { message: "otp_invalid" })
    .regex(/^\d{4}$/, { message: "otp_invalid" }),
});

export const beneficiarySignupOtpRequestSchema = z.object({
  nationalId: zodIsraeliId,
  phoneNumber: phoneNumberSchema,
});

export const beneficiarySignupOtpVerifySchema = z.object({
  nationalId: zodIsraeliId,
  phoneNumber: phoneNumberSchema,
  code: z
    .string()
    .trim()
    .length(4, { message: "otp_invalid" })
    .regex(/^\d{4}$/, { message: "otp_invalid" }),
});

export const beneficiaryOtpChangePasswordSchema = z.object({
  nationalId: zodIsraeliId,
  code: z
    .string()
    .trim()
    .length(4, { message: "otp_invalid" })
    .regex(/^\d{4}$/, { message: "otp_invalid" }),
  newPassword: passwordSchema,
});

export const beneficiaryPasswordResetRequestSchema = z.object({
  nationalId: zodIsraeliId,
});

export const beneficiaryResetPasswordSchema = z.object({
  token: z.string().min(1, { message: "reset_token_required" }),
  newPassword: passwordSchema,
});

export const yeshivaDetailsSchema = z.object({
  yeshivaName: z
    .string()
    .min(1, { message: "yeshiva_name_required" })
    .optional(),
  headOfTheYeshivaName: z
    .string()
    .min(1, { message: "head_of_the_yeshiva_name_required" })
    .optional(),
  headOfTheYeshivaPhone: phoneNumberSchema.optional(),
  yeshivaWorkType: z.enum(["all_day", "half_day"]).optional(),
  yeshivaCertificateUploadId: z.string().optional(),
  yeshivaType: z.enum(["kollel", "yeshiva"]),
});

export const beneficiarySignupSchema = z
  .object({
    nationalId: zodIsraeliId,
    firstName: nameSchema,
    lastName: nameSchema,
    personalPhoneNumber: phoneNumberSchema,
    homePhoneNumber: optionalPhoneNumberSchema,
    dateOfBirth: isoDateSchema,
    maritalStatus: maritalStatusSchema,
    address: addressSchema,
    spouse: spouseSchema.optional(),
    childrenCount: z.coerce
      .number({ error: "children_count_invalid" })
      .min(0, { message: "children_count_invalid" })
      .max(30, { message: "children_count_invalid" }),
    children: z.array(childSchema),
    identityCardUploadId: z.string().optional(),
    identityAppendixUploadId: z.string().optional(),
    otpCode: z
      .string()
      .trim()
      .length(4, { message: "otp_invalid" })
      .regex(/^\d{4}$/, { message: "otp_invalid" }),
    password: passwordSchema,
    yeshivaDetails: yeshivaDetailsSchema,
  })
  .superRefine((value, ctx) => {
    const age = calculateAge(value.dateOfBirth);
    const isKollel = value.yeshivaDetails.yeshivaType === "kollel";
    const documentsRequired = age >= 18 || !age;

    const hasYeshivaCertificate =
      value.yeshivaDetails.yeshivaCertificateUploadId !== undefined;
    const hasIdentityCard = value.identityCardUploadId !== undefined;
    const hasIdentityAppendix = value.identityAppendixUploadId !== undefined;
    const hasProvidedDocuments = hasIdentityCard && hasIdentityAppendix;

    if (documentsRequired && !hasProvidedDocuments) {
      if (!hasIdentityCard) {
        ctx.addIssue({
          code: "custom",
          path: ["identityCardUploadId"],
          message: "identity_card_upload_id_required",
        });
      }
      if (!hasIdentityAppendix) {
        ctx.addIssue({
          code: "custom",
          path: ["identityAppendixUploadId"],
          message: "identity_appendix_upload_id_required",
        });
      }
    }

    if (isKollel && !hasYeshivaCertificate) {
      console.log("yeshiva_certificate_upload_id_required");
      ctx.addIssue({
        code: "custom",
        path: ["yeshivaCertificateUploadId"],
        message: "yeshiva_certificate_upload_id_required",
      });
    }

    if (value.maritalStatus !== "single") {
      if (!value.spouse) {
        ctx.addIssue({
          code: "custom",
          path: ["spouse"],
          message: "spouse_required",
        });
      }
    }

    if (value.children.length !== value.childrenCount) {
      ctx.addIssue({
        code: "custom",
        path: ["children"],
        message: "children_mismatch",
      });
    }
  });

// Schema for form validation (without otpCode and password)
export const signupFormSchema = beneficiarySignupSchema
  .omit({
    otpCode: true,
    password: true,
  })
  .superRefine((value, ctx) => {
    const age = calculateAge(value.dateOfBirth);
    const isKollel = value.yeshivaDetails.yeshivaType === "kollel";
    const documentsRequired = age >= 18 || !age;

    const hasYeshivaCertificate =
      value.yeshivaDetails.yeshivaCertificateUploadId !== undefined;
    const hasIdentityCard = value.identityCardUploadId !== undefined;
    const hasIdentityAppendix = value.identityAppendixUploadId !== undefined;
    const hasProvidedDocuments = hasIdentityCard && hasIdentityAppendix;

    if (documentsRequired && !hasProvidedDocuments) {
      if (!hasIdentityCard) {
        console.log("identity_card_upload_id_required");
        ctx.addIssue({
          code: "custom",
          path: ["identityCardUploadId"],
          message: "identity_card_upload_id_required",
        });
      }
      if (!hasIdentityAppendix) {
        console.log("identity_appendix_upload_id_required");
        ctx.addIssue({
          code: "custom",
          path: ["identityAppendixUploadId"],
          message: "identity_appendix_upload_id_required",
        });
      }
    }

    if (isKollel && !hasYeshivaCertificate) {
      console.log("yeshiva_certificate_upload_id_required");
      ctx.addIssue({
        code: "custom",
        path: ["yeshivaDetails", "yeshivaCertificateUploadId"],
        message: "yeshiva_certificate_upload_id_required",
      });
    }

    if (value.maritalStatus !== "single") {
      if (!value.spouse) {
        ctx.addIssue({
          code: "custom",
          path: ["spouse"],
          message: "spouse_required",
        });
      }
    }

    if (value.children.length !== value.childrenCount) {
      ctx.addIssue({
        code: "custom",
        path: ["children"],
        message: "children_mismatch",
      });
    }
  });

export type BeneficiarySignupInput = z.infer<typeof beneficiarySignupSchema>;
export type BeneficiarySpouseInput = z.infer<typeof spouseSchema>;
export type BeneficiaryChildInput = z.infer<typeof childSchema>;

function calculateAge(date: string): number {
  return differenceInYears(new Date(), new Date(date));
}
