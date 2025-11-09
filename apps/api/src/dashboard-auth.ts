import type { DashboardAuth } from "@congress/auth";
import { initAuth } from "@congress/auth";

import { isProd } from "./is-prod";

export const dashboardAuth = initAuth({
  baseUrl: isProd ? "https://api.bucharim.com/" : "http://localhost:3000",
  productionUrl: isProd ? "https://api.bucharim.com/" : "http://localhost:3000",
  secret: process.env.AUTH_SECRET,
  extraPlugins: [],
}) as DashboardAuth;
