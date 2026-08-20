import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/catalog.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

const tabs = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/quotes", label: "Quotes" },
  { to: "/admin/jobs", label: "Jobs & proofs" },
  { to: "/admin/invoices", label: "Invoices" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/catalogue", label: "Catalogue" },
  { to: "/admin/banners", label: "Banners" },

] as const;

function AdminShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdminFn = useServerFn(checkIsAdmin);
  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!adminQuery.data) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Admin only</h1>
        <p className="mt-4 text-muted-foreground">
          This account doesn't have back-office access.
        </p>
        <Button className="mt-8" variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            See See Bloom back office
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Studio operations</h1>
        </div>
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: "exact" in tab ? tab.exact : false }}
            className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-muted data-[status=active]:bg-foreground data-[status=active]:text-background"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        <Outlet />
      </div>
    </div>
  );
}
