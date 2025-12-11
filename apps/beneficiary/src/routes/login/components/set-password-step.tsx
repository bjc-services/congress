import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login/components/set-password-step")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/login/components/set-password-step"!</div>;
}
