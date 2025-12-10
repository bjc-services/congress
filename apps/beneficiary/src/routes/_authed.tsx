import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "~/components/navbar";

export const Route = createFileRoute("/_authed")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}
