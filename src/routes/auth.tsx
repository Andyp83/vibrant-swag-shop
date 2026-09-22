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
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [resetSent, setResetSent] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.session) {
        setConfirmSent(true);
        toast.success("Almost there — confirm your email to finish.");
      }
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

  const signingUp = mode === "signup";

  if (signingUp && confirmSent) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="display-type text-3xl">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We&rsquo;ve sent a confirmation link to {email}. Click it to finish setting up your
          account, then sign in to see your quotes, files and messages.
        </p>
        <button
          type="button"
          className="mt-6 text-sm font-semibold underline underline-offset-4"
          onClick={() => {
            setMode("signin");
            setConfirmSent(false);
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display-type text-3xl">{signingUp ? "Create your account" : "Sign in"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Track your quotes, sign off proofs, follow your order and pay invoices.
      </p>

      <form onSubmit={signingUp ? handleSignUp : handleSubmit} className="mt-8 space-y-4">
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
          {signingUp ? (
            <p className="text-xs text-muted-foreground">
              Use the same email you sent your brief from and it will appear in your portal.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {signingUp ? null : (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground underline underline-offset-4"
                onClick={() => setMode("forgot")}
              >
                Forgot password?
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            required
            minLength={signingUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {signingUp ? (
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          ) : null}
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-full">
          {busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">
          {signingUp ? "Already have an account?" : "No account yet?"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {signingUp
            ? "Sign in with the email and password you set up."
            : "Create one in a moment to follow every quote, its files and our messages in one place."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => setMode(signingUp ? "signin" : "signup")}
          >
            {signingUp ? "Back to sign in" : "Create an account"}
          </button>
          {signingUp ? null : (
            <Link
              to="/quote"
              className="text-sm font-semibold underline underline-offset-4"
            >
              Request a quote
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

