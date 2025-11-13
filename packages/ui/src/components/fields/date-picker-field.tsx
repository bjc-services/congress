import { useStore } from "@tanstack/react-form";

import { DatePicker } from "../date-picker";
import { Field, FieldContent, FieldError, FieldLabel } from "../field";
import { useFieldContext, useFormContext } from "./form-context";

interface DatePickerFieldProps {
  label: string;
}

export function DatePickerField({ label }: DatePickerFieldProps) {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      </FieldContent>
      <DatePicker
        id={field.name}
        value={field.state.value}
        onChange={(date) => field.handleChange(date ?? "")}
        disabled={isSubmitting}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
