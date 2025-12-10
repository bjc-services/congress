import type { TFunction } from "i18next";
import { useStore } from "@tanstack/react-form";

import { Field, FieldError } from "../field";
import { PhoneInput } from "../phone-input";
import { FloatingField } from "./floating-field";
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
      <FloatingField
        label={
          optional
            ? `${label} ${`(${t("optional")})`}`
            : label
        }
        filled={Boolean(field.state.value)}
      >
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
          placeholder={" "}
        />
      </FloatingField>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
