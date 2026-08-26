import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  CheckCircle2,
  Clock,
  Compass,
  Factory,
  Loader2,
  Paperclip,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { confirmQuoteRequest } from "@/lib/backoffice/quote-confirm.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Custom Product Sourcing & Procurement | See See Bloom" },
      {
        name: "description",
        content:
          "Need something that isn't in our catalogue? Describe it and our procurement team sources it — custom-made or off-market — with a sourcing plan and indicative pricing inside 72 hours.",
      },
      { property: "og:title", content: "Custom Product Sourcing & Procurement | See See Bloom" },
      {
        property: "og:description",
        content:
          "Request any product, catalogued or not. Our sourcing team returns options and indicative pricing within 72 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProcurementPage,
});

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 6;

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  item: z.string().trim().min(3, "Tell us what you're after").max(200),
  quantity: z
    .string()
    .trim()
    .max(9)
    .regex(/^\d*$/, "Quantity must be a whole number")
    .optional()
    .or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  branding: z.string().trim().max(160).optional().or(z.literal("")),
  reference: z.string().trim().max(300).optional().or(z.literal("")),
  brief: z.string().trim().min(10, "A little more detail helps us source it").max(2000),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

const steps = [
  {
    icon: Search,
    title: "1 · You describe it",
    copy: "Anything goes — an existing product we don't stock, a competitor's item, a sketch, or a concept that doesn't exist yet.",
  },
  {
    icon: Compass,
    title: "2 · We source it",
    copy: "Our procurement team works local stock, offshore factories and specialist makers to find viable routes and honest lead times.",
  },
  {
    icon: Factory,
    title: "3 · You get options",
    copy: "Within 72 hours you receive a sourcing plan: options, indicative pricing, minimums, decoration methods and realistic timing.",
  },
] as const;

function ProcurementPage() {
  const sendConfirmation = useServerFn(confirmQuoteRequest);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const accepted = picked.filter((file) => {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 20MB`);
        return false;
      }
      return true;
    });
    setFiles((prev) => {
      const next = [...prev, ...accepted];
      if (next.length > MAX_FILES) toast.error(`You can attach up to ${MAX_FILES} files`);
      return next.slice(0, MAX_FILES);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >;
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

    setErrors({});
    setSubmitting(true);

    try {
      const folder = `sourcing/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${folder}/${safeName}`;
        const { error } = await supabase.storage.from("quote-uploads").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        paths.push(path);
      }

      const values = parsed.data;
      const requestId = crypto.randomUUID();
      const notes = [
        "SOURCING / PROCUREMENT REQUEST (72-hour target)",
        `Item wanted: ${values.item}`,
        values.branding ? `Branding idea: ${values.branding}` : null,
        values.reference ? `References: ${values.reference}` : null,
        "",
        values.brief,
      ]
        .filter((line) => line !== null)
        .join("\n");

      const { error } = await supabase.from("quote_requests").insert({
        id: requestId,
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest: `Sourcing: ${values.item}`.slice(0, 200),
        decoration: values.branding || null,
        quantity: values.quantity ? Number(values.quantity) : null,
        required_by: values.deadline || null,
        budget: values.budget || null,
        notes,
        file_paths: paths,
      });
      if (error) throw error;

      try {
        await sendConfirmation({ data: { requestId } });
      } catch (emailError) {
        console.error("Confirmation email failed", emailError);
      }

      setFiles([]);
      setDone(true);
    } catch (error) {
      console.error("Sourcing request failed", error);
      toast.error("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-28 text-center">
        <CheckCircle2 className="mx-auto size-14 text-spectrum-green" aria-hidden="true" />
        <h1 className="display-type mt-6 text-4xl">Sourcing request received</h1>
        <p className="mt-4 text-muted-foreground">
          Our procurement team is on it. You'll hear back within 72 hours with sourcing options,
          indicative pricing, minimums and realistic lead times — even if the answer is "here's a
          smarter alternative".
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/products"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Browse the catalogue
          </Link>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold"
          >
            Source something else
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Procurement &amp; sourcing
      </p>
      <h1 className="display-type mt-4 text-4xl sm:text-5xl">Can't find it? We'll source it.</h1>
      <p className="mt-5 text-muted-foreground">
        Our catalogue is a starting point, not a limit. Ask us for anything — an item we don't list,
        a bespoke build, a full custom-manufacture run, or something that doesn't exist yet. If it
        can be made or found, we'll chase it down for you.
      </p>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 px-5 py-4">
        <Clock className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-semibold">72-hour sourcing response.</span>{" "}
          <span className="text-muted-foreground">
            Suggested timeframe for custom and off-catalogue items — complex tooling or offshore
            manufacture may take longer, and we'll tell you upfront.
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
            <step.icon className="size-5 text-primary" aria-hidden="true" />
            <h2 className="display-type mt-3 text-base">{step.title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">{step.copy}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-12 space-y-8">
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
          <legend className="display-type px-2 text-base">What should we source?</legend>
          <Field
            label="Item or idea"
            name="item"
            required
            placeholder="e.g. Custom-moulded pet bandanas, or a bamboo desk organiser"
            error={errors.item}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Quantity"
              name="quantity"
              type="number"
              placeholder="e.g. 500"
              error={errors.quantity}
            />
            <Field label="Needed by" name="deadline" type="date" error={errors.deadline} />
            <Field
              label="Target price"
              name="budget"
              placeholder="e.g. $8 per unit"
              error={errors.budget}
            />
            <Field
              label="Branding idea"
              name="branding"
              placeholder="e.g. Full-colour print, or not sure yet"
              error={errors.branding}
            />
          </div>
          <Field
            label="Reference links"
            name="reference"
            placeholder="Paste a product URL, competitor page or supplier link"
            error={errors.reference}
          />
          <div className="space-y-2">
            <Label htmlFor="brief">
              Tell us more <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="brief"
              name="brief"
              rows={5}
              maxLength={2000}
              required
              placeholder="Who is it for, materials, sizes, colours, packaging, any must-haves or deal-breakers?"
              aria-invalid={Boolean(errors.brief)}
            />
            {errors.brief && <p className="text-xs text-destructive">{errors.brief}</p>}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-card p-6">
          <legend className="display-type px-2 text-base">References &amp; artwork</legend>
          <p className="mt-2 text-xs text-muted-foreground">
            Optional — sketches, photos, spec sheets or your logo files all help us source the right
            thing first time.
          </p>
          <label
            htmlFor="sourcing-files"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary px-6 py-10 text-center transition-colors hover:border-primary"
          >
            <UploadCloud className="size-7 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold">Choose files to upload</span>
            <span className="text-xs text-muted-foreground">
              Up to {MAX_FILES} files · 20MB each
            </span>
            <input
              id="sourcing-files"
              type="file"
              multiple
              className="sr-only"
              onChange={addFiles}
            />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, index) => index !== i))}
                    className="shrink-0 rounded-full p-1 hover:bg-accent"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Sending…" : "Send sourcing request"}
        </button>

        <p className="text-xs text-muted-foreground">
          Already know the product? The{" "}
          <Link to="/quote" className="underline underline-offset-4">
            standard quote form
          </Link>{" "}
          is faster — catalogue items are usually quoted within one business day.
        </p>
      </form>
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
  type?: string | undefined;
  required?: boolean | undefined;
  placeholder?: string | undefined;
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
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
