import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@congress/api";

import { dashboardAuth } from "~/auth/server";
import {
  corsOptionsHandler,
  createHandlerWithCors,
} from "~/lib/cors-middleware";

const handler = createHandlerWithCors((req) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: dashboardAuth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  }),
);

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => corsOptionsHandler(request),
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
});
