import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [resetSent, setResetSent] = useState(false);

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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="display-type text-3xl">Reset your password</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter the email on your account and we&rsquo;ll send you a secure link to set a new
          password.
        </p>

        {resetSent ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">Check your email</p>
            <p className="mt-2 text-muted-foreground">
              If an account exists for {email}, a reset link is on its way. The link expires after a
              short time — request another if it lapses.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <button
          type="button"
          className="mt-6 text-sm font-semibold underline underline-offset-4"
          onClick={() => {
            setMode("signin");
            setResetSent(false);
          }}
        >
          Back to sign in
        </button>
      </div>
    );
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs font-semibold text-muted-foreground underline underline-offset-4"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          </div>
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

