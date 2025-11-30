import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { AppForm } from "@congress/ui/fields";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";
import { useTRPC } from "@congress/ui/trpc";

interface OtpStepProps {
  otpForm: AppForm;
  formData: {
    nationalId: string;
    personalPhoneNumber: string;
  } | null;
  setStep: (step: "form" | "otp") => void;
}

export function OtpStep({ otpForm, formData, setStep }: OtpStepProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const sendSignupOtpMutation = useMutation(
    trpc.beneficiaryAuth.sendSignupOTP.mutationOptions({}),
  );

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await otpForm.handleSubmit();
      }}
    >
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          {formData?.personalPhoneNumber
            ? t("otp_sent_message", {
                phoneNumber: formData.personalPhoneNumber.replace("+972", "0"),
              })
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
                  value={field.state.value as string}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0000"
                  className="text-center text-2xl tracking-[0.4em]"
                  disabled={
                    otpForm.state.isSubmitting ||
                    sendSignupOtpMutation.isPending
                  }
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            otpForm.state.isSubmitting || sendSignupOtpMutation.isPending
          }
        >
          {otpForm.state.isSubmitting
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
  );
}
