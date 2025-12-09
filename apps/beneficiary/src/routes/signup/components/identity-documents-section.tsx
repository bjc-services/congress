import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import type { UploadedFile } from "@congress/ui/upload";
import { Field, FieldError, FieldGroup } from "@congress/ui/field";
import { DocumentUpload } from "@congress/ui/upload";
import {
  identityAppendixDocumentType,
  identityCardDocumentType,
} from "@congress/validators/constants";

import { calculateAge } from "../utils";

type DocumentsRequirement = "required" | "optional" | "hidden";

interface IdentityDocumentsSectionProps {
  form: AppForm;
  dateOfBirth: string;
  idCardFile: UploadedFile | undefined;
  idAppendixFile: UploadedFile | undefined;
  setIdCardFile: (file: UploadedFile | undefined) => void;
  setIdAppendixFile: (file: UploadedFile | undefined) => void;
  handleGetPresignedUrl: (params: {
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
  handleCancelUpload: (uploadId: string) => Promise<void>;
}

export function IdentityDocumentsSection({
  form,
  dateOfBirth,
  idCardFile,
  idAppendixFile,
  setIdCardFile,
  setIdAppendixFile,
  handleGetPresignedUrl,
  handleCancelUpload,
}: IdentityDocumentsSectionProps) {
  const { t, i18n } = useTranslation();

  const documentsRequirement = ((): DocumentsRequirement => {
    if (!dateOfBirth) return "required";
    const age = calculateAge(dateOfBirth);
    if (Number.isNaN(age)) return "required";
    if (age >= 18) return "required";
    if (age >= 16) return "optional";
    return "hidden";
  })();

  if (documentsRequirement === "hidden") {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{t("identity_documents")}</h2>
      <p className="text-muted-foreground text-sm">
        {documentsRequirement === "required"
          ? t("documents_required_hint")
          : t("documents_optional_hint")}
      </p>
      <FieldGroup>
        <form.AppField
          name="identityCardUploadId"
          listeners={{
            onChange: ({ fieldApi }) => {
              const dateOfBirth = fieldApi.form.getFieldValue("dateOfBirth");
              const age = calculateAge(dateOfBirth as string);
              if (Number.isNaN(age) || age < 16) {
                // Avoid infinite loops: only update if current value differs
                if (fieldApi.state.value !== undefined) {
                  fieldApi.setValue(undefined);
                  setIdCardFile(undefined);
                }
              }
            },
          }}
        >
          {(field) => (
            <form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => {
                const submitting =
                  typeof isSubmitting === "boolean" ? isSubmitting : false;
                return (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  >
                    <DocumentUpload
                      documentTypeId={identityCardDocumentType.id}
                      maxFiles={identityCardDocumentType.maxAllowedFiles}
                      maxSize={identityCardDocumentType.maxFileSize}
                      allowedFileTypes={
                        identityCardDocumentType.allowedFileTypes
                      }
                      getPresignedUrl={handleGetPresignedUrl}
                      onFileDelete={handleCancelUpload}
                      uploadedFiles={idCardFile ? [idCardFile] : []}
                      onFilesUploaded={(files) => {
                        if (files.length > 0) {
                          setIdCardFile(files[0]);
                          field.handleChange(files[0]!.uploadId);
                        }
                      }}
                      onFileDeleted={() => {
                        setIdCardFile(undefined);
                        field.handleChange(undefined);
                      }}
                      label={t("document_identity_card")}
                      description={identityCardDocumentType.description}
                      disabled={submitting}
                      t={{
                        fileSizeTooLarge: ({ maxSize }) =>
                          t("file_size_too_large", {
                            maxSize,
                          }),
                        invalidFileType: t("invalid_file_type"),
                        clickToUploadOrDragDrop: t(
                          "click_to_upload_or_drag_drop",
                        ),
                        fileRequirements: ({ types, maxSize }) =>
                          t("file_requirements", {
                            types,
                            maxSize,
                          }),
                        filesRemaining: ({ remaining }) =>
                          t("files_remaining", {
                            remaining,
                          }),
                        remove: t("remove"),
                      }}
                    />
                    {field.state.meta.isTouched &&
                      !field.state.meta.isValid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                  </Field>
                );
              }}
            />
          )}
        </form.AppField>
        <form.AppField
          name="identityAppendixUploadId"
          listeners={{
            onChange: ({ fieldApi }) => {
              const dateOfBirth = fieldApi.form.getFieldValue("dateOfBirth");
              const age = calculateAge(dateOfBirth as string);
              if (Number.isNaN(age) || age < 16) {
                // Avoid infinite loops: only update if current value differs
                if (fieldApi.state.value !== undefined) {
                  fieldApi.setValue(undefined);
                  setIdAppendixFile(undefined);
                }
              }
            },
          }}
        >
          {(field) => (
            <form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => {
                const submitting =
                  typeof isSubmitting === "boolean" ? isSubmitting : false;
                return (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  >
                    <DocumentUpload
                      documentTypeId={identityAppendixDocumentType.id}
                      maxFiles={identityAppendixDocumentType.maxAllowedFiles}
                      maxSize={identityAppendixDocumentType.maxFileSize}
                      allowedFileTypes={
                        identityAppendixDocumentType.allowedFileTypes
                      }
                      getPresignedUrl={handleGetPresignedUrl}
                      onFileDelete={handleCancelUpload}
                      uploadedFiles={idAppendixFile ? [idAppendixFile] : []}
                      onFilesUploaded={(files) => {
                        if (files.length > 0) {
                          setIdAppendixFile(files[0]);
                          field.handleChange(files[0]!.uploadId);
                        }
                      }}
                      onFileDeleted={() => {
                        setIdAppendixFile(undefined);
                        field.handleChange(undefined);
                      }}
                      label={t("document_identity_appendix")}
                      description={identityAppendixDocumentType.description}
                      disabled={submitting}
                      t={{
                        fileSizeTooLarge: ({ maxSize }) =>
                          t("file_size_too_large", {
                            maxSize,
                          }),
                        invalidFileType: t("invalid_file_type"),
                        clickToUploadOrDragDrop: t(
                          "click_to_upload_or_drag_drop",
                        ),
                        fileRequirements: ({ types, maxSize }) =>
                          t("file_requirements", {
                            types,
                            maxSize,
                          }),
                        filesRemaining: ({ remaining }) =>
                          t("files_remaining", {
                            remaining,
                          }),
                        remove: t("remove"),
                      }}
                    />
                    {field.state.meta.isTouched &&
                      !field.state.meta.isValid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                  </Field>
                );
              }}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <details className="bg-muted/60 rounded-lg p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          {t("how_to_find_appendix")}
        </summary>
        <p className="mt-2">
          <a
            href={`https://www.gov.il/${i18n.language}/service/renew_id_appendix`}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {t("gov_appendix_link_text")}
          </a>
        </p>
      </details>
    </section>
  );
}
