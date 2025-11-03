import type { Router } from "better-upload/server";
import { createFileRoute } from "@tanstack/react-router";
import { handleRequest, route } from "better-upload/server";

import { s3 } from "@acme/s3";

import { env } from "~/env";

const router: Router = {
  client: s3,
  bucketName: env.AWS_S3_BUCKET,
  routes: {
    signupDocuments: route({
      fileTypes: ["image/*", "application/pdf"],
      multipleFiles: true,
      maxFiles: 4,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    }),
  },
};

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return handleRequest(request, router);
      },
    },
  },
});
