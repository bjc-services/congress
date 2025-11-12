import { randomUUID } from "node:crypto";
import type { PresignedPostOptions } from "@aws-sdk/s3-presigned-post";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

import { env } from "../env";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

interface GeneratePresignedUploadUrlInput {
  /**
   * The bucket to upload the file to. If not provided,
   * the default bucket will be used specified in the environment variables.
   */
  bucket?: string;
  /**
   * The key to upload the file to. If not provided, a random uuid will be generated.
   */
  key?: string;
  /**
   * The maximum upload size in bytes.
   * 1024 = 1KB
   * 5242880 = 5MB
   */
  maxUploadSizeInBytes: number;
  /**
   * The metadata to upload the file with.
   */
  metadata?: Record<string, string>;
  /**
   * The number of seconds before the presigned url expires.
   * @default 3600
   */
  expiresIn?: number;

  /**
   * The MD5 hash of the file, if provided it will be used to validate the file integrity.
   */
  md5HashOfTheFile?: string;

  /**
   * The content type of the file (starts with).
   * for example:
   * "image/" => "image/jpg, image/png, image/gif"
   * "application/pdf"
   */
  contentType?: string;
}

export const generatePresignedUploadUrl = async ({
  bucket = env.AWS_BUCKET_NAME,
  key = randomUUID(),
  maxUploadSizeInBytes,
  metadata = {},
  expiresIn = 3600,
  md5HashOfTheFile,
  contentType,
}: GeneratePresignedUploadUrlInput) => {
  const conditions: PresignedPostOptions["Conditions"] = [
    { bucket },
    { key },
    ["content-length-range", 1024, maxUploadSizeInBytes],
  ];
  const fields: PresignedPostOptions["Fields"] = {
    ...metadata,
  };

  if (contentType) {
    conditions.push(["starts-with", "#Content-Type", contentType]);
  }

  if (md5HashOfTheFile) {
    conditions.push({ "Content-MD5": md5HashOfTheFile });
    fields["Content-MD5"] = md5HashOfTheFile;
  }

  const { url, fields: createdFields } = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: key,
    Conditions: conditions,
    Fields: fields,
    Expires: expiresIn,
  });

  return {
    objectUrl: `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
    storageKey: key,
    bucket: bucket,
    contentType: contentType,
    fileSize: maxUploadSizeInBytes,
    base64Md5Hash: md5HashOfTheFile,
    expiresIn: expiresIn,
    md5HashOfTheFile: md5HashOfTheFile,
    url,
    fields: createdFields,
  };
};

export function sanitizeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/^-+|-+$/g, "");
}

export async function deleteObject(bucket: string, key: string) {
  return await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
