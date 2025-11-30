import { useTranslation } from "react-i18next";

export function SignupHeader() {
  const { t } = useTranslation();

  return (
    <header className="flex flex-row items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{t("signup_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("signup_subtitle")}</p>
      </div>
    </header>
  );
}
