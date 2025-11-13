import { Field, FieldContent, FieldError, FieldLabel } from "../field";
import { Input } from "../input";
import { useFieldContext } from "./form-context";

interface TextFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
}

export function TextField({
  label,
  placeholder,
  type = "text",
  readOnly,
  className,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      </FieldContent>
      <Input
        id={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={className}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
