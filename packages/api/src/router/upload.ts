import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { createID, eq } from "@congress/db";
import { db } from "@congress/db/client";
import { DocumentType, Upload } from "@congress/db/schema";
import {
  deleteObject,
  generatePresignedUploadUrl,
  sanitizeKey,
} from "@congress/s3";

import { publicProcedure } from "../trpc";

export const uploadRouter = {
  requestUploadUrl: publicProcedure({ captcha: false })
    .input(
      z.object({
        documentTypeId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        base64Md5Hash: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mime = await import("mime-types");
      const typeis = await import("type-is");

      return await db.transaction(async (tx) => {
        const uploadId = createID("upload");

        const documentType = await tx.query.DocumentType.findFirst({
          where: eq(DocumentType.id, input.documentTypeId),
        });

        if (!documentType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "unknown_document_type",
          });
        }

        // validate file size
        if (input.fileSize > documentType.maxFileSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "file_size_too_large",
          });
        }

        // validate file type
        const mimeType = mime.lookup(input.fileName);
        const extension = mime.extension(mimeType || "");
        if (!mimeType || !extension) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid_file_type",
          });
        }
        const isAllowed = typeis.is(mimeType, documentType.allowedFileTypes);
        if (!isAllowed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid_file_type",
          });
        }

        const signedResponse = await generatePresignedUploadUrl({
          key: `uploads/${ctx.session?.user.id ?? "anonymous"}/${documentType.id}/${uploadId}-${sanitizeKey(input.fileName)}/${documentType.name}.${extension}`,
          maxUploadSizeInBytes: input.fileSize,
          metadata: {
            originalFileName: input.fileName,
          },
          md5HashOfTheFile: input.base64Md5Hash,
          contentType: mimeType,
          expiresIn: 60 * 5, // 5 minutes
        });

        await tx.insert(Upload).values({
          id: uploadId,
          originalFileName: input.fileName,
          contentType: mimeType,
          fileSize: input.fileSize,
          base64Md5Hash: input.base64Md5Hash,
          bucket: signedResponse.bucket,
          storageKey: signedResponse.storageKey,
          uploadedByUserId: ctx.session?.user.id,
          uploadedByBeneficiaryAccountId: ctx.beneficiarySession?.accountId,
          objectUrl: signedResponse.objectUrl,
          public: false,
          status: "pending",
        });

        return {
          url: signedResponse.url,
          fields: signedResponse.fields,
          uploadId: uploadId,
        };
      });
    }),
  cancelUpload: publicProcedure({ captcha: false })
    .input(z.object({ uploadId: z.string() }))
    .mutation(async ({ input }) => {
      const [upload] = await db
        .update(Upload)
        .set({ status: "cancelled" })
        .where(eq(Upload.id, input.uploadId))
        .returning();

      if (upload) {
        await deleteObject(upload.bucket, upload.storageKey);
      } else {
        console.warn(
          "Attempted to cancel upload that does not exist",
          input.uploadId,
        );
      }

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
