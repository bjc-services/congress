import { trpcServer } from "@hono/trpc-server"; // Deno 'npm:@hono/trpc-server'

import { Hono } from "hono";
import { cors } from "hono/cors";

import { dashboardAuth } from "./dashboard-auth";
import { isProd } from "./is-prod";
import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

const prodOrigins = ["https://app.bucharim.com", "https://my.bucharim.com"];
const devOrigins = ["http://localhost:3001", "http://localhost:3002"];

const app = new Hono();

app.use(
  "/api/auth/*", // or replace with "*" to enable cors for all routes
  cors({
    origin: isProd ? prodOrigins : devOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/auth/*", (c) => {
  return dashboardAuth.handler(c.req.raw);
});

app.use(
  "/trpc/*",
  cors({
    origin: isProd ? prodOrigins : devOrigins,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "trpc-accept",
      "x-trpc-source",
    ],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH", "HEAD"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
  trpcServer({
    router: appRouter,
    createContext(_, c) {
      return createTRPCContext({
        auth: dashboardAuth,
        headers: c.req.raw.headers,
      });
    },
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  }),
);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
