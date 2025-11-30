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
import { Input } from "@congress/ui/input";
import { passwordSchema } from "@congress/validators";

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
  passwordForm: AppForm;
  onBack: () => void;
  isBusy: boolean;
}

export function PasswordStep({
  passwordForm,
  onBack,
  isBusy,
}: PasswordStepProps) {
  const { t } = useTranslation();

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
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={
                    passwordForm.state.isSubmitting || isBusy
                  }
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={
                    passwordForm.state.isSubmitting || isBusy
                  }
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
          disabled={passwordForm.state.isSubmitting || isBusy}
        >
          {passwordForm.state.isSubmitting
            ? t("submitting")
            : t("submit_application")}
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onBack}
        >
          {t("back")}
        </Button>
      </div>
    </form>
  );
}

export { passwordStepSchema };

