import { Field, FieldContent, FieldError, FieldLabel } from "../field";
import { Input } from "../input";
import { useFieldContext } from "./form-context";

interface NumberFieldProps {
  label: string;
  min?: number;
  max?: number;
}

export function NumberField({ label, min, max }: NumberFieldProps) {
  const field = useFieldContext<number>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      </FieldContent>
      <Input
        id={field.name}
        type="number"
        value={field.state.value}
        min={min}
        max={max}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const nextValue = Number.isNaN(event.target.valueAsNumber)
            ? 0
            : event.target.valueAsNumber;
          field.handleChange(nextValue);
        }}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
