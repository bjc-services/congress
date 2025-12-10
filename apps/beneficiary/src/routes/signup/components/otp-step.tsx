import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { useAppForm } from "@congress/ui/fields";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";
import { signupFormSchema } from "@congress/validators";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "invalid_otp"),
});

interface OtpStepProps {
  formData: Omit<
    z.infer<typeof signupFormSchema>,
    "otpCode" | "password"
  > | null;
  setStep: (step: "form" | "otp" | "password") => void;
  password: string;
}

export function OtpStep({ formData, setStep, password }: OtpStepProps) {
  const { t } = useTranslation();
  const { orpc } = useRouteContext({ from: "__root__" });
  const { refetchSession } = useBeneficiaryAuth();
  const navigate = useNavigate();

  const otpForm = useAppForm({
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

      if (!password) {
        toast.error(t("password_required"));
        setStep("password");
        return;
      }

      // Submit signup with OTP code and password
      await signupMutation.mutateAsync({
        ...formData,
        otpCode: value.otp,
        password: password as string,
      });
    },
  });

  const signupMutation = useMutation(
    orpc.beneficiaryAuth.signup.mutationOptions({
      onSuccess: async (data) => {
        toast.success(t(data.message as any));
        await refetchSession();
        await navigate({ to: "/", replace: true });
      },
      onError: (error) => {
        toast.error(t(error.message as any));
      },
    }),
  );

  const sendSignupOtpMutation = useMutation(
    orpc.beneficiaryAuth.sendSignupOTP.mutationOptions(),
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
              setStep("password");
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
