import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import { FieldGroup } from "@congress/ui/field";

import { calculateAge } from "../utils";

interface ApplicantDetailsSectionProps {
  form: AppForm;
  setIdCardFile: (file: undefined) => void;
  setIdAppendixFile: (file: undefined) => void;
}

export function ApplicantDetailsSection({
  form,
  setIdCardFile,
  setIdAppendixFile,
}: ApplicantDetailsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{t("applicant_details")}</h2>
      <FieldGroup className="gap-5">
        <form.AppField name="firstName">
          {(field) => <field.TextField label={t("first_name")} />}
        </form.AppField>
        <form.AppField
          name="lastName"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              // Update spouse lastName if spouse exists
              const spouse = fieldApi.form.getFieldValue("spouse");
              if (spouse) {
                fieldApi.form.setFieldValue("spouse", {
                  ...spouse,
                  lastName: value,
                });
              }
              // Update all children's lastName
              const children = fieldApi.form.getFieldValue("children") as {
                firstName: string;
                lastName: string;
                nationalId: string;
                dateOfBirth: string;
              }[];
              if (children.length > 0) {
                fieldApi.form.setFieldValue(
                  "children",
                  children.map((child) => ({
                    ...child,
                    lastName: value,
                  })),
                );
              }
            },
          }}
        >
          {(field) => <field.TextField label={t("last_name")} />}
        </form.AppField>
        <form.AppField name="nationalId">
          {(field) => (
            <field.TextField
              label={t("national_id")}
              readOnly
              tabIndex={-1}
              className="bg-muted"
            />
          )}
        </form.AppField>
        <form.AppField
          name="dateOfBirth"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              const age = calculateAge(value as string);
              if (Number.isNaN(age) || age < 16) {
                fieldApi.form.setFieldValue("identityCardUploadId", undefined);
                fieldApi.form.setFieldValue(
                  "identityAppendixUploadId",
                  undefined,
                );
                setIdCardFile(undefined);
                setIdAppendixFile(undefined);
              }
            },
          }}
        >
          {(field) => <field.DatePickerField label={t("date_of_birth")} />}
        </form.AppField>
        <form.AppField name="personalPhoneNumber">
          {(field) => (
            <field.PhoneField
              label={t("personal_phone_number")}
              optional={false}
              t={t}
            />
          )}
        </form.AppField>
        <form.AppField name="homePhoneNumber">
          {(field) => (
            <field.PhoneField
              label={t("home_phone_number")}
              optional={true}
              t={t}
            />
          )}
        </form.AppField>
      </FieldGroup>
    </section>
  );
}
