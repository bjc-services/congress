import type { Router } from "@better-upload/server";
import { handleRequest, route } from "@better-upload/server";
import { aws } from "@better-upload/server/clients";
import { createFileRoute } from "@tanstack/react-router";

const router: Router = {
  client: aws(),
  bucketName: "my-bucket",
  routes: {
    images: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 4,
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
