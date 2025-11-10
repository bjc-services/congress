import type { DashboardAuth } from "@congress/auth";
import { initAuth } from "@congress/auth";

import { getBaseUrl } from "~/lib/url";
import { env } from "../env";

export const dashboardAuth = initAuth({
  baseUrl: getBaseUrl(),
  productionUrl: `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
  secret: env.AUTH_SECRET,
  extraPlugins: [],
}) as DashboardAuth;
