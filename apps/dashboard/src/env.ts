import { createEnv } from "@t3-oss/env-core";
import { vercel } from "@t3-oss/env-core/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  clientPrefix: "VITE_",
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  client: {
    VITE_API_URL: z.url(),
  },
  server: {},
  runtimeEnv: import.meta.env,
  skipValidation:
    !!(typeof process !== "undefined" && process.env.CI) ||
    (typeof process !== "undefined" &&
      process.env.npm_lifecycle_event === "lint"),
});
