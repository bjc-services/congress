"use client";

import { useCallback, useState } from "react";
import { fileTypeFromBuffer } from "file-type";
import { FileIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import SparkMD5 from "spark-md5";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { Spinner } from "./spinner";

export interface UploadedFile {
  uploadId: string;
  fileName: string;
  fileSize: number;
  objectUrl?: string;
}

export interface DocumentUploadProps {
  /**
   * Document type ID for validation
   */
  documentTypeId: string;
  /**
   * Maximum number of files allowed
   */
  maxFiles: number;
  /**
   * Maximum file size in bytes
   */
  maxSize: number;
  /**
   * Allowed file types (MIME types or extensions)
   * e.g., ["image/*", "application/pdf"]
   */
  allowedFileTypes: string[];
  /**
   * Function to get presigned URL from the API
   * Should return { url: string, fields: Record<string, string>, uploadId: string }
   */
  getPresignedUrl: (params: {
    documentTypeId: string;
    fileName: string;
    fileSize: number;
    base64Md5Hash: string;
    contentType: string;
  }) => Promise<{
    url: string;
    fields: Record<string, string>;
    uploadId: string;
  }>;
  /**
   * Function to handle file deletion
   */
  onFileDelete: (uploadId: string) => Promise<void> | void;
  /**
   * Currently uploaded files
   */
  uploadedFiles?: UploadedFile[];
  /**
   * Callback when files are successfully uploaded
   */
  onFilesUploaded?: (files: UploadedFile[]) => void;
  /**
   * Callback when a file is deleted
   */
  onFileDeleted?: (uploadId: string) => void;
  /**
   * Optional label for the upload area
   */
  label?: string;
  /**
   * Optional description/help text
   */
  description?: string;
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  /**
   * Optional error message to display
   */
  error?: string;
  /**
   * Additional className for the container
   */
  className?: string;

  t: {
    fileSizeTooLarge: (args: { maxSize: string }) => string;
    invalidFileType: string;
    clickToUploadOrDragDrop: string;
    fileRequirements: (args: { types: string; maxSize: string }) => string;
    filesRemaining: (args: { remaining: number }) => string;
    remove: string;
  };
}

interface FileUploadState {
  file: File;
  uploadId?: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

/**
 * Detect MIME type from file content using file-type library
 * Always detects from content first to avoid relying on incorrect file.type
 * Falls back to file.type if detection fails
 */
async function detectMimeType(file: File): Promise<string> {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    // Read first 4100 bytes (file-type needs enough bytes for detection)
    const blob = file.slice(0, 4100);

    fileReader.onload = async (e) => {
      if (!e.target?.result) {
        resolve(file.type || "application/octet-stream");
        return;
      }

      try {
        const buffer = new Uint8Array(e.target.result as ArrayBuffer);
        const fileType = await fileTypeFromBuffer(buffer);

        if (fileType?.mime) {
          resolve(fileType.mime);
          return;
        }
      } catch (error) {
        // If detection fails, fall back to file.type
        console.warn("Failed to detect file type:", error);
      }

      // Fallback to file.type or default
      resolve(file.type || "application/octet-stream");
    };

    fileReader.onerror = () => {
      resolve(file.type || "application/octet-stream");
    };

    fileReader.readAsArrayBuffer(blob);
  });
}

/**
 * Calculate MD5 hash of a file and return as base64 string
 */
async function calculateMD5Base64(file: File): Promise<string> {
  // Dynamic import to avoid bundling issues
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152; // Read in chunks of 2MB
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file chunk"));
        return;
      }
      spark.append(e.target.result as ArrayBuffer);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        const hash = spark.end();
        // Convert hex to base64
        const base64Hash = btoa(
          hash
            .match(/.{1,2}/g)!
            .map((byte) => String.fromCharCode(parseInt(byte, 16)))
            .join(""),
        );
        resolve(base64Hash);
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end =
        start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

/**
 * Format bytes to human-readable size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Upload file to S3 using presigned POST URL
 */
