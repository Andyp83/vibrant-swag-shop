import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/backoffice/format";
import { createInvoiceCheckout, getSharedInvoice } from "@/lib/backoffice/public.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({
    meta: [
      { title: "Pay your invoice | See See Bloom" },
      {
        name: "description",
        content: "Pay your See See Bloom invoice securely by card.",
      },
      { property: "og:title", content: "Pay your invoice | See See Bloom" },
      { property: "og:description", content: "Secure card payment for your invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayInvoicePage,
});

function PayInvoicePage() {
  const { token } = Route.useParams();
  const fetchInvoice = useServerFn(getSharedInvoice);
  const startCheckout = useServerFn(createInvoiceCheckout);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoiceQuery = useQuery({
    queryKey: ["shared-invoice", token],
    queryFn: () => fetchInvoice({ data: { token } }),
  });

  const fetchClientSecret = useCallback(async () => {
    const result = await startCheckout({
      data: {
        token,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/pay/${token}?paid=1`,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payment could not be started");
    return result.clientSecret;
  }, [startCheckout, token]);

  const checkoutOptions = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  if (!invoice) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">This payment link isn't valid</h1>
        <p className="mt-4 text-muted-foreground">Reply to your email and we'll resend it.</p>
      </main>
    );
  }

  const paid = invoice.status === "paid";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">See See Bloom</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Invoice {invoice.number}</h1>
      <p className="mt-2 text-muted-foreground">
        {invoice.description || `${invoice.kind} payment`} for {invoice.customer_name}
        {invoice.due_date ? ` · due ${formatDate(invoice.due_date)}` : ""}
      </p>
      <p className="mt-8 text-5xl font-semibold tracking-tight">
        {formatMoney(invoice.amount_cents, invoice.currency)}
      </p>

      {paid ? (
        <p className="mt-8 rounded-xl border bg-muted/50 p-4 text-sm font-medium">
          This invoice is paid in full. Thank you!
        </p>
      ) : checkingOut ? (
        <div className="mt-10">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      ) : (
        <Button
          className="mt-10"
          onClick={() => {
            try {
              getStripeEnvironment();
              setCheckingOut(true);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Payments unavailable");
              setCheckingOut(true);
            }
          }}
        >
          Pay by card
        </Button>
      )}
    </main>
  );
}
