import { useTranslation } from "react-i18next";

import { withFieldGroup } from "./form-context";

interface ChildFields {
  firstName: string;
  lastName?: string;
  nationalId: string;
  dateOfBirth: string;
}

const defaultValues: ChildFields = {
  firstName: "",
  lastName: "",
  nationalId: "",
  dateOfBirth: "",
};

export const ChildrenFieldsGroup = withFieldGroup({
  defaultValues,
  props: {
    childNumber: 1,
  },
  render: function Render({ group, childNumber }) {
    const { t } = useTranslation();
    return (
      <div className="border-border space-y-4 rounded-xl border p-4">
        <h3 className="text-muted-foreground mb-4 text-sm font-medium uppercase">
          {t("child_number_label", { number: childNumber })}
        </h3>
        <group.AppField name="firstName">
          {(field) => <field.TextField label={t("first_name")} />}
        </group.AppField>
        <group.AppField name="lastName">
          {(field) => <field.TextField label={t("last_name")} readOnly />}
        </group.AppField>
        <group.AppField name="nationalId">
          {(field) => <field.TextField label={t("national_id")} />}
        </group.AppField>
        <group.AppField name="dateOfBirth">
          {(field) => <field.DatePickerField label={t("date_of_birth")} />}
        </group.AppField>
      </div>
    );
  },
});
