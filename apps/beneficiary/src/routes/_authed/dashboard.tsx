import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

export const Route = createFileRoute("/_authed/dashboard")({
  component: Dashboard,
});

function getGreeting(t: TFunction, firstName: string) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return t("good_morning", { firstName });
  } else if (hour >= 12 && hour < 17) {
    return t("good_noon", { firstName });
  } else {
    return t("good_evening", { firstName });
  }
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "approved":
    case "payment_approved":
      return "bg-green-100 text-green-800 border-green-300";
    case "pending_review":
    case "pending_documents":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-300";
    case "draft":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "committee_review":
      return "bg-purple-100 text-purple-800 border-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function Dashboard() {
  const { session } = useBeneficiaryAuth();
  const { t } = useTranslation();
  const { orpc } = useRouteContext({ from: "__root__" });

  const { data: applications, isLoading: applicationsLoading } = useQuery(
    orpc.application.list.queryOptions({ input: { activeOnly: true } }),
  );

  if (!session) {
    return (
      <main className="container flex h-screen items-center justify-center py-16">
        <div>{t("loading")}</div>
      </main>
    );
  }

  const firstName = session.person.firstName || "";

  return (
    <main className="container py-16">
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          {firstName && (
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {getGreeting(t, session.person.firstName ?? "")}
            </h1>
          )}
        </div>
        {session.account.status === "pending" && (
          <div className="w-full max-w-2xl rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-semibold">{t("account_pending_verification")}</p>
            <p className="text-sm">{t("account_pending_message")}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">
            {t("my_applications")}
          </h2>
          {applicationsLoading ? (
            <div className="text-gray-600">{t("loading")}</div>
          ) : applications && applications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <div
                  key={app.application.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.program.name || t("program")}
                      </h3>
                      {app.program.versionName && (
                        <p className="mt-1 text-sm text-gray-600">
                          {app.program.versionName}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeColor(app.application.status)}`}
                    >
                      {t(`application_status_${app.application.status}`)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
                    {app.application.timeSubmitted && (
                      <p className="text-gray-600">
                        <span className="font-medium">{t("submitted")}:</span>{" "}
                        {formatDate(app.application.timeSubmitted)}
                      </p>
                    )}
                    {app.application.timeReviewed && (
                      <p className="text-gray-600">
                        <span className="font-medium">{t("reviewed")}:</span>{" "}
                        {formatDate(app.application.timeReviewed)}
                      </p>
                    )}
                    {app.application.timeApproved && (
                      <p className="text-gray-600">
                        <span className="font-medium">{t("approved")}:</span>{" "}
                        {formatDate(app.application.timeApproved)}
                      </p>
                    )}
                    {app.application.rejectionReason && (
                      <p className="text-red-600">
                        <span className="font-medium">
                          {t("rejection_reason")}:
                        </span>{" "}
                        {app.application.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-gray-600">{t("no_applications_found")}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
