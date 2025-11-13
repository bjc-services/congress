import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_auth-layout")({
  component: AuthLayoutComponent,
});

function AuthLayoutComponent() {
  const { t } = useTranslation();

  return (
    <main className="bg-background flex min-h-screen">
      {/* Left side - Form Card */}
      <div className="flex flex-1 items-center justify-center px-4 pt-12">
        <div className="h-full w-full max-w-2xl">
          <Outlet />
        </div>
      </div>

      {/* Right side - Logo and Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:px-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <img
            src="/square-logo.svg"
            alt={t("beneficiary_logo_alt")}
            className="h-32 w-32"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">{t("organization_name")}</h1>
          </div>
        </div>
      </div>
    </main>
  );
}
