import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { AddressFieldsGroup, useAppForm, type AppForm } from "@congress/ui/fields";
import { orpcClient } from "@congress/ui/orpc";
import { toast } from "@congress/ui/toast";
import { UploadedFile } from "@congress/ui/upload";
import { maritalStatusSchema, signupFormSchema } from "@congress/validators";

import { ApplicantDetailsSection } from "./applicant-details-section";
import { ChildrenSection } from "./children-section";
import { FamilyStatusSection } from "./family-status-section";
import { IdentityDocumentsSection } from "./identity-documents-section";
import { YeshivaDetails } from "./kollel-details";
import { SignupFormActions } from "./signup-form-actions";

interface PersonalDetailsStepProps {
  setFormData: (data: any) => void;
  setStep: (step: "form" | "otp" | "password") => void;
  nationalId: string | undefined;
}

type MaritalStatus = z.infer<typeof maritalStatusSchema>;

export function PersonalDetailsStep({
  setFormData,
  setStep,
  nationalId,
}: PersonalDetailsStepProps) {
  const { t } = useTranslation("signup");

  const [idCardFile, setIdCardFile] = useState<UploadedFile | undefined>();
  const [idAppendixFile, setIdAppendixFile] = useState<
    UploadedFile | undefined
  >();
  const [kollelCertificateFile, setKollelCertificateFile] = useState<
    UploadedFile | undefined
  >();

  // Upload mutations - use direct orpc calls to avoid SSR issues with mutationOptions
  const handleGetPresignedUrl = useCallback(
    async (params: {
      documentTypeId: string;
      fileName: string;
      fileSize: number;
      base64Md5Hash: string;
      contentType: string;
    }) => {
      try {
        // Use the orpc client directly for SSR compatibility
        const result = await orpcClient.upload.requestUploadUrl(params);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(t(errorMessage as any) || t("upload_failed"));
        throw error;
      }
    },
    [t],
  );

  const form = useAppForm({
    defaultValues: {
      nationalId: nationalId ?? "",
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
      yeshivaDetails: {
        yeshivaName: undefined as string | undefined,
        headOfTheYeshivaName: undefined as string | undefined,
        headOfTheYeshivaPhone: undefined as string | undefined,
        yeshivaWorkType: undefined as "all_day" | "half_day" | undefined,
        yeshivaCertificateUploadId: undefined as string | undefined,
        yeshivaType: "yeshiva" as "kollel" | "yeshiva",
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
      // @ts-expect-error - Type mismatch between optional and required undefined, but runtime validation works correctly
      onSubmit: signupFormSchema,
    },
    onSubmit: ({ value }) => {
      // Validate form and move to password step
      const payload = {
        ...value,
        homePhoneNumber: value.homePhoneNumber,
        spouse: value.maritalStatus === "single" ? undefined : value.spouse,
        children: value.children.slice(0, value.childrenCount),
      };

      // Store form data for later submission
      setFormData(payload);

      // Move to password step
      setStep("password");
    },
  });

  const handleCancelUpload = useCallback(
    async (uploadId: string) => {
      try {
        await orpcClient.upload.cancelUpload({ uploadId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(t(errorMessage as any) || t("delete_failed"));
        throw error;
      }
    },
    [t],
  );

  return (
    <form.AppForm>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <ApplicantDetailsSection
          form={form as AppForm}
          setIdCardFile={setIdCardFile}
          setIdAppendixFile={setIdAppendixFile}
        />

        {/* Address Section */}
        <AddressFieldsGroup
          form={form}
          fields={{
            cityId: "address.cityId",
            streetId: "address.streetId",
            houseNumber: "address.houseNumber",
            addressLine2: "address.addressLine2",
            postalCode: "address.postalCode",
          }}
        />

        <FamilyStatusSection form={form as AppForm} />
        <YeshivaDetails
          form={form as AppForm}
          kollelCertificateFile={kollelCertificateFile}
          setKollelCertificateFile={setKollelCertificateFile}
          handleGetPresignedUrl={handleGetPresignedUrl}
          handleCancelUpload={handleCancelUpload}
        />
        <ChildrenSection form={form as AppForm} />
        <form.Subscribe
          selector={(state) => [state.values.dateOfBirth]}
          children={([dateOfBirth]) => (
            <IdentityDocumentsSection
              form={form as AppForm}
              dateOfBirth={dateOfBirth ?? ""}
              idCardFile={idCardFile}
              idAppendixFile={idAppendixFile}
              setIdCardFile={setIdCardFile}
              setIdAppendixFile={setIdAppendixFile}
              handleGetPresignedUrl={handleGetPresignedUrl}
              handleCancelUpload={handleCancelUpload}
            />
          )}
        />
        <SignupFormActions form={form as AppForm} />
      </form>
    </form.AppForm>
  );
}
