import { useTranslation } from "react-i18next";

import { Button } from "@congress/ui/button";
import { AppForm } from "@congress/ui/fields";

import type { DisclaimerState } from "../../signup";
import { DisclaimerCheckbox } from "./chckebox";

interface SignupFormActionsProps {
  form: AppForm;
  disclaimers: DisclaimerState;
  setDisclaimers: (disclaimers: DisclaimerState) => void;
}

export function SignupFormActions({
  form,
  disclaimers,
  setDisclaimers,
}: SignupFormActionsProps) {
  const { t } = useTranslation();

  const allDisclaimersChecked =
    disclaimers.disclaimerStatement1 &&
    disclaimers.disclaimerStatement2 &&
    disclaimers.disclaimerStatement3;  

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-red-400">{t("checkbox_required")}</p>
        <DisclaimerCheckbox
          name="disclaimerStatement1"
          label={t("signup_disclaimer_statement_1")}
          checked={disclaimers.disclaimerStatement1}
          setChecked={(checked) =>
            setDisclaimers({
              ...disclaimers,
              disclaimerStatement1: checked,
            })
          }
        />
        <DisclaimerCheckbox
          name="disclaimerStatement2"
          label={t("signup_disclaimer_statement_2")}
          checked={disclaimers.disclaimerStatement2}
          setChecked={(checked) =>
            setDisclaimers({
              ...disclaimers,
              disclaimerStatement2: checked,
            })
          }
        />
        <DisclaimerCheckbox
          name="disclaimerStatement3"
          label={t("signup_disclaimer_statement_3")}
          checked={disclaimers.disclaimerStatement3}
          setChecked={(checked) =>
            setDisclaimers({
              ...disclaimers,
              disclaimerStatement3: checked,
            })
          }
        />
      </div>
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          isValidating: state.isValidating,
          errors: state.errors,
          errorMap: state.errorMap,
        })}
        children={(formState) => {
          return (
            <>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  !formState.canSubmit || !allDisclaimersChecked || formState.isSubmitting
                }
              >
                {formState.isSubmitting ? t("sending_verification_code") : t("continue")}
              </Button>
              {!formState.canSubmit && (
                <div className="text-destructive text-center text-xs">
                  {t("form_data_missing")}
                </div>
              )}
            </>
          );
        }}
      />
    </section>
  );
}
