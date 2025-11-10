import { createFileRoute } from "@tanstack/react-router";

import { dashboardAuth } from "~/auth/server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => dashboardAuth.handler(request),
      POST: ({ request }) => dashboardAuth.handler(request),
    },
  },
});
