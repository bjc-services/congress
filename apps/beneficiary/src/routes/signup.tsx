import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod/v4";

import { signupFormSchema } from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { OtpStep } from "./signup/components/otp-step";
import { PasswordStep } from "./signup/components/password-step";
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

export interface DisclaimerState {
  disclaimerStatement1: boolean;
  disclaimerStatement2: boolean;
  disclaimerStatement3: boolean;
}

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
  const [disclaimers, setDisclaimers] = useState<DisclaimerState>({
    disclaimerStatement1: false,
    disclaimerStatement2: false,
    disclaimerStatement3: false,
  });

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
          initialData={formData}
          disclaimers={disclaimers}
          setDisclaimers={setDisclaimers}
        />
      )}
      {step === "otp" && (
        <OtpStep formData={formData} setStep={setStep} password={password} />
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
