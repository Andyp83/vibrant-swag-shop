import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { confirmQuoteRequest } from "@/lib/backoffice/quote-confirm.functions";
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

/** Sends the whole shortlist — every line with its decoration, quantity and notes — as one quote request. */
export function ShortlistQuoteForm({
  items,
  onSent,
}: {
  items: ShortlistItem[];
  onSent?: () => void;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sendConfirmation = useServerFn(confirmQuoteRequest);

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
      const requestId = crypto.randomUUID();
      const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const body = [
        `Shortlist quote request — ${items.length} item${items.length === 1 ? "" : "s"}:`,
        shortlistSummary(items),
        values.notes ? `Additional information:\n${values.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error } = await supabase.from("quote_requests").insert({
        id: requestId,
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest: items
          .map((item) => item.name)
          .join(", ")
          .slice(0, 200),
        quantity: totalQuantity > 0 ? totalQuantity : null,
        decoration: items.find((item) => item.decoration)?.decoration ?? null,
        required_by: values.deadline || null,
        budget: values.budget || null,
        notes: body,
        file_paths: [],
      });
      if (error) throw error;

      try {
        await sendConfirmation({ data: { requestId } });
      } catch (emailError) {
        console.error("Confirmation email failed", emailError);
      }

      setDone(true);
      form.reset();
      onSent?.();
    } catch (error) {
      console.error("Shortlist quote request failed", error);
      toast.error("Something went wrong sending your shortlist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-secondary p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-spectrum-green" aria-hidden="true" />
        <h2 className="display-type mt-5 text-3xl">Shortlist sent</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          A confirmation is on its way to your inbox. We'll price every item on your list, usually
          within one business day.
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
        {submitting ? "Sending…" : `Submit shortlist (${items.length})`}
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
