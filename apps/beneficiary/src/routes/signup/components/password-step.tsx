import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { useAppForm, type AppForm } from "@congress/ui/fields";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { passwordSchema } from "@congress/validators";
import { toast } from "@congress/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@congress/ui/orpc";

const passwordStepSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "passwords_do_not_match",
    path: ["confirmPassword"],
  });

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

  const passwordForm = useAppForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
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
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        disabled={isDisabled}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <passwordForm.Field
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
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        disabled={isDisabled}
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
                disabled={isDisabled}
              >
                {isSubmitting ? t("submitting") : t("submit_application")}
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
