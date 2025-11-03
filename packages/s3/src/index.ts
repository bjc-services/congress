import { randomUUID } from "node:crypto";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { s3Env } from "../env";

const env = s3Env();

// Minimal, typed MIME lookup to avoid untyped dependency issues
function getMimeTypeFromFileName(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "txt":
      return "text/plain";
    case "svg":
      return "image/svg+xml";
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    default:
      return undefined;
  }
}

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  useAccelerateEndpoint: true,
});

export async function deleteFileFromS3(key: string | string[]) {
  const keys = Array.isArray(key) ? key : [key];
  if (keys.length === 0) {
    throw new Error("No keys provided");
  }

  try {
    const command = new DeleteObjectsCommand({
      Bucket: env.AWS_S3_BUCKET,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    const response = await s3.send(command);
    console.log("File deleted successfully", response);
    return response;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
}

interface UploadToS3Params {
  file: Buffer | Uint8Array | Blob;
  fileName: string;
  folder?: string;
  contentType?: string;
}

interface UploadToS3Result {
  key: string;
  url: string;
}

/**
 * Uploads a file to S3 and returns its accessible URL.
 *
 * @param params.file - The file data (Buffer, Uint8Array, or Blob)
 * @param params.fileName - The name of the file (including extension)
 * @param params.folder - Optional S3 subfolder path
 * @param params.contentType - Optional content type (auto-detected if omitted)
 */
export async function uploadToS3({
  file,
  fileName,
  folder,
  contentType,
}: UploadToS3Params): Promise<UploadToS3Result> {
  const randomizedFileName = `${randomUUID()}/${fileName}`;
  const key = folder ? `${folder}/${randomizedFileName}` : randomizedFileName;
  const bucketName = env.AWS_S3_BUCKET;

  const lookedUp = getMimeTypeFromFileName(fileName);
  const resolvedContentType: string =
    contentType ?? lookedUp ?? "application/octet-stream";

  // Upload the file
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: resolvedContentType,
  });

  await s3.send(command);

  // Return public URL or presigned URL
  const url = `https://${bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
}
