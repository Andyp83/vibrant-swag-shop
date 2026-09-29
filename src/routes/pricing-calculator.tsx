import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing-calculator")({
  beforeLoad: () => {
    throw redirect({ to: "/shortlist" });
  },
});