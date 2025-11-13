import { useCallback, useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import type { UploadedFile } from "@congress/ui/upload";
import type { maritalStatusSchema } from "@congress/validators";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import {
  AddressFieldsGroup,
  ChildrenFieldsGroup,
  useAppForm,
} from "@congress/ui/fields";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";
import { DocumentUpload } from "@congress/ui/upload";
import { beneficiarySignupSchema } from "@congress/validators";
import {
  identityAppendixDocumentType,
  identityCardDocumentType,
} from "@congress/validators/constants";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";
import { trpcClient, useTRPC } from "~/lib/trpc";

type MaritalStatus = z.infer<typeof maritalStatusSchema>;

type DocumentsRequirement = "required" | "optional" | "hidden";

type SignupStep = "form" | "otp";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "invalid_otp"),
});

// Schema for form validation (without otpCode)
const signupFormSchema = beneficiarySignupSchema.omit({ otpCode: true });

export const Route = createFileRoute("/_auth-layout/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    nationalId:
      typeof search.nationalId === "string" ? search.nationalId : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.nationalId) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/login", search: { nationalId: undefined } });
    }
  },
  component: SignupRouteComponent,
});

function SignupRouteComponent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { session } = useBeneficiaryAuth();
  const search = Route.useSearch();

  const [step, setStep] = useState<SignupStep>("form");
  const [maskedPhoneNumber, setMaskedPhoneNumber] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<Omit<
    z.infer<typeof beneficiarySignupSchema>,
    "otpCode"
  > | null>(null);

  useEffect(() => {
    if (session) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  const sendSignupOtpMutation = useMutation(
    trpc.beneficiaryAuth.sendSignupOTP.mutationOptions({
      onSuccess: (data) => {
        setMaskedPhoneNumber(data.phoneNumberMasked);
        toast.success(data.message);
        if (data.devCode) {
          console.info("[DEV] OTP Code:", data.devCode);
        }
        setStep("otp");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const signupMutation = useMutation(
    trpc.beneficiaryAuth.signup.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.message);
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      nationalId: search.nationalId ?? "",
      firstName: "",
      lastName: "",
      personalPhoneNumber: "",
      homePhoneNumber: "" as string | undefined,
      dateOfBirth: "",
      maritalStatus: "single" as MaritalStatus,
      address: {
        cityId: 0,
        streetId: 0,
        houseNumber: "",
        addressLine2: "",
        postalCode: "",
      },
      spouse: undefined as
        | {
            nationalId: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth: string;
          }
        | undefined,
      childrenCount: 0,
      children: [] as {
        firstName: string;
        lastName: string;
        nationalId: string;
        dateOfBirth: string;
      }[],
      identityCardUploadId: undefined as string | undefined,
      identityAppendixUploadId: undefined as string | undefined,
    },
    validators: {
      onSubmit: signupFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Validate form and send OTP
      const payload = {
        ...value,
        homePhoneNumber: value.homePhoneNumber,
        spouse: value.maritalStatus === "single" ? undefined : value.spouse,
        children: value.children.slice(0, value.childrenCount),
      };

      // Store form data for later submission
      setFormData(payload);

      // Send OTP to phone number
      await sendSignupOtpMutation.mutateAsync({
        nationalId: value.nationalId,
        phoneNumber: value.personalPhoneNumber,
      });
    },
  });

  const otpForm = useForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!formData) {
        toast.error(t("form_data_missing"));
        setStep("form");
        return;
      }

      // Submit signup with OTP code
      const payload = {
        ...formData,
        otpCode: value.otp,
      };

      await signupMutation.mutateAsync(payload);
    },
  });

  // State for uploaded files
  const [idCardFile, setIdCardFile] = useState<UploadedFile | undefined>();
  const [idAppendixFile, setIdAppendixFile] = useState<
    UploadedFile | undefined
  >();

  // Upload mutations - use direct trpc calls to avoid SSR issues with mutationOptions
  const handleGetPresignedUrl = useCallback(
    async (params: {
      documentTypeId: string;
      fileName: string;
      fileSize: number;
      base64Md5Hash: string;
      contentType: string;
    }) => {
      try {
        // Use the trpc client directly for SSR compatibility
        const result = await trpcClient.upload.requestUploadUrl.mutate(params);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage || t("upload_failed"));
        throw error;
      }
    },
    [t],
  );

  const handleCancelUpload = useCallback(
    async (uploadId: string) => {
      try {
        await trpcClient.upload.cancelUpload.mutate({ uploadId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage || t("delete_failed"));
        throw error;
      }
    },
    [t],
  );

  return (
    <div className="bg-card w-full space-y-8 rounded-3xl p-8 shadow-xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("signup_title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("signup_subtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            void navigate({
              to: "/login",
              search: { nationalId: undefined },
            });
          }}
        >
          {t("back_to_login")}
        </Button>
      </header>
      {step === "form" && (
        <form.AppForm>
          <form
            className="space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <section className="space-y-4">
              <h2 className="text-lg font-medium">
                {t("applicant_details")}
              </h2>
              <FieldGroup>
                <form.AppField name="firstName">
                  {(field) => <field.TextField label={t("first_name")} />}
                </form.AppField>
                <form.AppField
                  name="lastName"
                  listeners={{
                    onChange: ({ value, fieldApi }) => {
                      // Update spouse lastName if spouse exists
                      const spouse = fieldApi.form.getFieldValue("spouse");
                      if (spouse) {
                        fieldApi.form.setFieldValue("spouse", {
                          ...spouse,
                          lastName: value,
                        });
                      }
                      // Update all children's lastName
                      const children =
                        fieldApi.form.getFieldValue("children");
                      if (children.length > 0) {
                        fieldApi.form.setFieldValue(
                          "children",
                          children.map((child) => ({
                            ...child,
                            lastName: value,
                          })),
                        );
                      }
                    },
                  }}
                >
                  {(field) => <field.TextField label={t("last_name")} />}
                </form.AppField>
              </FieldGroup>
              <FieldGroup>
                <form.AppField name="nationalId">
                  {(field) => (
                    <field.TextField
                      label={t("national_id")}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </form.AppField>
                <form.AppField
                  name="dateOfBirth"
                  listeners={{
                    onChange: ({ value, fieldApi }) => {
                      const age = calculateAge(value);
                      if (Number.isNaN(age) || age < 16) {
                        fieldApi.form.setFieldValue(
                          "identityCardUploadId",
                          undefined,
                        );
                        fieldApi.form.setFieldValue(
                          "identityAppendixUploadId",
                          undefined,
                        );
                        setIdCardFile(undefined);
                        setIdAppendixFile(undefined);
                      }
                    },
                  }}
                >
                  {(field) => (
                    <field.DatePickerField label={t("date_of_birth")} />
                  )}
                </form.AppField>
              </FieldGroup>
              <FieldGroup>
                <form.AppField name="personalPhoneNumber">
                  {(field) => (
                    <field.PhoneField
                      label={t("personal_phone_number")}
                      optional={false}
                      t={t}
                    />
                  )}
                </form.AppField>
                <form.AppField name="homePhoneNumber">
                  {(field) => (
                    <field.PhoneField
                      label={t("home_phone_number")}
                      optional={true}
                      t={t}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </section>

            <section className="space-y-4">
              <FieldGroup>
                <form.AppForm>
                  <AddressFieldsGroup
                    form={form}
                    fields={{
                      cityId: "address.cityId",
                      streetId: "address.streetId",
                      houseNumber: "address.houseNumber",
                      addressLine2: "address.addressLine2",
                      postalCode: "address.postalCode",
                    }}
                    title={t("address_information")}
                  />
                </form.AppForm>
              </FieldGroup>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium">{t("family_status")}</h2>
              <FieldGroup>
                <form.AppField
                  name="maritalStatus"
                  listeners={{
                    onChange: ({ value, fieldApi }) => {
                      const lastName =
                        fieldApi.form.getFieldValue("lastName");
                      if (value === "single") {
                        fieldApi.form.setFieldValue("spouse", undefined);
                      } else {
                        const currentSpouse =
                          fieldApi.form.getFieldValue("spouse");
                        if (!currentSpouse) {
                          fieldApi.form.setFieldValue("spouse", {
                            nationalId: "",
                            firstName: "",
                            lastName: value === "divorced" ? "" : lastName,
                            phoneNumber: "",
                            dateOfBirth: "",
                          });
                        }
                      }
                    },
                  }}
                >
                  {(field) => (
                    <field.SelectField
                      label={t("marital_status")}
                      placeholder={t("select_marital_status")}
                      options={[
                        {
                          value: "single" as MaritalStatus,
                          label: t("status_single"),
                        },
                        {
                          value: "married" as MaritalStatus,
                          label: t("status_married"),
                        },
                        {
                          value: "divorced" as MaritalStatus,
                          label: t("status_divorced"),
                        },
                      ]}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
              <form.Subscribe
                selector={(state) => [
                  state.values.maritalStatus,
                  state.values.spouse,
                ]}
                children={([maritalStatus, spouse]) =>
                  maritalStatus !== "single" && spouse ? (
                    <div className="border-border rounded-xl border p-4">
                      <h3 className="mb-4 text-base font-medium">
                        {t("spouse_details")}
                      </h3>
                      <FieldGroup>
                        <form.AppField name="spouse.firstName">
                          {(field) => (
                            <field.TextField label={t("first_name")} />
                          )}
                        </form.AppField>
                        <form.AppField name="spouse.lastName">
                          {(field) => (
                            <field.TextField label={t("last_name")} />
                          )}
                        </form.AppField>
                      </FieldGroup>
                      <FieldGroup>
                        <form.AppField name="spouse.nationalId">
                          {(field) => (
                            <field.TextField label={t("national_id")} />
                          )}
                        </form.AppField>
                        <form.AppField name="spouse.phoneNumber">
                          {(field) => (
                            <field.PhoneField
                              label={t("phone_number_optional")}
                              optional={true}
                              t={t}
                            />
                          )}
                        </form.AppField>
                      </FieldGroup>
                      <FieldGroup>
                        <form.AppField name="spouse.dateOfBirth">
                          {(field) => (
                            <field.DatePickerField
                              label={t("date_of_birth")}
                            />
                          )}
                        </form.AppField>
                      </FieldGroup>
                    </div>
                  ) : null
                }
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium">
                {t("children_information")}
              </h2>
              <FieldGroup>
                <form.AppField
                  name="childrenCount"
                  listeners={{
                    onChange: ({ value, fieldApi }) => {
                      const currentChildren =
                        fieldApi.form.getFieldValue("children");
                      const targetCount = value;
                      const lastName =
                        fieldApi.form.getFieldValue("lastName");

                      if (currentChildren.length < targetCount) {
                        // Add new children
                        const diff = targetCount - currentChildren.length;
                        const newChildren = [...currentChildren];
                        for (let i = 0; i < diff; i++) {
                          newChildren.push({
                            firstName: "",
                            lastName,
                            nationalId: "",
                            dateOfBirth: "",
                          });
                        }
                        fieldApi.form.setFieldValue("children", newChildren);
                      } else if (currentChildren.length > targetCount) {
                        // Remove excess children
                        fieldApi.form.setFieldValue(
                          "children",
                          currentChildren.slice(0, targetCount),
                        );
                      }
                    },
                  }}
                >
                  {(field) => (
                    <field.NumberField
                      label={t("number_of_children")}
                      min={0}
                      max={20}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
              <form.AppField name="children" mode="array">
                {(field) => (
                  <form.Subscribe
                    selector={(state) => state.values.childrenCount}
                    children={(childrenCount) => {
                      const count =
                        typeof childrenCount === "number" ? childrenCount : 0;
                      return (
                        <div className="space-y-4">
                          {field.state.value.map((_, index) => (
                            <ChildrenFieldsGroup
                              key={index}
                              form={form}
                              fields={`children[${index}]`}
                              childNumber={index + 1}
                            />
                          ))}
                          {count > 0 &&
                            field.state.value.length !== count && (
                              <p className="text-destructive text-sm">
                                {t("children_mismatch_hint")}
                              </p>
                            )}
                        </div>
                      );
                    }}
                  />
                )}
              </form.AppField>
            </section>

            <form.Subscribe
              selector={(state) => [state.values.dateOfBirth]}
              children={([dateOfBirth]) => {
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
                    <h2 className="text-lg font-medium">
                      {t("identity_documents")}
                    </h2>
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
                            const dateOfBirth =
                              fieldApi.form.getFieldValue("dateOfBirth");
                            const age = calculateAge(dateOfBirth);
                            if (Number.isNaN(age) || age < 16) {
                              fieldApi.setValue(undefined);
                              setIdCardFile(undefined);
                            }
                          },
                        }}
                      >
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
                                    documentTypeId={
                                      identityCardDocumentType.id
                                    }
                                    maxFiles={
                                      identityCardDocumentType.maxAllowedFiles
                                    }
                                    maxSize={
                                      identityCardDocumentType.maxFileSize
                                    }
                                    allowedFileTypes={
                                      identityCardDocumentType.allowedFileTypes
                                    }
                                    getPresignedUrl={handleGetPresignedUrl}
                                    onFileDelete={handleCancelUpload}
                                    uploadedFiles={
                                      idCardFile ? [idCardFile] : []
                                    }
                                    onFilesUploaded={(files) => {
                                      if (files.length > 0) {
                                        setIdCardFile(files[0]);
                                        field.handleChange(
                                          files[0]!.uploadId,
                                        );
                                      }
                                    }}
                                    onFileDeleted={() => {
                                      setIdCardFile(undefined);
                                      field.handleChange(undefined);
                                    }}
                                    label={t("document_identity_card")}
                                    description={
                                      identityCardDocumentType.description
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
                                        t("file_size_too_large", { maxSize }),
                                      invalidFileType: t("invalid_file_type"),
                                      clickToUploadOrDragDrop: t(
                                        "click_to_upload_or_drag_drop",
                                      ),
                                      fileRequirements: ({
                                        types,
                                        maxSize,
                                      }) =>
                                        t("file_requirements", {
                                          types,
                                          maxSize,
                                        }),
                                      filesRemaining: ({ remaining }) =>
                                        t("files_remaining", { remaining }),
                                      remove: t("remove"),
                                    }}
                                  />
                                  {field.state.meta.isTouched &&
                                    !field.state.meta.isValid && (
                                      <FieldError
                                        errors={field.state.meta.errors}
                                      />
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
                            const dateOfBirth =
                              fieldApi.form.getFieldValue("dateOfBirth");
                            const age = calculateAge(dateOfBirth);
                            if (Number.isNaN(age) || age < 16) {
                              fieldApi.setValue(undefined);
                              setIdAppendixFile(undefined);
                            }
                          },
                        }}
                        children={(field) => (
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
                                    documentTypeId={
                                      identityAppendixDocumentType.id
                                    }
                                    maxFiles={
                                      identityAppendixDocumentType.maxAllowedFiles
                                    }
                                    maxSize={
                                      identityAppendixDocumentType.maxFileSize
                                    }
                                    allowedFileTypes={
                                      identityAppendixDocumentType.allowedFileTypes
                                    }
                                    getPresignedUrl={handleGetPresignedUrl}
                                    onFileDelete={handleCancelUpload}
                                    uploadedFiles={
                                      idAppendixFile ? [idAppendixFile] : []
                                    }
                                    onFilesUploaded={(files) => {
                                      if (files.length > 0) {
                                        setIdAppendixFile(files[0]);
                                        field.handleChange(
                                          files[0]!.uploadId,
                                        );
                                      }
                                    }}
                                    onFileDeleted={() => {
                                      setIdAppendixFile(undefined);
                                      field.handleChange(undefined);
                                    }}
                                    label={t("document_identity_appendix")}
                                    description={
                                      identityAppendixDocumentType.description
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
                                        t("file_size_too_large", { maxSize }),
                                      invalidFileType: t("invalid_file_type"),
                                      clickToUploadOrDragDrop: t(
                                        "click_to_upload_or_drag_drop",
                                      ),
                                      fileRequirements: ({
                                        types,
                                        maxSize,
                                      }) =>
                                        t("file_requirements", {
                                          types,
                                          maxSize,
                                        }),
                                      filesRemaining: ({ remaining }) =>
                                        t("files_remaining", { remaining }),
                                      remove: t("remove"),
                                    }}
                                  />
                                  {field.state.meta.isTouched &&
                                    !field.state.meta.isValid && (
                                      <FieldError
                                        errors={field.state.meta.errors}
                                      />
                                    )}
                                </Field>
                              );
                            }}
                          />
                        )}
                      />
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
              }}
            />

            <section className="space-y-3">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting
                      ? t("sending_verification_code")
                      : t("continue")}
                  </Button>
                )}
              />
              <p className="text-muted-foreground text-center text-xs">
                {t("signup_disclaimer")}
              </p>
            </section>
          </form>
        </form.AppForm>
      )}
      {step === "otp" && (
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void otpForm.handleSubmit();
          }}
        >
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              {maskedPhoneNumber
                ? t("otp_sent_message", { phoneNumber: maskedPhoneNumber })
                : t("otp_sent_message_no_phone")}
            </p>
          </div>
          <FieldGroup>
            <otpForm.Field
              name="otp"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        {t("verification_code_label")}
                      </FieldLabel>
                    </FieldContent>
                    <Input
                      id={field.name}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(
                          event.target.value.replace(/\D/g, ""),
                        )
                      }
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.4em]"
                      disabled={
                        otpForm.state.isSubmitting ||
                        signupMutation.isPending ||
                        sendSignupOtpMutation.isPending
                      }
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                otpForm.state.isSubmitting ||
                signupMutation.isPending ||
                sendSignupOtpMutation.isPending
              }
            >
              {otpForm.state.isSubmitting || signupMutation.isPending
                ? t("submitting")
                : t("submit_application")}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="link"
                disabled={sendSignupOtpMutation.isPending}
                onClick={() => {
                  if (!formData) {
                    toast.error(t("form_data_missing"));
                    setStep("form");
                    return;
                  }
                  void sendSignupOtpMutation.mutateAsync({
                    nationalId: formData.nationalId,
                    phoneNumber: formData.personalPhoneNumber,
                  });
                }}
              >
                {t("resend_code")}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setStep("form");
                  otpForm.reset();
                }}
              >
                {t("back")}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

function calculateAge(isoDate: string): number {
  const birthDate = new Date(isoDate);
  if (Number.isNaN(birthDate.getTime())) {
    return Number.NaN;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}