async function uploadToS3(
  file: File,
  url: string,
  fields: Record<string, string>,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

export function DocumentUpload({
  documentTypeId,
  maxFiles,
  maxSize,
  allowedFileTypes,
  getPresignedUrl,
  onFileDelete,
  uploadedFiles = [],
  onFilesUploaded,
  onFileDeleted,
  label,
  description,
  disabled = false,
  error,
  className,
  t,
}: DocumentUploadProps) {
  // Use provided t function or fallback to default values
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadState[]>([]);

  const isSingleFile = maxFiles === 1;
  const canUploadMore = uploadedFiles.length + uploadingFiles.length < maxFiles;

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        throw new Error(
          t.fileSizeTooLarge({
            maxSize: maxSizeMB,
          }),
        );
      }

      // Detect actual MIME type from file content (magic bytes)
      const mimeType = await detectMimeType(file);
      const fileName = file.name;
      const extension = fileName.split(".").pop()?.toLowerCase();

      const isAllowed = allowedFileTypes.some((allowedType) => {
        if (allowedType.includes("*")) {
          // Handle wildcard patterns like "image/*"
          const baseType = allowedType.split("/")[0];
          return mimeType.startsWith(`${baseType}/`);
        }
        if (allowedType.startsWith(".")) {
          // Handle extension patterns like ".pdf"
          return `.${extension}` === allowedType.toLowerCase();
        }
        // Handle exact MIME types
        return mimeType === allowedType;
      });

      if (!isAllowed) {
        throw new Error(t.invalidFileType);
      }

      // Calculate MD5 hash
      const base64Md5Hash = await calculateMD5Base64(file);

      // Get presigned URL
      const {
        url,
        fields: presignedFields,
        uploadId,
      } = await getPresignedUrl({
        documentTypeId,
        fileName: file.name,
        fileSize: file.size,
        base64Md5Hash,
        contentType: mimeType,
      });

      // Set status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, status: "uploading" as const } : f,
        ),
      );

      // Upload to S3
      await uploadToS3(file, url, presignedFields, (progress) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress } : f)),
        );
      });

      // Mark as successful
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: "success" as const, progress: 100 }
            : f,
        ),
      );

      // Add to uploaded files
      const uploadedFile: UploadedFile = {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
      };

      onFilesUploaded?.([...uploadedFiles, uploadedFile]);

      // Remove from uploading files after a short delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
      }, 1000);
    },
    [
      documentTypeId,
      maxSize,
      allowedFileTypes,
      getPresignedUrl,
      uploadedFiles,
      onFilesUploaded,
      t,
    ],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || !canUploadMore) return;

      const filesToUpload = isSingleFile
        ? acceptedFiles.slice(0, 1)
        : acceptedFiles.slice(0, maxFiles - uploadedFiles.length);

      const newUploadingFiles: FileUploadState[] = filesToUpload.map(
        (file) => ({
          file,
          progress: 0,
          status: "pending" as const,
        }),
      );

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload files sequentially to avoid overwhelming the server
      for (const file of filesToUpload) {
        try {
          await handleFileUpload(file);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? {
                    ...f,
                    status: "error" as const,
                    error: errorMessage,
                  }
                : f,
            ),
          );
        }
      }
    },
    [
      disabled,
      canUploadMore,
      isSingleFile,
      maxFiles,
      uploadedFiles.length,
      handleFileUpload,
    ],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      void onDrop(acceptedFiles);
    },
    disabled: disabled || !canUploadMore,
    maxFiles: isSingleFile ? 1 : maxFiles - uploadedFiles.length,
    accept: allowedFileTypes.reduce(
      (acc, type) => {
        // Convert allowed types to MIME type format for dropzone
        if (type.includes("*")) {
          acc[type] = [];
        } else if (type.startsWith(".")) {
          // Extension-based - dropzone doesn't support this well, so we'll validate manually
          acc["*/*"] = [];
        } else {
          acc[type] = [];
        }
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  });

  const handleDelete = useCallback(
    async (uploadId: string) => {
      try {
        await onFileDelete(uploadId);
        onFileDeleted?.(uploadId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        // You might want to show a toast here
        console.error("Failed to delete file:", errorMessage);
      }
    },
    [onFileDelete, onFileDeleted],
  );

  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
  const allowedTypesText = allowedFileTypes
    .map((type) => {
      if (type.includes("*")) {
        return type.replace("*", "");
      }
      if (type.startsWith(".")) {
        return type.toUpperCase();
      }
      return type.split("/")[1]?.toUpperCase() || type;
    })
    .join(", ");

  // Single file mode - show uploaded file or upload button
  if (isSingleFile) {
    const hasFile = uploadedFiles.length > 0;
    const isUploading = uploadingFiles.length > 0;

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && (
          <label className="text-sm leading-none font-medium">{label}</label>
        )}
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        {hasFile ? (
          <div className="bg-muted flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <FileIcon className="text-muted-foreground size-5" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {uploadedFiles[0]!.fileName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatFileSize(uploadedFiles[0]!.fileSize)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(uploadedFiles[0]!.uploadId)}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ) : isUploading ? (
          <div className="bg-muted flex flex-col gap-2 rounded-lg border p-3">
            {uploadingFiles.map((uploadingFile) => (
              <div
                key={uploadingFile.file.name}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {uploadingFile.file.name}
                  </span>
                  {uploadingFile.status === "error" && (
                    <span className="text-destructive text-xs">
                      {uploadingFile.error}
                    </span>
                  )}
                </div>
                {uploadingFile.status === "uploading" && (
                  <Progress value={uploadingFile.progress} />
                )}
                {uploadingFile.status === "error" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadingFiles((prev) =>
                        prev.filter((f) => f.file !== uploadingFile.file),
                      );
                    }}
                  >
                    {t.remove}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
              isDragActive && "border-primary bg-primary/5",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input {...getInputProps()} />
            <UploadIcon className="text-muted-foreground size-8" />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-sm font-medium">
                {t.clickToUploadOrDragDrop}
              </span>
              <span className="text-muted-foreground text-xs">
                {t.fileRequirements({
                  types: allowedTypesText,
                  maxSize: maxSizeMB,
                })}
              </span>
            </div>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    );
  }

  // Multiple files mode
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <label className="text-sm leading-none font-medium">{label}</label>
      )}
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragActive && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input {...getInputProps()} />
          <UploadIcon className="text-muted-foreground size-8" />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-medium">
              {t.clickToUploadOrDragDrop}
            </span>
            <span className="text-muted-foreground text-xs">
              {t.fileRequirements({
                types: allowedTypesText,
                maxSize: maxSizeMB,
              })}
            </span>
            {maxFiles > 1 && (
              <span className="text-muted-foreground text-xs">
                {t.filesRemaining({
                  remaining:
                    maxFiles - uploadedFiles.length - uploadingFiles.length,
                })}
              </span>
            )}
          </div>
        </div>
      )}
      {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
        <div className="flex flex-col gap-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.uploadId}
              className="bg-muted flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <FileIcon className="text-muted-foreground size-5" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{file.fileName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file.uploadId)}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.file.name}
              className="bg-muted flex flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadingFile.status === "uploading" ? (
                    <Spinner className="size-5" />
                  ) : (
                    <FileIcon className="text-muted-foreground size-5" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {uploadingFile.file.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatFileSize(uploadingFile.file.size)}
                    </span>
                  </div>
                </div>
                {uploadingFile.status === "error" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setUploadingFiles((prev) =>
                        prev.filter((f) => f.file !== uploadingFile.file),
                      );
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>
              {uploadingFile.status === "uploading" && (
                <Progress value={uploadingFile.progress} />
              )}
              {uploadingFile.status === "error" && (
                <p className="text-destructive text-xs">
                  {uploadingFile.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
