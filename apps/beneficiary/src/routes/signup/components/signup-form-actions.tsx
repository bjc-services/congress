import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import { Button } from "@congress/ui/button";

interface SignupFormActionsProps {
  form: AppForm;
}

export function SignupFormActions({ form }: SignupFormActionsProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-3">
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? t("sending_verification_code") : t("continue")}
          </Button>
        )}
      />
      <p className="text-muted-foreground text-center text-xs">
        {t("signup_disclaimer")}
      </p>
    </section>
  );
}
