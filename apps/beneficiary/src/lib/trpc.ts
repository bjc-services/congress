import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@congress/api";

import { env } from "~/env";

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
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include", // Include cookies in requests
        });
      },
      headers() {
        const headers = new Headers();
        headers.set("x-trpc-source", "beneficiary-app");
        return headers;
      },
    }),
  ],
});

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
