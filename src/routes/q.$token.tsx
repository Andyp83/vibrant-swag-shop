import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/backoffice/format";
import { getSharedQuote, respondToQuote } from "@/lib/backoffice/public.functions";

export const Route = createFileRoute("/q/$token")({
  head: () => ({
    meta: [
      { title: "Your quote | See See Bloom" },
      {
        name: "description",
        content: "Review and accept your See See Bloom branded merchandise quote online.",
      },
      { property: "og:title", content: "Your quote | See See Bloom" },
      { property: "og:description", content: "Review and accept your quote online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedQuotePage,
});

function SharedQuotePage() {
  const { token } = Route.useParams();
  const fetchQuote = useServerFn(getSharedQuote);
  const respond = useServerFn(respondToQuote);

  const quoteQuery = useQuery({
    queryKey: ["shared-quote", token],
    queryFn: () => fetchQuote({ data: { token } }),
  });

  const decide = useMutation({
    mutationFn: (decision: "accept" | "decline") => respond({ data: { token, decision } }),
    onSuccess: (_result, decision) => {
      toast.success(decision === "accept" ? "Quote accepted — thank you!" : "Quote declined");
      void quoteQuery.refetch();
    },
    onError: () => toast.error("Sorry, we couldn't record that. Please email us."),
  });

  if (quoteQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const quote = quoteQuery.data;
  if (!quote) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">This quote link isn't valid</h1>
        <p className="mt-4 text-muted-foreground">
          The link may have expired. Reply to your email and we'll send a fresh one.
        </p>
      </main>
    );
  }

  const decided = quote.status === "accepted" || quote.status === "declined";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">See See Bloom</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Quote {quote.number}</h1>
      <p className="mt-2 text-muted-foreground">
        Prepared for {quote.company || quote.customer_name}
        {quote.valid_until ? ` · valid until ${formatDate(quote.valid_until)}` : ""}
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-3">{line.description}</td>
                <td className="px-4 py-3">{line.quantity}</td>
                <td className="px-4 py-3">{formatMoney(line.unit_price_cents, quote.currency)}</td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(line.amount_cents, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
        {quote.setup_cents ? (
          <Row label="Setup" value={formatMoney(quote.setup_cents, quote.currency)} />
        ) : null}
        {quote.freight_cents ? (
          <Row label="Freight" value={formatMoney(quote.freight_cents, quote.currency)} />
        ) : null}
        {quote.discount_cents ? (
          <Row label="Discount" value={`-${formatMoney(quote.discount_cents, quote.currency)}`} />
        ) : null}
        {quote.tax_cents ? (
          <Row
            label={`GST (${quote.tax_rate}%)`}
            value={formatMoney(quote.tax_cents, quote.currency)}
          />
        ) : null}
        <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(quote.total_cents, quote.currency)}</dd>
        </div>
      </dl>

      {quote.notes ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm">{quote.notes}</p>
        </section>
      ) : null}
      {quote.terms ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Terms
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{quote.terms}</p>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-8">
        {decided ? (
          <p className="text-sm font-medium">
            {quote.status === "accepted"
              ? "You've accepted this quote — we're on it."
              : "This quote was declined. Email us if you'd like it revisited."}
          </p>
        ) : (
          <>
            <Button onClick={() => decide.mutate("accept")} disabled={decide.isPending}>
              {decide.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Accept quote
            </Button>
            <Button
              variant="outline"
              onClick={() => decide.mutate("decline")}
              disabled={decide.isPending}
            >
              <X className="size-4" />
              Decline
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
