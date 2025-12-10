import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import type { AppForm } from "@congress/ui/fields";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { useAppForm } from "@congress/ui/fields";
import { Input } from "@congress/ui/input";
import { orpc } from "@congress/ui/orpc";
import { toast } from "@congress/ui/toast";
import { passwordSchema } from "@congress/validators";

const passwordStepSchema = z
  .object({
    password: passwordSchema,
  })
interface PasswordStepProps {
  setStep: (step: "form" | "otp" | "password") => void;
  setPassword: (password: string) => void;
  nationalId: string;
  personalPhoneNumber: string;
}

export function PasswordStep({
  setStep,
  setPassword,
  nationalId,
  personalPhoneNumber,
}: PasswordStepProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const passwordForm = useAppForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: passwordStepSchema,
    },
    onSubmit: async ({ value }) => {
      // if (!formData) {
      //   toast.error(t("form_data_missing"));
      //   setStep("form");
      //   return;
      // }

      // Store password and send OTP
      setPassword(value.password);

      // Send OTP to phone number
      await sendSignupOtpMutation.mutateAsync({
        nationalId,
        phoneNumber: personalPhoneNumber,
      });
    },
  });

  const sendSignupOtpMutation = useMutation(
    orpc.beneficiaryAuth.sendSignupOTP.mutationOptions({
      onSuccess: (data) => {
        toast.success(t(data.message as any));
        setStep("otp");
      },
      onError: (error) => {
        toast.error(t(error.message as any));
      },
    }),
  );

  const onBack = () => {
    setStep("form");
    passwordForm.reset();
  };

  return (
    <passwordForm.Subscribe
      selector={(state) => state.isSubmitting}
      children={(isSubmitting) => {
        const isDisabled = isSubmitting || sendSignupOtpMutation.isPending;

        return (
          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await passwordForm.handleSubmit();
            }}
          >
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>{t("create_password_message")}</p>
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
                      <div className="relative">
                        <Input
                          id={field.name}
                          type={showPassword ? "text" : "password"}
                          value={field.state.value as string}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          disabled={isDisabled}
                          className="pe-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground absolute end-3 top-1/2 -translate-y-1/2"
                          tabIndex={-1}
                          aria-label={
                            showPassword
                              ? t("hide_password")
                              : t("show_password")
                          }
                        >
                          {showPassword ? (
                            <EyeOffIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </button>
                      </div>
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
                disabled={isDisabled}
              >
                {isSubmitting ? t("submitting") : t("continue")}
              </Button>
              <Button type="button" variant="link" onClick={onBack}>
                {t("back")}
              </Button>
            </div>
          </form>
        );
      }}
    />
  );
}

export { passwordStepSchema };
