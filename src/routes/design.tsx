import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { CheckCircle2, FileImage, Loader2, Palette, PenTool, Ruler } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { confirmQuoteRequest } from "@/lib/backoffice/quote-confirm.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TITLE = "Design & Print Brief — Studio Artwork Setup | See See Bloom";
const DESCRIPTION =
  "Send your print brief to the See See Bloom studio: sizes, stock, quantities and artwork. We set up the files, proof them and print — anywhere in Australia.";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/design" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/design" }],
  }),
  component: DesignPage,
});

const steps = [
  {
    n: "01",
    title: "Tell us what you're printing",
    body: "Item, finished size, stock or material, quantity and the date it needs to land. A rough idea is enough to start.",
  },
  {
    n: "02",
    title: "Send artwork — or let us make it",
    body: "Print-ready PDF, or supply your logo and copy and our studio designs it from scratch.",
  },
  {
    n: "03",
    title: "Approve the proof",
    body: "We send a digital proof with colours and dimensions marked up. You sign it off, we print.",
  },
];

const specs = [
  {
    icon: FileImage,
    title: "File formats",
    body: "PDF, AI, EPS or SVG for vector work. High-resolution PNG or TIFF for photography.",
  },
  {
    icon: Ruler,
    title: "Size and bleed",
    body: "Supply at final size with 3mm bleed and keep type 5mm inside the trim edge.",
  },
  {
    icon: Palette,
    title: "Colour",
    body: "CMYK for full-colour print, Pantone references for spot colours and brand matching.",
  },
  {
    icon: PenTool,
    title: "Resolution",
    body: "300dpi for print, 150dpi for large-format signage viewed from a distance.",
  },
];

const briefSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  printItem: z.string().trim().min(2, "Tell us what you're printing").max(160),
  finishedSize: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z
    .string()
    .trim()
    .max(9)
    .regex(/^\d*$/, "Quantity must be a whole number")
    .optional()
    .or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  artworkState: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().min(10, "Tell us a little more about the print brief").max(2000),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof briefSchema>, string>>;

function DesignPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const sendConfirmation = useServerFn(confirmQuoteRequest);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const parsed = briefSchema.safeParse(raw);

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

      // Attach the client's artwork so the studio has it with the brief from the start.
      const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${folder}/${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("quote-uploads")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        paths.push(path);
      }
      const detailLines = [
        values.finishedSize ? `Finished size: ${values.finishedSize}` : null,
        values.artworkState ? `Artwork status: ${values.artworkState}` : null,
        values.notes,
      ].filter(Boolean);

      const { error } = await supabase.from("quote_requests").insert({
        id: requestId,
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest: `Print — ${values.printItem}`.slice(0, 200),
        quantity: values.quantity ? Number(values.quantity) : null,
        decoration: "Print",
        required_by: values.deadline || null,
        budget: values.budget || null,
        notes: detailLines.join("\n\n"),
        file_paths: paths,
      });
      if (error) throw error;

      try {
        await sendConfirmation({ data: { requestId } });
      } catch (emailError) {
        console.error("Confirmation email failed", emailError);
      }

      setDone(true);
      setFiles([]);
      form.reset();
    } catch (error) {
      console.error("Print brief failed", error);
      toast.error("Something went wrong sending your brief. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="border-b border-border bg-accent/40 px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Design studio
          </p>
          <h1 className="display-type mt-4 text-4xl sm:text-6xl">Send us a print brief</h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            Business cards, signage, labels, flyers and large-format — our studio sets up the
            artwork, proofs it with you and manages the print run. Prices in AUD, delivered
            Australia-wide.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#print-brief"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Start a print brief
            </a>
            <Link
              to="/print"
              className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold"
            >
              Browse the print range
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="display-type text-2xl sm:text-3xl">How a print brief works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold text-muted-foreground">{step.n}</p>
              <h3 className="display-type mt-2 text-base">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-accent/40 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="display-type text-2xl sm:text-3xl">What to include in your artwork</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Nothing here is a deal-breaker — send what you have and we'll tidy the rest.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specs.map((spec) => (
              <div key={spec.title} className="rounded-2xl border border-border bg-card p-5">
                <spec.icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="display-type mt-3 text-base">{spec.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{spec.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/colour-guide"
              className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold"
            >
              Colour guide
            </Link>
            <Link
              to="/decoration"
              className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold"
            >
              Decoration methods
            </Link>
          </div>
        </div>
      </section>

      <section id="print-brief" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-16">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-14 text-spectrum-green" aria-hidden="true" />
            <h2 className="display-type mt-6 text-4xl">Brief received</h2>
            <p className="mt-4 text-muted-foreground">
              Thanks — your print brief is with our studio. We'll come back with pricing and any
              artwork questions, usually within one business day. You can follow it in your client
              portal.
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
        ) : (
          <>
            <h2 className="display-type text-2xl sm:text-3xl">Print brief</h2>
            <p className="mt-3 text-muted-foreground">
              The more detail you give us, the sharper the quote. Artwork files can follow by email
              or through your portal.
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
                <legend className="display-type px-2 text-base">The print brief</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="What are you printing"
                    name="printItem"
                    required
                    placeholder="e.g. Business cards, pull-up banner"
                    error={errors.printItem}
                  />
                  <Field
                    label="Finished size"
                    name="finishedSize"
                    placeholder="e.g. 90 x 55mm, A2, 850 x 2000mm"
                    error={errors.finishedSize}
                  />
                  <Field
                    label="Quantity"
                    name="quantity"
                    inputMode="numeric"
                    placeholder="e.g. 500"
                    error={errors.quantity}
                  />
                  <Field
                    label="Budget (AUD)"
                    name="budget"
                    placeholder="e.g. $600"
                    error={errors.budget}
                  />
                  <Field
                    label="Artwork status"
                    name="artworkState"
                    placeholder="Print-ready / needs setup / design from scratch"
                    error={errors.artworkState}
                  />
                  <Field label="Needed by" name="deadline" type="date" error={errors.deadline} />
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
                    placeholder="Stock or material, finishes (matt, gloss, foil), single or double sided, delivery address, brand colours…"
                  />
                  {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork">Artwork or logo files (optional, max 25MB each)</Label>
                  <Input
                    id="artwork"
                    type="file"
                    multiple
                    accept=".pdf,.ai,.eps,.svg,.png,.jpg,.jpeg,.tif,.tiff,.zip"
                    onChange={(event) => {
                      const picked = Array.from(event.target.files ?? []);
                      const tooBig = picked.find((file) => file.size > 25 * 1024 * 1024);
                      if (tooBig) {
                        toast.error(`${tooBig.name} is larger than 25MB`);
                        event.target.value = "";
                        setFiles([]);
                        return;
                      }
                      setFiles(picked);
                    }}
                  />
                  {files.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {files.length} file{files.length === 1 ? "" : "s"} ready to send
                    </p>
                  )}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Send print brief
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
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
