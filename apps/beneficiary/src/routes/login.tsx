import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { Button } from "@congress/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@congress/ui/field";
import { useAppForm } from "@congress/ui/fields";
import { Input } from "@congress/ui/input";
import { LanguageSwitcher } from "@congress/ui/language-switcher";
import { SquareLogo } from "@congress/ui/square-logo";
import { toast } from "@congress/ui/toast";
import {
  beneficiaryIdLookupSchema,
  beneficiaryLoginSchema,
  passwordSchema,
} from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { orpcClient } from "~/lib/orpc";

type LoginStep = "identify" | "password" | "otp" | "setPassword";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "invalid_otp"),
});

const setPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "passwords_do_not_match",
    path: ["confirmPassword"],
  });

interface IdentifyStepProps {
  initialNationalId?: string;
  onSuccess: (data: {
    nationalId: string;
    nextStep: "password" | "setPassword" | "signup";
    phoneNumberMasked?: string | null;
  }) => void | Promise<void>;
  onPasswordStepReady: () => void;
  isBusy: boolean;
}

function IdentifyStep({
  initialNationalId = "",
  onSuccess,
  onPasswordStepReady,
  isBusy,
}: IdentifyStepProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useAppForm({
    defaultValues: {
      nationalId: initialNationalId,
    },
    validators: {
      onSubmit: beneficiaryIdLookupSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const result = await orpcClient.beneficiaryAuth.checkNationalId({
            nationalId: value.nationalId,
          });

          if (!result.exists) {
            toast.success(t("no_account_found_redirecting"));
            await navigate({
              to: "/signup",
              search: { nationalId: value.nationalId },
              replace: false,
            });
            return;
          }

          if (result.nextStep === "password") {
            onPasswordStepReady();
          }

          await onSuccess({
            nationalId: value.nationalId,
            nextStep: result.nextStep,
            phoneNumberMasked: result.phoneNumberMasked ?? null,
          });
        } catch (error) {
          return {
            fields: {
              nationalId:
                error instanceof Error
                  ? t((error.message || "national_id_incorrect") as any)
                  : t("national_id_incorrect"),
            },
          };
        }
      },
    },
    onSubmit: async () => {
      // onSubmit is handled by onSubmitAsync validator
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isInvalid = useStore(form.store, (state) => !state.isValid);

  return (
    <form
      className="relative flex w-full max-w-sm flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField
        name="nationalId"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <field.TextField
              label={t("enter_id_label")}
              autoComplete="off"
              inputMode="numeric"
              aria-invalid={isInvalid}
              disabled={isSubmitting || isBusy}
              variant="inverted"
              align="center"
              displayError={false}
            />
          );
        }}
      />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        variant="inverted"
        disabled={isSubmitting || isBusy}
      >
        {isSubmitting ? t("checking") : t("login_button")}
      </Button>

      {isInvalid && (
        <FieldError
          className="absolute -bottom-6 left-0 w-full translate-y-full text-center text-base"
          errors={form.state.fieldMeta.nationalId.errors.map((error) => {
            if (typeof error === "string") {
              try {
                return { message: t(error as never) };
              } catch {
                return { message: error };
              }
            }
            if (
              typeof error === "object" &&
              error &&
              "message" in error &&
              (error.message as string) &&
              typeof error.message === "string"
            ) {
              try {
                return { message: t(error.message) };
              } catch {
                return { message: error.message };
              }
            }
            return undefined;
          })}
          variant="inverted"
        />
      )}
    </form>
  );
}

interface PasswordStepProps {
  nationalId: string;
  onLogin: (password: string) => void | Promise<void>;
  onForgotPassword: () => void | Promise<void>;
  onBack: () => void;
  isBusy: boolean;
}

function PasswordStep({
  nationalId,
  onLogin,
  onForgotPassword,
  onBack,
  isBusy,
}: PasswordStepProps) {
  const { t } = useTranslation();

  const form = useAppForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: beneficiaryLoginSchema.pick({ password: true }),
    },
    onSubmit: async ({ value }) => {
      await onLogin(value.password);
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>{t("login_national_id_label", { id: nationalId })}</p>
      </div>
      <form.Field
        name="password"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid} className="mb-4 gap-1">
              <FieldLabel htmlFor={field.name}>{t("password")}</FieldLabel>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={isSubmitting || isBusy}
                aria-invalid={isInvalid}
              />
              <div className="h-2">
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </div>
            </Field>
          );
        }}
      />
      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || isBusy}
        >
          {isSubmitting || isBusy ? t("logging_in") : t("login")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          disabled={isBusy}
          onClick={() => {
            void onForgotPassword();
          }}
        >
          {t("forgot_password")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          onClick={onBack}
        >
          {t("back")}
        </Button>
      </div>
    </form>
  );
}

