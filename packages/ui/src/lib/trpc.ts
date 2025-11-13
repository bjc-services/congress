import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@congress/api";

import { getBaseUrl } from "../lib/url";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchStreamLink({
      transformer: SuperJSON,
      url: getBaseUrl() + "/api/trpc",
      headers() {
        const headers = new Headers();
        headers.set("x-trpc-source", "dashboard-app");
        return headers;
      },
    }),
  ],
});

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
