import { useStore } from "@tanstack/react-form";

import { Field, FieldError } from "../field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { FloatingField } from "./floating-field";
import { useFieldContext, useFormContext } from "./form-context";

interface SelectFieldOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  placeholder?: string;
  options: SelectFieldOption<T>[];
}

export function SelectField<T extends string>({
  label,
  placeholder,
  options,
}: SelectFieldProps<T>) {
  const field = useFieldContext<T>();
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FloatingField label={label} filled={!!field.state.value}>
        <Select
          value={field.state.value}
          disabled={isSubmitting}
          onValueChange={(value: T) => field.handleChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FloatingField>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