interface OtpStepProps {
  maskedPhoneNumber: string | null;
  onVerify: (otp: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  onBack: () => void;
  isBusy: boolean;
  isResending: boolean;
}

function OtpStep({
  maskedPhoneNumber,
  onVerify,
  onResend,
  onBack,
  isBusy,
  isResending,
}: OtpStepProps) {
  const { t } = useTranslation();

  const form = useAppForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpSchema,
    },
    onSubmit: async ({ value }) => {
      await onVerify(value.otp);
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          {maskedPhoneNumber ? (
            <Trans
              i18nKey="otp_sent_message"
              values={{ phoneNumber: maskedPhoneNumber }}
              components={{
                phone: <span dir="ltr" className="inline-block" />,
              }}
            />
          ) : (
            t("otp_sent_message_no_phone")
          )}
        </p>
      </div>
      <FieldGroup>
        <form.AppField
          name="otp"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              // Only allow digits
              const digitsOnly = value.replace(/\D/g, "");
              if (digitsOnly !== value) {
                fieldApi.setValue(digitsOnly);
              }
            },
          }}
        >
          {(field) => (
            <field.TextField
              label={t("verification_code_label")}
              inputMode="numeric"
              maxLength={6}
              disabled={isSubmitting || isBusy}
              className="text-center text-2xl tracking-[0.4em]"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || isBusy}
        >
          {isSubmitting || isBusy ? t("verifying") : t("verify_code")}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="link"
            disabled={isResending || isBusy}
            onClick={() => {
              void onResend();
            }}
          >
            {t("resend_code")}
          </Button>
          <Button type="button" variant="link" onClick={onBack}>
            {t("back")}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface SetPasswordStepProps {
  onSetPassword: (newPassword: string) => void | Promise<void>;
  onBack: () => void;
  isBusy: boolean;
}

function SetPasswordStep({
  onSetPassword,
  onBack,
  isBusy,
}: SetPasswordStepProps) {
  const { t } = useTranslation();

  const form = useAppForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: setPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await onSetPassword(value.newPassword);
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="newPassword">
          {(field) => (
            <field.TextField
              label={t("new_password")}
              type="password"
              disabled={isSubmitting || isBusy}
            />
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => (
            <field.TextField
              label={t("confirm_password")}
              type="password"
              disabled={isSubmitting || isBusy}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || isBusy}
        >
          {isSubmitting || isBusy ? t("setting_password") : t("set_password")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          onClick={onBack}
        >
          {t("back")}
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      nationalId:
        typeof search.nationalId === "string" ? search.nationalId : undefined,
    };
  },
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const initialSearch = Route.useSearch();
  const { orpc } = useRouteContext({ from: "__root__" });
  const {
    session,
    isLoading: isAuthLoading,
    refetchSession,
  } = useBeneficiaryAuth();

  const [step, setStep] = useState<LoginStep>("identify");
  const [selectedNationalId, setSelectedNationalId] = useState<string | null>(
    initialSearch.nationalId ?? null,
  );
  const [maskedPhoneNumber, setMaskedPhoneNumber] = useState<string | null>(
    null,
  );
  const [otpCode, setOtpCode] = useState<string>("");

  const sendOtpMutation = useMutation(
    orpc.beneficiaryAuth.sendOTP.mutationOptions({
      onSuccess: (data) => {
        setMaskedPhoneNumber(data.phoneNumberMasked);
        // @ts-expect-error - Backend returns keys
        toast.success(t(data.message));
        if (data.devCode) {
          console.info("[DEV] OTP Code:", data.devCode);
        }
        setStep("otp");
      },
      onError: (error) => {
        // @ts-expect-error - Backend returns keys
        toast.error(t(error.message));
      },
    }),
  );

  const loginMutation = useMutation(
    orpc.beneficiaryAuth.login.mutationOptions({
      onSuccess: async () => {
        toast.success(t("logged_in_successfully"));
        await refetchSession();
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        // @ts-expect-error - Backend returns keys
        toast.error(t(error.message));
      },
    }),
  );

  const verifyOtpMutation = useMutation(
    orpc.beneficiaryAuth.verifyOTP.mutationOptions({
      onSuccess: () => {
        toast.success(t("otp_verified_successfully"));
        setStep("setPassword");
      },
      onError: (error) => {
        // @ts-expect-error - Backend returns keys
        toast.error(t(error.message));
      },
    }),
  );

  const setPasswordMutation = useMutation(
    orpc.beneficiaryAuth.verifyOTPAndSetPassword.mutationOptions({
      onSuccess: async (data) => {
        // @ts-expect-error - Backend returns keys
        toast.success(t(data.message));
        await refetchSession();
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        // @ts-expect-error - Backend returns keys
        toast.error(t(error.message));
      },
    }),
  );

  useEffect(() => {
    if (session) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  const isBusy =
    sendOtpMutation.isPending ||
    // loginMutation.isPending ||
    verifyOtpMutation.isPending ||
    setPasswordMutation.isPending;

  if (isAuthLoading || session) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">{t("loading")}</div>
      </main>
    );
  }

  const handleIdentifySuccess = async (data: {
    nationalId: string;
    nextStep: "password" | "setPassword" | "signup";
    phoneNumberMasked?: string | null;
  }) => {
    setSelectedNationalId(data.nationalId);
    setMaskedPhoneNumber(data.phoneNumberMasked ?? null);

    if (data.nextStep === "password") {
      setStep("password");
      return;
    }

    if (data.nextStep === "setPassword") {
      await sendOtpMutation.mutateAsync({ nationalId: data.nationalId });
      return;
    }

    // If nextStep is "signup", navigate to signup
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (data.nextStep === "signup") {
      toast.success(t("no_account_found_redirecting"));
      await navigate({
        to: "/signup",
        search: { nationalId: data.nationalId },
        replace: false,
      });
    }
  };

  const handlePasswordStepReady = () => {
    // This is called when password step should be ready
    // Currently no action needed, but kept for consistency
  };

  const handleLogin = async (password: string) => {
    if (!selectedNationalId) {
      toast.error(t("national_id_missing"));
      setStep("identify");
      return;
    }

    await loginMutation.mutateAsync({
      nationalId: selectedNationalId,
      password,
    });
  };

  const handleForgotPassword = async () => {
    if (!selectedNationalId) {
      toast.error(t("national_id_missing"));
      setStep("identify");
      return;
    }
    await sendOtpMutation.mutateAsync({
      nationalId: selectedNationalId,
    });
  };

  const handlePasswordBack = () => {
    setStep("identify");
    setSelectedNationalId(null);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!selectedNationalId) {
      toast.error(t("national_id_missing"));
      setStep("identify");
      return;
    }

    await verifyOtpMutation.mutateAsync({
      nationalId: selectedNationalId,
      code: otp,
    });
    setOtpCode(otp);
  };

  const handleResendOtp = async () => {
    if (!selectedNationalId) {
      toast.error(t("national_id_missing"));
      setStep("identify");
      return;
    }
    await sendOtpMutation.mutateAsync({
      nationalId: selectedNationalId,
    });
  };

  const handleOtpBack = () => {
    setStep("password");
  };

  const handleSetPassword = async (newPassword: string) => {
    if (!selectedNationalId) {
      toast.error(t("national_id_missing"));
      setStep("identify");
      return;
    }

    if (!otpCode) {
      toast.error(t("otp_required"));
      setStep("otp");
      return;
    }

    await setPasswordMutation.mutateAsync({
      nationalId: selectedNationalId,
      code: otpCode,
      newPassword,
    });
  };

  const handleSetPasswordBack = () => {
    setStep("otp");
  };

  return (
    <main className="bg-foreground flex min-h-screen justify-between gap-12 overflow-x-hidden px-8 py-4">
      <section className="relative flex w-full flex-col items-center justify-center gap-10">
        {/* Language Switcher */}
        <div className="absolute start-0 top-0">
          <LanguageSwitcher />
        </div>
        {/* Logo */}
        <SquareLogo className="size-40 text-white" />

        {/* Greeting */}
        <h2 className="text-background text-4xl font-normal">
          {t("good_to_see_you")}
        </h2>
        {/* Login Form */}
        {step === "identify" && (
          <IdentifyStep
            initialNationalId={initialSearch.nationalId}
            onSuccess={handleIdentifySuccess}
            onPasswordStepReady={handlePasswordStepReady}
            isBusy={isBusy}
          />
        )}

        {/* Other steps - shown in a card */}
        {(step === "password" || step === "otp" || step === "setPassword") && (
          <div className="bg-card w-full max-w-md space-y-6 rounded-3xl p-10 shadow-xl">
            {step === "password" && selectedNationalId && (
              <PasswordStep
                nationalId={selectedNationalId}
                onLogin={handleLogin}
                onForgotPassword={handleForgotPassword}
                onBack={handlePasswordBack}
                isBusy={isBusy}
              />
            )}
            {step === "otp" && selectedNationalId && (
              <OtpStep
                maskedPhoneNumber={maskedPhoneNumber}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={handleOtpBack}
                isBusy={isBusy}
                isResending={sendOtpMutation.isPending}
              />
            )}
            {step === "setPassword" && selectedNationalId && (
              <SetPasswordStep
                onSetPassword={handleSetPassword}
                onBack={handleSetPasswordBack}
                isBusy={isBusy}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
