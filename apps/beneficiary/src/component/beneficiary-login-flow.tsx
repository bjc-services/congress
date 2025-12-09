import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { RouterOutputs } from "@congress/api";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

type LoginStep = "nationalId" | "password" | "otp" | "setPassword" | "signup";

export function BeneficiaryLoginFlow() {
  const { t } = useTranslation();
  const { orpc } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const { refetchSession } = useBeneficiaryAuth();
  const [step, setStep] = useState<LoginStep>("nationalId");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumberMasked, setPhoneNumberMasked] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  type CheckNationalIdResult =
    RouterOutputs["beneficiaryAuth"]["checkNationalId"];

  // Check account status mutation
  const checkNationalIdMutation = useMutation(
    orpc.beneficiaryAuth.checkNationalId.mutationOptions({
      onSuccess: (data: CheckNationalIdResult) => {
        if (!data.exists) {
          // No account exists, show signup form
          setStep("signup");
        } else if (data.nextStep === "password") {
          // Account exists with password, show password input
          setStep("password");
        } else {
          // Account exists but no password, send OTP
          void sendOTPMutation.mutate({ nationalId });
        }
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || t("failed_to_check_account"));
      },
    }),
  );

  const sendOTPMutation = useMutation(
    orpc.beneficiaryAuth.sendOTP.mutationOptions({
      onSuccess: (data) => {
        setPhoneNumberMasked(data.phoneNumberMasked);
        setStep("otp");
        toast.success(data.message);
        if (data.devCode) {
          console.log(`[DEV] OTP Code: ${data.devCode}`);
        }
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || t("failed_to_send_otp"));
      },
    }),
  );

  const verifyOTPMutation = useMutation(
    orpc.beneficiaryAuth.verifyOTPAndSetPassword.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);
        await refetchSession();
        await navigate({ href: "/", replace: true });
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || t("invalid_verification_code"));
      },
    }),
  );

  const loginMutation = useMutation(
    orpc.beneficiaryAuth.login.mutationOptions({
      onSuccess: async () => {
        toast.success(t("logged_in_successfully"));
        await refetchSession();
        await navigate({ href: "/", replace: true });
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || t("invalid_credentials"));
      },
    }),
  );

  const handleNationalIdSubmit = async () => {
    if (!nationalId.trim()) {
      toast.error(t("please_enter_national_id"));
      return;
    }
    setIsLoading(true);
    try {
      await checkNationalIdMutation.mutateAsync({ nationalId });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error(t("please_enter_password"));
      return;
    }

    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({
        nationalId,
        password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      await sendOTPMutation.mutateAsync({ nationalId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = () => {
    if (!otpCode.trim() || otpCode.length !== 4) {
      toast.error(t("please_enter_otp"));
      return;
    }

    setStep("setPassword");
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      toast.error(t("password_min_length"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("passwords_do_not_match"));
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTPMutation.mutateAsync({
        nationalId,
        code: otpCode,
        newPassword,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: National ID Input
  if (step === "nationalId") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <h2 className="text-2xl font-bold">{t("login")}</h2>
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="nationalId">{t("national_id")}</FieldLabel>
            </FieldContent>
            <Input
              id="nationalId"
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder={t("enter_national_id")}
              disabled={isLoading || checkNationalIdMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleNationalIdSubmit();
                }
              }}
            />
          </Field>
        </FieldGroup>
        <Button
          size="lg"
          disabled={isLoading || checkNationalIdMutation.isPending}
          onClick={() => void handleNationalIdSubmit()}
        >
          {isLoading || checkNationalIdMutation.isPending
            ? t("checking")
            : t("continue")}
        </Button>
      </div>
    );
  }

  // Step 2: Password Input (if account has password)
  if (step === "password") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <h2 className="text-2xl font-bold">{t("enter_password")}</h2>
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
            </FieldContent>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("enter_your_password")}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handlePasswordSubmit();
                }
              }}
            />
          </Field>
        </FieldGroup>
        <div className="flex flex-col gap-2">
          <Button size="lg" disabled={isLoading} onClick={handlePasswordSubmit}>
            {isLoading ? t("logging_in") : t("login")}
          </Button>
          <Button
            variant="ghost"
            disabled={isLoading}
            onClick={handleForgotPassword}
          >
            {t("forgot_password")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("nationalId");
              setPassword("");
            }}
          >
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: OTP Input
  if (step === "otp") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <h2 className="text-2xl font-bold">{t("verification_code")}</h2>
        <p className="text-muted-foreground text-sm">
          {phoneNumberMasked
            ? t("otp_sent_message", { phoneNumber: phoneNumberMasked })
            : t("otp_sent_message_no_phone")}
        </p>
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="otp">
                {t("verification_code_label")}
              </FieldLabel>
            </FieldContent>
            <Input
              id="otp"
              type="text"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpCode(value);
              }}
              placeholder="000000"
              disabled={isLoading}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </Field>
        </FieldGroup>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            disabled={isLoading || otpCode.length !== 6}
            onClick={handleOTPSubmit}
          >
            {isLoading ? t("verifying") : t("verify_code")}
          </Button>
          <Button
            variant="ghost"
            disabled={isLoading}
            onClick={() => {
              void sendOTPMutation.mutateAsync({ nationalId });
            }}
          >
            {t("resend_code")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("nationalId");
              setOtpCode("");
            }}
          >
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Set Password (after OTP verification)
  if (step === "setPassword") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <h2 className="text-2xl font-bold">{t("set_your_password")}</h2>
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="newPassword">{t("new_password")}</FieldLabel>
            </FieldContent>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("enter_new_password")}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="confirmPassword">
                {t("confirm_password")}
              </FieldLabel>
            </FieldContent>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirm_new_password")}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSetPassword();
                }
              }}
            />
          </Field>
        </FieldGroup>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            disabled={
              isLoading ||
              !newPassword ||
              newPassword.length < 8 ||
              newPassword !== confirmPassword
            }
            onClick={handleSetPassword}
          >
            {isLoading ? t("setting_password") : t("set_password")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("otp");
              setNewPassword("");
              setConfirmPassword("");
            }}
          >
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  // Step 5: Signup Form
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (step === "signup") {
    void navigate({ to: "/signup", search: { nationalId }, replace: false });
  }

  return null;
}
