import { Button } from "@congress/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

export const Route = createFileRoute("/_authed/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session } = useBeneficiaryAuth();

  if (!session) {
    return (
      <main className="container flex h-screen items-center justify-center py-16">
        <div>{t("loading")}</div>
      </main>
    );
  }

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          {/* <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            {t("dashboard")}
          </h1> */}
          
        </div>
        {session.account.status === "pending" && (
          <div className="w-full max-w-2xl rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-semibold">{t("account_pending_verification")}</p>
            <p className="text-sm">{t("account_pending_message")}</p>
          </div>
        )}

        {/* Dashboard content will be added here */}
        {/* <div className="w-full max-w-2xl">
          <p className="text-muted-foreground">
            {t("dashboard_welcome_message")}
          </p>
        </div> */}
      </div>
    </main>
  );
}
