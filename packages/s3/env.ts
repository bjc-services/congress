import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function s3Env() {
  return createEnv({
    server: {
      AWS_REGION: z.string(),
      AWS_ACCESS_KEY_ID: z.string(),
      AWS_SECRET_ACCESS_KEY: z.string(),
      AWS_S3_BUCKET: z.string(),
      NODE_ENV: z.enum(["development", "production"]).optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
