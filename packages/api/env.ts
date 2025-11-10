import { createEnv } from "@t3-oss/env-core";
import { vercel } from "@t3-oss/env-core/presets-zod";
import { z } from "zod/v4";

export const apiEnv = () => {
  return createEnv({
    extends: [vercel()],
    clientPrefix: "__", // https://github.com/t3-oss/t3-env/issues/151
    client: {},
    server: {
      NODE_ENV: z.enum(["development", "production"]).optional(),
      POSTGRES_URL: z.url(),
      AUTH_SECRET: z.string().min(1),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
};

export const env = apiEnv();
