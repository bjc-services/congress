import { createEnv } from "@t3-oss/env-core";
import { vercel } from "@t3-oss/env-core/presets-zod";
import { z } from "zod/v4";

import { apiEnv } from "@congress/api/env";
import { transactionalEnv } from "@congress/transactional/env";

export const env = createEnv({
  clientPrefix: "VITE_",
  extends: [vercel(), apiEnv(), transactionalEnv()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  client: {
    VITE_API_URL: z.url(),
  },
  server: {
    BENEFICIARY_APP_URL: z.url(),
  },
  runtimeEnv: {
    ...import.meta.env,
    ...process.env,
  },
  skipValidation:
    !!(typeof process !== "undefined" && process.env.CI) ||
    (typeof process !== "undefined" &&
      process.env.npm_lifecycle_event === "lint"),
});
