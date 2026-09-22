import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/backoffice/format";
import type { PricedQuote } from "@/lib/pricing/engine";
import { priceShortlist, submitShortlistQuote } from "@/lib/pricing/quote.functions";
import { shortlistSummary, type ShortlistItem } from "@/lib/shortlist";

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function toLines(items: ShortlistItem[]) {
  return items.slice(0, 30).map((item) => ({
    productId: /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null,
    name: item.name.slice(0, 200),
    decoration: item.decoration.slice(0, 120),
    quantity: Math.max(1, Number(item.quantity) || 1),
    notes: item.notes.slice(0, 500),
  }));
}

/** Sends the whole shortlist — every line with its decoration, quantity and notes — as one priced quote. */
export function ShortlistQuoteForm({
  items,
  onSent,
}: {
  items: ShortlistItem[];
  onSent?: () => void;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ quoteNumber: string; pricing: PricedQuote } | null>(null);
  const priceItems = useServerFn(priceShortlist);
  const submit = useServerFn(submitShortlistQuote);

  const lines = useMemo(() => toLines(items), [items]);

  const estimate = useQuery({
    queryKey: ["shortlist-estimate", lines],
    queryFn: () => priceItems({ data: { items: lines } }),
    enabled: lines.length > 0 && !result,
    staleTime: 60_000,
    retry: false,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please check the highlighted fields");
      return;
    }

    if (items.length === 0) {
      toast.error("Your shortlist is empty");
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const values = parsed.data;
      const response = await submit({
        data: {
          items: lines,
          fullName: values.fullName,
          email: values.email,
          company: values.company ?? "",
          phone: values.phone ?? "",
          deadline: values.deadline ?? "",
          budget: values.budget ?? "",
          notes: values.notes ?? "",
          summary: shortlistSummary(items).slice(0, 4000),
        },
      });

      setResult({ quoteNumber: response.quoteNumber, pricing: response.pricing });
      form.reset();
      onSent?.();
    } catch (error) {
      console.error("Shortlist quote request failed", error);
      toast.error("Something went wrong sending your shortlist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-border bg-secondary p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-spectrum-green" aria-hidden="true" />
        <h2 className="display-type mt-5 text-3xl">Shortlist priced</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Quote {result.quoteNumber} has been costed from your list — {" "}
          {formatMoney(result.pricing.totalCents)} including GST and freight. We're checking it over
          and you'll see it in your portal as soon as it's confirmed, usually within one business
          day.
        </p>
        <Link
          to="/portal"
          className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Track it in your portal
        </Link>
      </div>
    );
  }

  const pricing = estimate.data;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <h2 className="display-type text-2xl">Send this shortlist for pricing</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We'll quote every item above — with the decoration, quantity and notes you've set on each
        line.
      </p>

      {pricing && pricing.lines.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-accent/40 px-4 py-2 text-sm font-semibold">
            Estimate
          </div>
          <ul className="divide-y divide-border text-sm">
            {pricing.lines.map((line, index) => (
              <li key={`${line.name}-${index}`} className="flex flex-wrap gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} units
                    {line.decoration ? ` · ${line.decoration}` : ""}
                    {line.priced ? ` · ${formatMoney(line.unitPriceCents)} each` : ""}
                    {line.setupCents > 0 ? ` · setup ${formatMoney(line.setupCents)}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">
                  {line.priced ? formatMoney(line.amountCents) : "Price on application"}
                </p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-border bg-secondary/60 px-4 py-3 text-sm">
            {pricing.setupCents > 0 && (
              <Row label="Setups" value={formatMoney(pricing.setupCents)} />
            )}
            <Row label="Freight" value={formatMoney(pricing.freightCents)} />
            <Row label={`GST ${pricing.taxRate}%`} value={formatMoney(pricing.taxCents)} />
            <Row label="Estimated total" value={formatMoney(pricing.totalCents)} strong />
          </dl>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Indicative only — we confirm every price, and{" "}
            {pricing.unpricedCount > 0
              ? `${pricing.unpricedCount} item${pricing.unpricedCount === 1 ? "" : "s"} on your list need a manual quote.`
              : "larger runs often come in lower."}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="fullName" required error={errors.fullName} />
        <Field label="Work email" name="email" type="email" required error={errors.email} />
        <Field label="Company" name="company" error={errors.company} />
        <Field label="Phone" name="phone" type="tel" error={errors.phone} />
        <Field label="Needed by" name="deadline" type="date" error={errors.deadline} />
        <Field
          label="Budget (optional)"
          name="budget"
          placeholder="e.g. $5,000"
          error={errors.budget}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="shortlist-notes">Anything else we should know?</Label>
        <Textarea
          id="shortlist-notes"
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Delivery address, event date, brand colours, logo formats…"
        />
        {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {submitting ? "Pricing…" : `Submit shortlist (${items.length})`}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        Need to attach logo files?{" "}
        <Link to="/quote" search={{ shortlist: true }} className="underline underline-offset-4">
          Use the full quote form
        </Link>{" "}
        — your shortlist comes with you.
      </p>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`shortlist-${name}`}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={`shortlist-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
