import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@acme/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { authClient } from "~/auth/client";

export function AuthShowcase() {
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
              <FieldLabel htmlFor="email">Email</FieldLabel>
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
              <FieldLabel htmlFor="password">Password</FieldLabel>
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
              toast.error("Failed to sign in");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button
        size="lg"
        onClick={async () => {
          await authClient.signOut();
          await navigate({ href: "/", replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
