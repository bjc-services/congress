import { useEffect } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@congress/ui/button";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { session, isLoading, signOut } = useBeneficiaryAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session && !isLoading) {
      console.log("redirecting to login", { session, isLoading });
      void navigate({
        to: "/login",
        search: { nationalId: undefined },
        replace: true,
      });
    }

    // if (session) {
    //   void navigate({ to: "/dashboard", replace: true });
    // }
  }, [isLoading, navigate, session]);

  // If no valid session, skip directly to login (don't wait for loading)
  // Show loading only if we have a session but it's still loading (shouldn't happen)
  if (!session) {
    return (
      <main className="bg-muted flex h-screen items-center justify-center">
        <div className="text-muted-foreground">{t("redirecting_to_login")}</div>
      </main>
    );
  }


  if (isLoading) {
    return (
      <main className="container flex h-screen items-center justify-center py-16">
        <div>{t("loading")}</div>
      </main>
    );
  }
  
  return <Navigate to="/dashboard" />;

  // User is authenticated, show dashboard
  // return (
  //   <main className="container h-screen py-16">
  //     <div className="flex flex-col gap-4">
  //       <div className="flex w-full items-center justify-between">
  //         <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
  //           {t("dashboard")}
  //         </h1>
  //         <Button
  //           variant="ghost"
  //           onClick={() => {
  //             void signOut();
  //           }}
  //         >
  //           {t("logout")}
  //         </Button>
  //       </div>
  //       {session.account.status === "pending" && (
  //         <div className="w-full max-w-2xl rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-800">
  //           <p className="font-semibold">{t("account_pending_verification")}</p>
  //           <p className="text-sm">{t("account_pending_message")}</p>
  //         </div>
  //       )}

  //       {/* Dashboard content will be added here */}
  //       <div className="w-full max-w-2xl">
  //         <p className="text-muted-foreground">
  //           {t("dashboard_welcome_message")}
  //         </p>
  //       </div>
  //     </div>
  //   </main>
  // );
}
