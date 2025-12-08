import { useTranslation } from "react-i18next";

import { Field, FieldError, FieldGroup } from "@congress/ui/field";
import { AppForm } from "@congress/ui/fields";
import { DocumentUpload, UploadedFile } from "@congress/ui/upload";
import { kollelCertificateDocumentType } from "@congress/validators/constants";

interface KollelDetailsProps {
  form: AppForm;
  kollelCertificateFile: UploadedFile | undefined;
  setKollelCertificateFile: (file: UploadedFile | undefined) => void;
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

export function KollelDetails({
  form,
  kollelCertificateFile,
  setKollelCertificateFile,
  handleGetPresignedUrl,
  handleCancelUpload,
}: KollelDetailsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{t("kollel_details")}</h2>
      <FieldGroup>
        <form.AppField name="kollelType">
          {(field) => (
            <field.SelectField
              label={t("kollel_type")}
              options={[
                { label: t("kollel"), value: "kollel" },
                { label: t("yeshiva"), value: "yeshiva" },
              ]}
            />
          )}
        </form.AppField>
        <form.Subscribe
          selector={(state) => [
            (state.values as { kollelType: "kollel" | "yeshiva" }).kollelType,
          ]}
          children={([kollelType]) => {
            if (kollelType !== "kollel") {
              return null;
            }
            return (
              <>
                <form.AppField name="kollelName">
                  {(field) => <field.TextField label={t("kollel_name")} />}
                </form.AppField>
                <form.AppField name="headOfTheKollelName">
                  {(field) => (
                    <field.TextField label={t("head_of_the_kollel_name")} />
                  )}
                </form.AppField>
                <form.AppField name="headOfTheKollelPhone">
                  {(field) => (
                    <field.TextField label={t("head_of_the_kollel_phone")} />
                  )}
                </form.AppField>
                <form.AppField name="kollelWorkType">
                  {(field) => (
                    <field.SelectField
                      label={t("kollel_work_type")}
                      options={[
                        { label: t("all_day"), value: "all_day" },
                        { label: t("half_day"), value: "half_day" },
                      ]}
                    />
                  )}
                </form.AppField>
                <form.AppField name="kollelCertificateUploadId">
                  {(field) => (
                    <form.Subscribe
                      selector={(state) => [state.isSubmitting]}
                      children={([isSubmitting]) => {
                        const submitting =
                          typeof isSubmitting === "boolean"
                            ? isSubmitting
                            : false;
                        return (
                          <Field
                            data-invalid={
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            }
                          >
                            <DocumentUpload
                              documentTypeId={kollelCertificateDocumentType.id}
                              maxFiles={
                                kollelCertificateDocumentType.maxAllowedFiles
                              }
                              maxSize={
                                kollelCertificateDocumentType.maxFileSize
                              }
                              allowedFileTypes={
                                kollelCertificateDocumentType.allowedFileTypes
                              }
                              getPresignedUrl={handleGetPresignedUrl}
                              onFileDelete={handleCancelUpload}
                              uploadedFiles={
                                kollelCertificateFile
                                  ? [kollelCertificateFile]
                                  : []
                              }
                              onFilesUploaded={(files) => {
                                if (files.length > 0) {
                                  setKollelCertificateFile(files[0]);
                                  field.handleChange(files[0]!.uploadId);
                                }
                              }}
                              onFileDeleted={() => {
                                setKollelCertificateFile(undefined);
                                field.handleChange(undefined);
                              }}
                              label={t("tim_confirmation")}
                              description={
                                kollelCertificateDocumentType.description
                              }
                              disabled={submitting}
                              error={
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid
                                  ? (
                                      field.state.meta.errors[0] as
                                        | { message?: string }
                                        | undefined
                                    )?.message
                                  : undefined
                              }
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
              </>
            );
          }}
        />
      </FieldGroup>
    </section>
  );
}
