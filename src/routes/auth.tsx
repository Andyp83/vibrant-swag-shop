import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
      { title: "Team Sign In | See See Bloom" },
      {
        name: "description",
        content:
          "Sign in to the See See Bloom catalogue manager to update product categories, minimum order quantities, decoration tags and imagery.",
      },
      { property: "og:title", content: "Team Sign In | See See Bloom" },
      {
        property: "og:description",
        content: "Sign in to manage the See See Bloom product catalogue.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (next) {
          window.location.replace(next);
          return;
        }
        navigate({ to: "/admin", replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              window.location.origin + (next ? `/auth?next=${encodeURIComponent(next)}` : "/auth"),
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display-type text-3xl">Catalogue manager</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Sign in to edit categories, MOQs, decoration tags and imagery."
          : "Create the admin account. The first account created becomes the administrator."}
      </p>

      {checkEmail ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p className="font-semibold">Check your email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back here to
            sign in.
          </p>
        </div>
      ) : (
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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create admin account"}
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setCheckEmail(false);
        }}
        className="mt-6 text-sm font-medium underline underline-offset-4"
      >
        {mode === "signin" ? "Need to create the admin account?" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
