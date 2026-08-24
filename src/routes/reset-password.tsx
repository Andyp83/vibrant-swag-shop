import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a New Password | See See Bloom" },
      {
        name: "description",
        content:
          "Choose a new password for your See See Bloom client portal account and get straight back to your quotes, proofs and orders.",
      },
      { property: "og:title", content: "Set a New Password | See See Bloom" },
      {
        property: "og:description",
        content: "Choose a new password for your See See Bloom client portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        setReady(true);
      } else {
        // Give Supabase a moment to parse the recovery link from the URL.
        setTimeout(() => {
          void supabase.auth.getSession().then(({ data: retry }) => {
            if (retry.session) setReady(true);
            else setInvalid(true);
          });
        }, 1200);
      }
    })();

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated.");
      setTimeout(() => navigate({ to: "/portal", replace: true }), 1200);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display-type text-3xl">Set a new password</h1>

      {done ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your password has been updated — taking you to your portal.
        </p>
      ) : invalid && !ready ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm">
          <p className="font-semibold">This reset link is invalid or has expired</p>
          <p className="mt-2 text-muted-foreground">
            Request a fresh link from the sign-in page and use it within the hour.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to sign in
          </Link>
        </div>
      ) : !ready ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking your reset link…</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Choose a new password of at least 8 characters.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
