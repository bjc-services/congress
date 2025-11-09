import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { createID } from "@congress/db";
import { db } from "@congress/db/client";

const database = drizzleAdapter(db, {
  provider: "pg",
});

const devOrigins = ["http://localhost:3001", "http://localhost:3002"];
const prodOrigins = ["https://app.bucharim.com", "https://my.bucharim.com"];

// eslint-disable-next-line no-restricted-properties
const isProd = process.env.NODE_ENV === "production";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      sendResetPassword: async ({ user, url }) => {
        console.log("sendResetPassword", user, url);
        return Promise.reject(new Error("Not implemented"));
      },
    },
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [admin()],
    advanced: {
      database: {
        generateId: ({ model }) => {
          switch (model) {
            case "user":
              return createID("user");
            case "session":
              return createID("session");
            case "account":
              return createID("account");
            case "verification":
              return createID("verification");
            default:
              throw new Error(`Unsupported model: ${model}`);
          }
        },
      },
    },
    trustedOrigins: isProd ? prodOrigins : devOrigins,
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type DashboardAuth = ReturnType<typeof initAuth>;
export type DashboardSession = DashboardAuth["$Infer"]["Session"];
