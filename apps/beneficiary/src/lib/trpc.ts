import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@congress/api/types";

import { env } from "~/env";
import { getAuthToken } from "./beneficiary-auth";

function getbeneficiaryAuthToken(): string | null {
  return getAuthToken();
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchStreamLink({
      transformer: SuperJSON,
      url: env.VITE_API_URL + "/trpc",
      headers() {
        const headers = new Headers();
        headers.set("x-trpc-source", "beneficiary-app");
        const token = getbeneficiaryAuthToken();
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    }),
  ],
});

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
