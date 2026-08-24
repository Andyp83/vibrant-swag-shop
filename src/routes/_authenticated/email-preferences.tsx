import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "@/lib/portal/portal.functions";

export const Route = createFileRoute("/_authenticated/email-preferences")({
  head: () => ({
    meta: [
      { title: "Email Preferences | See See Bloom" },
      {
        name: "description",
        content:
          "Choose which See See Bloom emails you receive — proof sign-off confirmations and invoice notifications.",
      },
      { property: "og:title", content: "Email Preferences | See See Bloom" },
      {
        property: "og:description",
        content: "Opt in or out of proof and invoice email notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailPreferencesPage,
});

function EmailPreferencesPage() {
  const fetchPrefs = useServerFn(getEmailPreferences);
  const savePrefs = useServerFn(updateEmailPreferences);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "email-preferences"],
    queryFn: () => fetchPrefs(),
  });

  const [proofSigned, setProofSigned] = useState(true);
  const [invoiceAvailable, setInvoiceAvailable] = useState(true);

  useEffect(() => {
    if (data?.ok) {
      setProofSigned(data.notifyProofSigned);
      setInvoiceAvailable(data.notifyInvoiceAvailable);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      savePrefs({
        data: {
          notifyProofSigned: proofSigned,
          notifyInvoiceAvailable: invoiceAvailable,
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Email preferences saved");
        void queryClient.invalidateQueries({ queryKey: ["portal", "email-preferences"] });
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Could not save your preferences. Please try again."),
  });

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/portal">
          <ArrowLeft className="size-4" />
          Back to portal
        </Link>
      </Button>

      <header className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client portal</p>
        <h1 className="display-type mt-2 text-3xl">Email preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose which updates land in your inbox. Quote and order-stage emails are always sent so
          you never miss a deadline.
        </p>
      </header>

      {isLoading ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your preferences…
        </p>
      ) : data && !data.ok ? (
        <p className="mt-10 text-sm text-muted-foreground">{data.error}</p>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="flex items-start justify-between gap-6 rounded-xl border border-border bg-card p-5">
            <div>
              <Label htmlFor="notify-proof" className="text-base">
                Proof signed confirmations
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                A confirmation email with your signed-proof certificate attached whenever you
                approve artwork.
              </p>
            </div>
            <Switch id="notify-proof" checked={proofSigned} onCheckedChange={setProofSigned} />
          </div>

          <div className="flex items-start justify-between gap-6 rounded-xl border border-border bg-card p-5">
            <div>
              <Label htmlFor="notify-invoice" className="text-base">
                Invoice available notifications
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                An email with the invoice PDF and a secure pay-online link when an invoice is
                issued or still open.
              </p>
            </div>
            <Switch
              id="notify-invoice"
              checked={invoiceAvailable}
              onCheckedChange={setInvoiceAvailable}
            />
          </div>

          <Button
            className="rounded-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save preferences
          </Button>

          <p className="text-xs text-muted-foreground">
            Turning these off won't stop invoices being due — you can always view and pay them in
            your portal.
          </p>
        </div>
      )}
    </main>
  );
}
