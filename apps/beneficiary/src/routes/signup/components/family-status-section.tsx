import type { z } from "zod/v4";
import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import type { maritalStatusSchema } from "@congress/validators";
import { FieldGroup } from "@congress/ui/field";

type MaritalStatus = z.infer<typeof maritalStatusSchema>;

interface FamilyStatusSectionProps {
  form: AppForm;
}

export function FamilyStatusSection({ form }: FamilyStatusSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{t("family_status")}</h2>
      <FieldGroup className="gap-5">
        <form.AppField
          name="maritalStatus"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              const lastName = fieldApi.form.getFieldValue("lastName");
              if (value === "single") {
                fieldApi.form.setFieldValue("spouse", undefined);

                // Clear validation errors for spouse fields
                const spouseFields = [
                  "spouse",
                  "spouse.firstName",
                  "spouse.lastName",
                  "spouse.nationalId",
                  "spouse.phoneNumber",
                  "spouse.dateOfBirth",
                ] as const;
                for (const field of spouseFields) {
                  fieldApi.form.setFieldMeta(field, (meta) => ({
                    ...meta,
                    errors: [],
                    errorMap: {},
                    isTouched: false,
                    isValid: true,
                  }));
                }
              } else {
                const currentSpouse = fieldApi.form.getFieldValue("spouse");
                if (!currentSpouse) {
                  fieldApi.form.setFieldValue("spouse", {
                    nationalId: "",
                    firstName: "",
                    lastName: value === "divorced" ? "" : lastName,
                    phoneNumber: "",
                    dateOfBirth: "",
                  });
                }
              }
            },
          }}
        >
          {(field) => (
            <field.SelectField
              label={t("marital_status")}
              placeholder={t("select_marital_status")}
              options={[
                {
                  value: "single" as MaritalStatus,
                  label: t("status_single"),
                },
                {
                  value: "married" as MaritalStatus,
                  label: t("status_married"),
                },
                {
                  value: "divorced" as MaritalStatus,
                  label: t("status_divorced"),
                },
              ]}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <form.Subscribe
        selector={(state) => [
          (state.values as { maritalStatus: MaritalStatus }).maritalStatus,
          (
            state.values as {
              spouse: {
                nationalId: string;
                firstName: string;
                lastName: string;
              };
            }
          ).spouse,
        ]}
        children={([maritalStatus, spouse]) =>
          maritalStatus !== "single" && spouse ? (
            <div className="border-border space-y-4 rounded-xl border p-4">
              <h3 className="mb-4 text-base font-medium">
                {t("spouse_details")}
              </h3>
              <form.AppField name="spouse.firstName">
                {(field) => <field.TextField label={t("first_name")} />}
              </form.AppField>
              <form.AppField name="spouse.lastName">
                {(field) => <field.TextField label={t("last_name")} />}
              </form.AppField>
              <form.AppField name="spouse.nationalId">
                {(field) => <field.TextField label={t("national_id")} />}
              </form.AppField>
              <form.AppField name="spouse.phoneNumber">
                {(field) => (
                  <field.PhoneField
                    label={t("phone_number_optional")}
                    optional={true}
                    t={t}
                  />
                )}
              </form.AppField>
              <form.AppField name="spouse.dateOfBirth">
                {(field) => (
                  <field.DatePickerField label={t("date_of_birth")} />
                )}
              </form.AppField>
            </div>
          ) : null
        }
      />
    </section>
  );
}
