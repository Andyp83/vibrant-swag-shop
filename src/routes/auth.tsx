import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const next = search['next'];
    return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? { next }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Sign In | See See Bloom" },
      {
        name: "description",
        content:
          "Sign in to your See See Bloom account to track quotes, sign off proofs, follow your order and pay invoices.",
      },
      { property: "og:title", content: "Sign In | See See Bloom" },
      {
        property: "og:description",
        content: "Track quotes, sign proofs and follow your order.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (next) {
          window.location.replace(next);
          return;
        }
        void (async () => {
          let isAdmin = false;
          try {
            isAdmin = (await checkIsAdmin({})).isAdmin;
          } catch {
            isAdmin = false;
          }
          navigate({ to: isAdmin ? "/admin" : "/portal", replace: true });
        })();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display-type text-3xl">Sign in</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Track your quotes, sign off proofs, follow your order and pay invoices.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-full">
          {busy ? "Please wait…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">No account yet?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts are created when you send us a brief. Submit a quote request and set a password
          on the form — your portal opens with that quote already in it.
        </p>
        <Link
          to="/quote"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Request a quote
        </Link>
      </div>
    </div>
  );
}

