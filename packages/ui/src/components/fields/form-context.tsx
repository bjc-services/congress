import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { DatePickerField } from "./date-picker-field";
import { NumberField } from "./number-field";
import { PhoneField } from "./phone-field";
import { SelectField } from "./select-field";
import { TextField } from "./text-field";

// Export contexts for use in custom components
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Create the custom form hook with pre-bound field components
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    DatePickerField,
    PhoneField,
    NumberField,
    SelectField,
  },
  formComponents: {},
});
