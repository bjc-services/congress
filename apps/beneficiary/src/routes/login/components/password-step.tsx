import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login/components/password-step")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/login/components/password-step"!</div>;
}
