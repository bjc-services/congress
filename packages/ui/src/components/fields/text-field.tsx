import { useState } from "react";

import type { InputProps } from "../input";
import { Field, FieldError } from "../field";
import { Input } from "../input";
import { FloatingField } from "./floating-field";
import { useFieldContext } from "./form-context";

interface TextFieldProps extends InputProps {
  label: string;

  /**
   * The label is the placeholder, and is floated when the input is not empty, or when the input is focused.
   * The placeholder prop will only be shown when the label is floating.
   */
  placeholder?: string;

  /**
   * display error message below the field
   * @default true
   */
  displayError?: boolean;
}

export function TextField({
  label,
  type = "text",
  variant,
  align,
  displayError = true,
  placeholder: placeholderProp,
  ...props
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = Boolean(field.state.value);
  const isLabelFloating = isFocused || hasValue;

  // When label is not floating, use space for CSS :placeholder-shown detection
  // When label is floating, show the provided placeholder (or space if none provided)
  const placeholder = isLabelFloating ? (placeholderProp ?? " ") : " ";

  return (
    <Field data-invalid={isInvalid} className="gap-1">
      <FloatingField label={label} variant={variant} align={align}>
        <Input
          id={field.name}
          type={type}
          value={field.state.value}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            field.handleBlur();
            props.onBlur?.(event);
          }}
          placeholder={placeholder}
          variant={variant}
          align={align}
          onChange={(event) => field.handleChange(event.target.value)}
          {...props}
        />
      </FloatingField>
      {displayError && isInvalid && (
        <FieldError errors={field.state.meta.errors} variant={variant} />
      )}
    </Field>
  );
}
