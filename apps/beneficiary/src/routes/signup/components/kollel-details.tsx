import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import type { UploadedFile } from "@congress/ui/upload";
import { Field, FieldError, FieldGroup } from "@congress/ui/field";
import { DocumentUpload } from "@congress/ui/upload";
import { yeshivaCertificateDocumentType } from "@congress/validators/constants";

interface YeshivaDetailsProps {
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

export function YeshivaDetails({
  form,
  kollelCertificateFile,
  setKollelCertificateFile,
  handleGetPresignedUrl,
  handleCancelUpload,
}: YeshivaDetailsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{t("yeshiva_details")}</h2>
      <FieldGroup className="gap-5">
        <form.AppField
          name="yeshivaDetails.yeshivaType"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              // Only reset kollel fields when switching AWAY from kollel
              if (value !== "kollel") {
                setKollelCertificateFile(undefined);
                fieldApi.form.setFieldValue("yeshivaDetails", {
                  yeshivaName: undefined,
                  headOfTheYeshivaName: undefined,
                  headOfTheYeshivaPhone: undefined,
                  yeshivaWorkType: "all_day",
                  yeshivaCertificateUploadId: undefined,
                  yeshivaType: value,
                });
                // Clear validation errors for all kollel-specific fields
                const kollelFields = [
                  "yeshivaDetails.yeshivaName",
                  "yeshivaDetails.headOfTheYeshivaName",
                  "yeshivaDetails.headOfTheYeshivaPhone",
                  "yeshivaDetails.yeshivaWorkType",
                  "yeshivaDetails.yeshivaCertificateUploadId",
                ] as const;
                for (const field of kollelFields) {
                  fieldApi.form.setFieldMeta(field, (meta) => ({
                    ...meta,
                    errors: [],
                    errorMap: {},
                    isTouched: false,
                    isValid: true,
                  }));
                }
              }
            },
          }}
        >
          {(field) => (
            <field.SelectField
              label={t("yeshiva_type")}
              options={[
                { label: t("kollel"), value: "kollel" },
                { label: t("yeshiva"), value: "yeshiva" },
              ]}
            />
          )}
        </form.AppField>
        <form.Subscribe
          selector={(state) => [
            (
              state.values as {
                yeshivaDetails: { yeshivaType: "kollel" | "yeshiva" };
              }
            ).yeshivaDetails.yeshivaType,
          ]}
          children={([yeshivaType]) => {
            if (yeshivaType !== "kollel") {
              return null;
            }
            return (
              <>
                <form.AppField name="yeshivaDetails.yeshivaName">
                  {(field) => <field.TextField label={t("kollel_name")} />}
                </form.AppField>
                <form.AppField name="yeshivaDetails.headOfTheYeshivaName">
                  {(field) => (
                    <field.TextField label={t("head_of_the_kollel_name")} />
                  )}
                </form.AppField>
                <form.AppField name="yeshivaDetails.headOfTheYeshivaPhone">
                  {(field) => (
                    <field.PhoneField
                      label={t("head_of_the_kollel_phone")}
                      t={t}
                    />
                  )}
                </form.AppField>
                <form.AppField name="yeshivaDetails.yeshivaWorkType">
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
                <form.AppField name="yeshivaDetails.yeshivaCertificateUploadId">
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
                              documentTypeId={yeshivaCertificateDocumentType.id}
                              maxFiles={
                                yeshivaCertificateDocumentType.maxAllowedFiles
                              }
                              maxSize={
                                yeshivaCertificateDocumentType.maxFileSize
                              }
                              allowedFileTypes={
                                yeshivaCertificateDocumentType.allowedFileTypes
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
                                yeshivaCertificateDocumentType.description
                              }
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
              </>
            );
          }}
        />
      </FieldGroup>
    </section>
  );
}
