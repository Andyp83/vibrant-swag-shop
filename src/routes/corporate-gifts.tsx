import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Gift, Loader2, Package, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/corporate-gifts")({
  head: () => ({
    meta: [
      { title: "Corporate Gifts & Gift Packs, Branded in Australia | See See Bloom" },
      {
        name: "description",
        content:
          "Curated corporate gift packs and hampers, branded with your logo and delivered Australia-wide. Tell us the occasion, budget and headcount — we do the rest.",
      },
      {
        property: "og:title",
        content: "Corporate Gifts & Gift Packs, Branded in Australia | See See Bloom",
      },
      {
        property: "og:description",
        content:
          "Curated corporate gift packs and hampers, branded with your logo and delivered Australia-wide.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/corporate-gifts" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/corporate-gifts" }],
  }),
  component: CorporateGiftsPage,
});

const giftPacks = [
  {
    title: "Welcome & onboarding packs",
    body: "First-day kits with apparel, drinkware and stationery, packed per person and shipped to the office or straight to home desks.",
  },
  {
    title: "Client thank-you hampers",
    body: "Food, drink and keepsake hampers with a branded card and your logo on the box — a gift worth remembering.",
  },
  {
    title: "Event & conference gifting",
    body: "Delegate satchels, speaker gifts and prize packs, kitted in bulk and delivered to your venue on schedule.",
  },
  {
    title: "Milestone & recognition gifts",
    body: "Work anniversaries, deal closes and end-of-year gifting with premium pieces and personalised decoration.",
  },
];

const steps = [
  {
    n: "01",
    title: "Share the occasion",
    body: "Who it's for, how many, your budget per gift and when it needs to land.",
  },
  {
    n: "02",
    title: "We curate the packs",
    body: "A shortlist of gift pack concepts within budget, with decoration suggestions for each.",
  },
  {
    n: "03",
    title: "Approve and relax",
    body: "You sign off the proof; we brand, kit and deliver — bulk or to individual doors.",
  },
];

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  occasion: z.string().trim().max(200).optional().or(z.literal("")),
  recipients: z
    .string()
    .trim()
    .max(9)
    .regex(/^\d*$/, "Recipients must be a whole number")
    .optional()
    .or(z.literal("")),
  budgetPerGift: z.string().trim().max(60).optional().or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().min(10, "Tell us a little more about the gifting brief").max(2000),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof enquirySchema>, string>>;

function CorporateGiftsPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const parsed = enquirySchema.safeParse(raw);

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
      const { error } = await supabase.from("quote_requests").insert({
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest: values.occasion
          ? `Corporate gifts — ${values.occasion}`.slice(0, 200)
          : "Corporate gifts enquiry",
        quantity: values.recipients ? Number(values.recipients) : null,
        required_by: values.deadline || null,
        budget: values.budgetPerGift ? `${values.budgetPerGift} per gift` : null,
        notes: values.notes,
        file_paths: [],
      });
      if (error) throw error;
      setDone(true);
      form.reset();
    } catch (error) {
      console.error("Gift enquiry failed", error);
      toast.error("Something went wrong sending your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="border-b border-border bg-accent/40 px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Corporate gifts
          </p>
          <h1 className="display-type mt-4 text-4xl sm:text-6xl">
            Corporate gifts worth remembering
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            Branded gift packs, hampers and onboarding kits — curated around your budget, decorated
            with your logo and delivered anywhere in Australia. Bulk to one address, or kitted and
            shipped to individual doors.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#gift-enquiry"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Start a gift enquiry
            </a>
            <Link
              to="/products/$category"
              params={{ category: "hampers-gifting" }}
              className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold"
            >
              Browse hampers & gifting
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="display-type text-2xl sm:text-3xl">Gift packs we build</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every pack is assembled to order — products, decoration, custom packaging and a personal
          note if you'd like one.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {giftPacks.map((pack) => (
            <div key={pack.title} className="rounded-2xl border border-border bg-card p-5">
              <Gift className="size-6 text-primary" aria-hidden="true" />
              <h3 className="display-type mt-3 text-base">{pack.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pack.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/products/$category"
            params={{ category: "gift-packs" }}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold"
          >
            Shop ready-made gift packs
          </Link>
          <Link
            to="/products/$category"
            params={{ category: "hampers-gifting" }}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold"
          >
            Shop hampers & gifting
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-accent/40 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="display-type text-2xl sm:text-3xl">How gifting works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground">{step.n}</p>
                <h3 className="display-type mt-2 text-base">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Package className="size-4 text-primary" aria-hidden="true" /> Bulk or individual
              delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" /> Custom packaging and
              branded cards
            </span>
          </div>
        </div>
      </section>

      <section id="gift-enquiry" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-16">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-14 text-spectrum-green" aria-hidden="true" />
            <h2 className="display-type mt-6 text-4xl">Enquiry received</h2>
            <p className="mt-4 text-muted-foreground">
              Thanks — your gifting brief is with our studio. We'll come back with curated gift pack
              concepts and pricing, usually within one business day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/products/$category"
                params={{ category: "hampers-gifting" }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Browse hampers & gifting
              </Link>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold"
              >
                Send another enquiry
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="display-type text-2xl sm:text-3xl">Gift enquiry</h2>
            <p className="mt-3 text-muted-foreground">
              Tell us the occasion, headcount and budget — we'll curate the packs. Prices in AUD,
              delivery Australia-wide.
            </p>
            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-8">
              <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
                <legend className="display-type px-2 text-base">Your details</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="fullName" required error={errors.fullName} />
                  <Field label="Work email" name="email" type="email" required error={errors.email} />
                  <Field label="Company" name="company" error={errors.company} />
                  <Field label="Phone" name="phone" type="tel" error={errors.phone} />
                </div>
              </fieldset>

              <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
                <legend className="display-type px-2 text-base">The gifting brief</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Occasion"
                    name="occasion"
                    placeholder="e.g. Client thank-you, onboarding"
                    error={errors.occasion}
                  />
                  <Field
                    label="Number of recipients"
                    name="recipients"
                    inputMode="numeric"
                    placeholder="e.g. 50"
                    error={errors.recipients}
                  />
                  <Field
                    label="Budget per gift (AUD)"
                    name="budgetPerGift"
                    placeholder="e.g. $75"
                    error={errors.budgetPerGift}
                  />
                  <Field
                    label="Needed by"
                    name="deadline"
                    type="date"
                    error={errors.deadline}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Anything else we should know <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={5}
                    maxLength={2000}
                    placeholder="Who the gifts are for, styles you like, dietary needs for hampers, delivery addresses…"
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
                Send gift enquiry
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  inputMode,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric";
  error?: string;
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
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
