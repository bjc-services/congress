import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import type { AppForm } from "@congress/ui/fields";
import type { UploadedFile } from "@congress/ui/upload";
import type { maritalStatusSchema } from "@congress/validators";
import { AddressFieldsGroup, useAppForm } from "@congress/ui/fields";
import { toast } from "@congress/ui/toast";
import { beneficiarySignupSchema } from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { trpcClient, useTRPC } from "~/lib/trpc";
import { ApplicantDetailsSection } from "./signup/components/applicant-details-section";
import { ChildrenSection } from "./signup/components/children-section";
import { FamilyStatusSection } from "./signup/components/family-status-section";
import { IdentityDocumentsSection } from "./signup/components/identity-documents-section";
import { OtpStep } from "./signup/components/otp-step";
import {
  PasswordStep,
  passwordStepSchema,
} from "./signup/components/password-step";
import { SignupFormActions } from "./signup/components/signup-form-actions";
import { SignupHeader } from "./signup/components/signup-header";
import { SignupLayout } from "./signup/components/signup-layout";

type MaritalStatus = z.infer<typeof maritalStatusSchema>;

type SignupStep = "form" | "otp" | "password";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "invalid_otp"),
});

// Schema for form validation (without otpCode and password)
const signupFormSchema = beneficiarySignupSchema.omit({
  otpCode: true,
  password: true,
});

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    nationalId:
      typeof search.nationalId === "string" ? search.nationalId : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.nationalId) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/login", search: { nationalId: undefined } });
    }
  },
  component: SignupRouteComponent,
});

function SignupRouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { session, refetchSession } = useBeneficiaryAuth();
  const search = Route.useSearch();

  const [step, setStep] = useState<SignupStep>("form");
  const [formData, setFormData] = useState<Omit<
    z.infer<typeof beneficiarySignupSchema>,
    "otpCode" | "password"
  > | null>(null);
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (session) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  const sendSignupOtpMutation = useMutation(
    trpc.beneficiaryAuth.sendSignupOTP.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        setStep("otp");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const signupMutation = useMutation(
    trpc.beneficiaryAuth.signup.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);
        await refetchSession();
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      nationalId: search.nationalId ?? "",
      firstName: "",
      lastName: "",
      personalPhoneNumber: "",
      homePhoneNumber: "" as string | undefined,
      dateOfBirth: "",
      maritalStatus: "single" as MaritalStatus,
      address: {
        cityId: 0,
        streetId: 0,
        houseNumber: "",
        addressLine2: "",
        postalCode: "",
      },
      spouse: undefined as
        | {
            nationalId: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth: string;
          }
        | undefined,
      childrenCount: 0,
      children: [] as {
        firstName: string;
        lastName: string;
        nationalId: string;
        dateOfBirth: string;
      }[],
      identityCardUploadId: undefined as string | undefined,
      identityAppendixUploadId: undefined as string | undefined,
    },
    validators: {
      // @ts-expect-error - Type mismatch between optional and required undefined, but runtime validation works correctly
      onSubmit: signupFormSchema,
    },
    onSubmit: ({ value }) => {
      // Validate form and move to password step
      const payload = {
        ...value,
        homePhoneNumber: value.homePhoneNumber,
        spouse: value.maritalStatus === "single" ? undefined : value.spouse,
        children: value.children.slice(0, value.childrenCount),
      };

      // Store form data for later submission
      setFormData(payload);

      // Move to password step
      setStep("password");
    },
  });

  const otpForm = useAppForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!formData) {
        toast.error(t("form_data_missing"));
        setStep("form");
        return;
      }

      if (!password) {
        toast.error(t("password_required"));
        setStep("password");
        return;
      }

      // Submit signup with OTP code and password
      const payload = {
        ...formData,
        otpCode: value.otp,
        password,
      };

      await signupMutation.mutateAsync(payload);
    },
  });

  const passwordForm = useAppForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: passwordStepSchema,
    },
    onSubmit: async ({ value }) => {
      if (!formData) {
        toast.error(t("form_data_missing"));
        setStep("form");
        return;
      }

      // Store password and send OTP
      setPassword(value.password);

      // Send OTP to phone number
      await sendSignupOtpMutation.mutateAsync({
        nationalId: formData.nationalId,
        phoneNumber: formData.personalPhoneNumber,
      });
    },
  });

  // State for uploaded files
  const [idCardFile, setIdCardFile] = useState<UploadedFile | undefined>();
  const [idAppendixFile, setIdAppendixFile] = useState<
    UploadedFile | undefined
  >();

  // Upload mutations - use direct trpc calls to avoid SSR issues with mutationOptions
  const handleGetPresignedUrl = useCallback(
    async (params: {
      documentTypeId: string;
      fileName: string;
      fileSize: number;
      base64Md5Hash: string;
      contentType: string;
    }) => {
      try {
        // Use the trpc client directly for SSR compatibility
        const result = await trpcClient.upload.requestUploadUrl.mutate(params);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage || t("upload_failed"));
        throw error;
      }
    },
    [t],
  );

  const handleCancelUpload = useCallback(
    async (uploadId: string) => {
      try {
        await trpcClient.upload.cancelUpload.mutate({ uploadId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage || t("delete_failed"));
        throw error;
      }
    },
    [t],
  );

  return (
    <SignupLayout>
      <SignupHeader />
      {step === "form" && (
        <form.AppForm>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <ApplicantDetailsSection
              form={form as AppForm}
              setIdCardFile={setIdCardFile}
              setIdAppendixFile={setIdAppendixFile}
            />

            {/* Address Section */}
            <AddressFieldsGroup
              form={form}
              fields={{
                cityId: "address.cityId",
                streetId: "address.streetId",
                houseNumber: "address.houseNumber",
                addressLine2: "address.addressLine2",
                postalCode: "address.postalCode",
              }}
              title={t("address_information")}
            />

            <FamilyStatusSection form={form as AppForm} />
            <ChildrenSection form={form as AppForm} />
            <form.Subscribe
              selector={(state) => [state.values.dateOfBirth]}
              children={([dateOfBirth]) => (
                <IdentityDocumentsSection
                  form={form as AppForm}
                  dateOfBirth={dateOfBirth ?? ""}
                  idCardFile={idCardFile}
                  idAppendixFile={idAppendixFile}
                  setIdCardFile={setIdCardFile}
                  setIdAppendixFile={setIdAppendixFile}
                  handleGetPresignedUrl={handleGetPresignedUrl}
                  handleCancelUpload={handleCancelUpload}
                />
              )}
            />
            <SignupFormActions form={form as AppForm} />
          </form>
        </form.AppForm>
      )}
      {step === "otp" && (
        <OtpStep
          otpForm={otpForm as unknown as AppForm}
          formData={formData}
          setStep={setStep}
        />
      )}
      {step === "password" && (
        <PasswordStep
          passwordForm={passwordForm as unknown as AppForm}
          onBack={() => {
            setStep("form");
            passwordForm.reset();
          }}
          isBusy={sendSignupOtpMutation.isPending}
        />
      )}
    </SignupLayout>
  );
}
