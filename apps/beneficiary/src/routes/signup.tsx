import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import type { AppForm } from "@congress/ui/fields";
import type { UploadedFile } from "@congress/ui/upload";
import type { maritalStatusSchema } from "@congress/validators";
import { AddressFieldsGroup, useAppForm } from "@congress/ui/fields";
import { toast } from "@congress/ui/toast";
import { signupFormSchema } from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { orpcClient } from "~/lib/orpc";
import { ApplicantDetailsSection } from "./signup/components/applicant-details-section";
import { ChildrenSection } from "./signup/components/children-section";
import { FamilyStatusSection } from "./signup/components/family-status-section";
import { IdentityDocumentsSection } from "./signup/components/identity-documents-section";
import { YeshivaDetails } from "./signup/components/kollel-details";
import { OtpStep } from "./signup/components/otp-step";
import {
  PasswordStep,
  passwordStepSchema,
} from "./signup/components/password-step";
import { PersonalDetailsStep } from "./signup/components/personal-details-step";
import { SignupHeader } from "./signup/components/signup-header";
import { SignupLayout } from "./signup/components/signup-layout";
import { StepIndicator } from "./signup/components/step-indicator";

type SignupStep = "form" | "otp" | "password";

const TOTAL_STEPS = 3;

const STEP_TO_NUMBER: Record<SignupStep, number> = {
  form: 1,
  password: 2,
  otp: 3,
};

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
  const navigate = useNavigate();
  const { session } = useBeneficiaryAuth();
  const search = Route.useSearch();
  const [step, setStep] = useState<SignupStep>("form");
  const [formData, setFormData] = useState<Omit<
    z.infer<typeof signupFormSchema>,
    "otpCode" | "password"
  > | null>(null);

  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (session) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  return (
    <SignupLayout>
      <StepIndicator
        currentStep={STEP_TO_NUMBER[step]}
        totalSteps={TOTAL_STEPS}
      />
      <SignupHeader />
      {step === "form" && (
        <PersonalDetailsStep
          nationalId={search.nationalId ?? ""}
          setFormData={setFormData}
          setStep={setStep}
        />
      )}
      {step === "otp" && (
        <OtpStep
          formData={formData}
          setStep={setStep}
          password={password}
        />
      )}
      {step === "password" && (
        <PasswordStep
          setStep={setStep}
          setPassword={setPassword}
          nationalId={search.nationalId ?? ""}
          personalPhoneNumber={formData?.personalPhoneNumber ?? ""}
        />
      )}
    </SignupLayout>
  );
}
