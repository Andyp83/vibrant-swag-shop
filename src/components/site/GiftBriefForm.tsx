import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { confirmQuoteRequest } from "@/lib/backoffice/quote-confirm.functions";

const giftBriefSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  occasion: z.string().trim().min(2, "Tell us the occasion").max(160),
  recipients: z
    .string()
    .trim()
    .max(9)
    .regex(/^\d*$/, "Number of recipients must be a whole number")
    .optional()
    .or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  packInterest: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().min(10, "Tell us a little more about the gift").max(2000),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof giftBriefSchema>, string>>;

/** Gift brief form used on the Gift Packs page and from the gifting menu. */
export function GiftBriefForm({ defaultPack }: { defaultPack?: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sendConfirmation = useServerFn(confirmQuoteRequest);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const parsed = giftBriefSchema.safeParse(raw);

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

    setErrors({});
    setSubmitting(true);

    try {
      const values = parsed.data;
      const requestId = crypto.randomUUID();
      const detailLines = [
        values.packInterest ? `Gift pack of interest: ${values.packInterest}` : null,
        `Occasion: ${values.occasion}`,
        values.notes,
      ].filter(Boolean);

      const { error } = await supabase.from("quote_requests").insert({
        id: requestId,
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest: `Gift packs — ${values.packInterest || values.occasion}`.slice(0, 200),
        quantity: values.recipients ? Number(values.recipients) : null,
        decoration: "Gift packs",
        required_by: values.deadline || null,
        budget: values.budget || null,
        notes: detailLines.join("\n\n"),
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
    } catch (error) {
      console.error("Gift brief failed", error);
      toast.error("Something went wrong sending your brief. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-spectrum-green" aria-hidden="true" />
        <h2 className="display-type mt-6 text-4xl">Gift brief received</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A confirmation is on its way to your inbox. We'll come back with two or three curated pack
          options, usually within one business day.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/portal"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Track it in your portal
          </Link>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold"
          >
            Send another brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8 text-left">
      <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <legend className="display-type px-2 text-base">Your details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <GiftField label="Full name" name="fullName" required error={errors.fullName} />
          <GiftField label="Work email" name="email" type="email" required error={errors.email} />
          <GiftField label="Company" name="company" error={errors.company} />
          <GiftField label="Phone" name="phone" type="tel" error={errors.phone} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <legend className="display-type px-2 text-base">The gift</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <GiftField
            label="Occasion"
            name="occasion"
            required
            placeholder="e.g. Christmas client gifts, new starter kits"
            error={errors.occasion}
          />
          <GiftField
            label="Gift pack of interest"
            name="packInterest"
            defaultValue={defaultPack}
            placeholder="e.g. Wine & cheese hamper"
            error={errors.packInterest}
          />
          <GiftField
            label="How many recipients"
            name="recipients"
            inputMode="numeric"
            placeholder="e.g. 60"
            error={errors.recipients}
          />
          <GiftField
            label="Budget per pack (AUD)"
            name="budget"
            placeholder="e.g. $75"
            error={errors.budget}
          />
          <GiftField label="Needed by" name="deadline" type="date" error={errors.deadline} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">
            Brief details <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={5}
            maxLength={2000}
            placeholder="Who the gifts are for, branding on the box or card, dietary or alcohol preferences, delivery addresses…"
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Send gift brief
      </button>
    </form>
  );
}

function GiftField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  inputMode,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric";
  defaultValue?: string | undefined;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
