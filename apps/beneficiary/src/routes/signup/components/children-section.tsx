import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import { FieldGroup } from "@congress/ui/field";
import { ChildrenFieldsGroup } from "@congress/ui/fields";

interface ChildrenSectionProps {
  form: AppForm;
}

export function ChildrenSection({ form }: ChildrenSectionProps) {
  const { t } = useTranslation();

  return (
    <form.Subscribe
      selector={(state) => [
        (state.values as { maritalStatus: string }).maritalStatus,
      ]}
      children={([maritalStatus]) => {
        if (maritalStatus === "single") {
          return null;
        }

        return (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">{t("children_information")}</h2>
            <FieldGroup>
              <form.AppField
                name="childrenCount"
                listeners={{
                  onChange: ({ value, fieldApi }) => {
                    const currentChildren = fieldApi.form.getFieldValue(
                      "children",
                    ) as {
                      firstName: string;
                      lastName: string;
                      nationalId: string;
                      dateOfBirth: string;
                    }[];

                    const targetCount = value as number;
                    const lastName = fieldApi.form.getFieldValue(
                      "lastName",
                    ) as string;

                    if (currentChildren.length < targetCount) {
                      // Add new children
                      const diff = targetCount - currentChildren.length;
                      const newChildren = [...currentChildren];
                      for (let i = 0; i < diff; i++) {
                        newChildren.push({
                          firstName: "",
                          lastName,
                          nationalId: "",
                          dateOfBirth: "",
                        });
                      }
                      fieldApi.form.setFieldValue("children", newChildren);
                    } else if (currentChildren.length > targetCount) {
                      // Remove excess children
                      fieldApi.form.setFieldValue(
                        "children",
                        currentChildren.slice(0, targetCount),
                      );
                    }
                  },
                }}
              >
                {(field) => (
                  <field.NumberField
                    label={t("number_of_children")}
                    min={0}
                    max={20}
                  />
                )}
              </form.AppField>
            </FieldGroup>
            <form.AppField name="children" mode="array">
              {(field) => (
                <form.Subscribe
                  selector={(state) =>
                    (state.values as { childrenCount: number }).childrenCount
                  }
                  children={(childrenCount) => {
                    const count =
                      typeof childrenCount === "number" ? childrenCount : 0;
                    return (
                      <div className="space-y-4">
                        {(
                          field.state.value as {
                            firstName: string;
                            lastName: string;
                            nationalId: string;
                            dateOfBirth: string;
                          }[]
                        ).map((_, index) => (
                          <ChildrenFieldsGroup
                            key={index}
                            form={form}
                            fields={`children[${index}]` as never}
                            childNumber={index + 1}
                          />
                        ))}
                        {count > 0 &&
                          (
                            field.state.value as {
                              firstName: string;
                              lastName: string;
                              nationalId: string;
                              dateOfBirth: string;
                            }[]
                          ).length !== count && (
                            <p className="text-destructive text-sm">
                              {t("children_mismatch_hint")}
                            </p>
                          )}
                      </div>
                    );
                  }}
                />
              )}
            </form.AppField>
          </section>
        );
      }}
    />
  );
}
