import { useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { Label } from "@congress/ui/label";
import { toast } from "@congress/ui/toast";
import {
  beneficiaryIdLookupSchema,
  beneficiaryLoginSchema,
  passwordSchema,
} from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { trpcClient, useTRPC } from "~/lib/trpc";

type LoginStep = "identify" | "password" | "otp" | "setPassword";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "invalid_otp"),
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
  const trpc = useTRPC();
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
    trpc.beneficiaryAuth.sendOTP.mutationOptions({
      onSuccess: (data) => {
        setMaskedPhoneNumber(data.phoneNumberMasked);
        toast.success(data.message);
        if (data.devCode) {
          console.info("[DEV] OTP Code:", data.devCode);
        }
        setStep("otp");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const loginMutation = useMutation(
    trpc.beneficiaryAuth.login.mutationOptions({
      onSuccess: async () => {
        toast.success(t("logged_in_successfully"));
        await refetchSession();
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const verifyOtpMutation = useMutation(
    trpc.beneficiaryAuth.verifyOTP.mutationOptions({
      onSuccess: () => {
        toast.success(t("otp_verified_successfully"));
        setStep("setPassword");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const setPasswordMutation = useMutation(
    trpc.beneficiaryAuth.verifyOTPAndSetPassword.mutationOptions({
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

  useEffect(() => {
    if (session) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  const idForm = useForm({
    defaultValues: {
      nationalId: initialSearch.nationalId ?? "",
    },
    validators: {
      onSubmit: beneficiaryIdLookupSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          // Use trpcClient directly for SSR compatibility
          const result =
            await trpcClient.beneficiaryAuth.checkNationalId.mutate({
              nationalId: value.nationalId,
            });

          setSelectedNationalId(value.nationalId);

          if (!result.exists) {
            toast.success(t("no_account_found_redirecting"));
            await navigate({
              to: "/signup",
              search: { nationalId: value.nationalId },
              replace: false,
            });
            return;
          }

          setMaskedPhoneNumber(result.phoneNumberMasked ?? null);

          if (result.nextStep === "password") {
            passwordForm.reset();
            setStep("password");
            return;
          }

          if (result.nextStep === "setPassword") {
            await sendOtpMutation.mutateAsync({ nationalId: value.nationalId });
            return;
          }

          // If nextStep is "signup", navigate to signup
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (result.nextStep === "signup") {
            toast.success(t("no_account_found_redirecting"));
            await navigate({
              to: "/signup",
              search: { nationalId: value.nationalId },
              replace: false,
            });
          }
        } catch (error) {
          // Return field error to be handled by form
          return {
            fields: {
              nationalId:
                error instanceof Error
                  ? error.message || t("national_id_incorrect")
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

  const passwordForm = useForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: beneficiaryLoginSchema.pick({ password: true }),
    },
    onSubmit: async ({ value }) => {
      if (!selectedNationalId) {
        toast.error(t("national_id_missing"));
        setStep("identify");
        return;
      }

      await loginMutation.mutateAsync({
        nationalId: selectedNationalId,
        password: value.password,
      });
    },
  });

  const otpForm = useForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedNationalId) {
        toast.error(t("national_id_missing"));
        setStep("identify");
        return;
      }

      await verifyOtpMutation.mutateAsync({
        nationalId: selectedNationalId,
        code: value.otp,
      });
      setOtpCode(value.otp);
    },
  });

  const setPasswordForm = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: setPasswordSchema,
    },
    onSubmit: async ({ value }) => {
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
        newPassword: value.newPassword,
      });
    },
  });

  const idFormSubmitting = useStore(
    idForm.store,
    (state) => state.isSubmitting,
  );
  const passwordFormSubmitting = useStore(
    passwordForm.store,
    (state) => state.isSubmitting,
  );
  const otpFormSubmitting = useStore(
    otpForm.store,
    (state) => state.isSubmitting,
  );
  const setPasswordFormSubmitting = useStore(
    setPasswordForm.store,
    (state) => state.isSubmitting,
  );

  const isBusy =
    sendOtpMutation.isPending ||
    loginMutation.isPending ||
    verifyOtpMutation.isPending ||
    setPasswordMutation.isPending;

  if (isAuthLoading || session) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">{t("loading")}</div>
      </main>
    );
  }

  return (
    <main className="bg-background flex min-h-screen justify-between gap-12 overflow-x-hidden px-4 py-12">
      <section className="flex w-full flex-col items-center justify-center gap-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src="/square-logo.svg"
            alt={t("beneficiary_logo_alt")}
            className="size-48"
          />
        </div>

        {/* Greeting */}
        <h2 className="text-4xl font-normal">{t("good_to_see_you")}</h2>
        {/* Login Form */}
        {step === "identify" && (
          <form
            className="flex w-full max-w-sm flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              void idForm.handleSubmit();
            }}
          >
            <idForm.Field
              name="nationalId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>{t("national_id")}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      autoComplete="off"
                      placeholder={t("enter_national_id")}
                      aria-invalid={isInvalid}
                      disabled={idFormSubmitting || isBusy}
                      className="border-foreground text-center"
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors.map((error) =>
                          typeof error === "string"
                            ? { message: error }
                            : error?.message
                              ? { message: error.message }
                              : undefined,
                        )}
                        className="text-center"
                      />
                    )}
                  </div>
                );
              }}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={idFormSubmitting || isBusy}
            >
              {idFormSubmitting ? t("checking") : t("login")}
            </Button>
          </form>
        )}
        {/* Other steps - shown in a card */}
        {(step === "password" || step === "otp" || step === "setPassword") && (
          <div className="bg-card w-full max-w-md space-y-6 rounded-3xl p-10 shadow-xl">
            {step === "password" && (
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void passwordForm.handleSubmit();
                }}
              >
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    {t("login_national_id_label", { id: selectedNationalId })}
                  </p>
                </div>
                <FieldGroup>
                  <passwordForm.Field
                    name="password"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              {t("password")}
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder={t("enter_your_password")}
                            disabled={passwordFormSubmitting || isBusy}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={passwordFormSubmitting || isBusy}
                  >
                    {passwordFormSubmitting || isBusy
                      ? t("logging_in")
                      : t("login")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    disabled={sendOtpMutation.isPending || isBusy}
                    onClick={() => {
                      if (!selectedNationalId) {
                        toast.error(t("national_id_missing"));
                        setStep("identify");
                        return;
                      }
                      void sendOtpMutation.mutateAsync({
                        nationalId: selectedNationalId,
                      });
                    }}
                  >
                    {t("forgot_password")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => {
                      setStep("identify");
                      idForm.reset();
                      passwordForm.reset();
                      setSelectedNationalId(null);
                    }}
                  >
                    {t("back")}
                  </Button>
                </div>
              </form>
            )}
            {step === "otp" && (
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void otpForm.handleSubmit();
                }}
              >
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    {maskedPhoneNumber
                      ? t("otp_sent_message", {
                          phoneNumber: maskedPhoneNumber,
                        })
                      : t("otp_sent_message_no_phone")}
                  </p>
                </div>
                <FieldGroup>
                  <otpForm.Field
                    name="otp"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              {t("verification_code_label")}
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id={field.name}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(
                                event.target.value.replace(/\D/g, ""),
                              )
                            }
                            placeholder="000000"
                            className="text-center text-2xl tracking-[0.4em]"
                            disabled={
                              otpFormSubmitting ||
                              isBusy ||
                              verifyOtpMutation.isPending
                            }
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={otpFormSubmitting || isBusy}
                  >
                    {otpFormSubmitting || isBusy
                      ? t("verifying")
                      : t("verify_code")}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <Button
                      type="button"
                      variant="link"
                      disabled={sendOtpMutation.isPending || isBusy}
                      onClick={() => {
                        if (!selectedNationalId) {
                          toast.error(t("national_id_missing"));
                          setStep("identify");
                          return;
                        }
                        void sendOtpMutation.mutateAsync({
                          nationalId: selectedNationalId,
                        });
                      }}
                    >
                      {t("resend_code")}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setStep("password");
                        otpForm.reset();
                      }}
                    >
                      {t("back")}
                    </Button>
                  </div>
                </div>
              </form>
            )}
            {step === "setPassword" && (
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void setPasswordForm.handleSubmit();
                }}
              >
                <FieldGroup>
                  <setPasswordForm.Field
                    name="newPassword"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              {t("new_password")}
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder={t("enter_new_password")}
                            disabled={setPasswordFormSubmitting || isBusy}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <setPasswordForm.Field
                    name="confirmPassword"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                              {t("confirm_password")}
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder={t("confirm_new_password")}
                            disabled={setPasswordFormSubmitting || isBusy}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={setPasswordFormSubmitting || isBusy}
                  >
                    {setPasswordFormSubmitting || isBusy
                      ? t("setting_password")
                      : t("set_password")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => {
                      setStep("otp");
                      setPasswordForm.reset();
                    }}
                  >
                    {t("back")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
