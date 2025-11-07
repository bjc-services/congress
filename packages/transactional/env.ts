import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function transactionalEnv() {
  return createEnv({
    server: {
      TWILIO_ACCOUNT_SID: z.string(),
      TWILIO_AUTH_TOKEN: z.string(),
      TWILIO_PHONE_NUMBER: z.string(),
      NODE_ENV: z.enum(["development", "production"]).optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
