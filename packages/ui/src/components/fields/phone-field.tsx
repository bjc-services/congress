import type { TFunction } from "i18next";
import { useStore } from "@tanstack/react-form";

import { Field, FieldContent, FieldError, FieldLabel } from "../field";
import { PhoneInput } from "../phone-input";
import { useFieldContext, useFormContext } from "./form-context";

interface PhoneFieldProps {
  label: string;
  optional?: boolean;
  t: TFunction;
}

export function PhoneField({ label, optional = false, t }: PhoneFieldProps) {
  const field = useFieldContext<string | undefined>();
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>
          {label}
          {optional && (
            <span className="text-muted-foreground ml-1 text-xs">
              ({field.state.meta.isTouched ? "" : t("optional")})
            </span>
          )}
        </FieldLabel>
      </FieldContent>
      <PhoneInput
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(value: string | undefined) =>
          field.handleChange(value ?? "")
        }
        onBlur={field.handleBlur}
        disabled={isSubmitting}
        defaultCountry="IL"
        fixedCountry="IL"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
