import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";

import { authClient } from "~/auth/client";

export function AuthShowcase() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!session) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
            </FieldContent>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
            </FieldContent>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </Field>
        </FieldGroup>
        <Button
          size="lg"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await authClient.signIn.email({
                email,
                password,
              });
              if (res.error) {
                toast.error("Invalid email or password");
              } else {
                toast.success("Signed in successfully");
                await navigate({ href: "/", replace: true });
              }
            } catch {
              toast.error(t("failed_to_sign_in"));
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? t("signing_in") : t("sign_in")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>{t("logged_in_as", { name: session.user.name })}</span>
      </p>

      <Button
        size="lg"
        onClick={async () => {
          await authClient.signOut();
          await navigate({ href: "/", replace: true });
        }}
      >
        {t("sign_out")}
      </Button>
    </div>
  );
}
