import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Loader2,
  Paperclip,
  UploadCloud,
  X,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { confirmQuoteRequest } from "@/lib/backoffice/quote-confirm.functions";

import { decorations } from "@/lib/catalog";
import { getArtworkSpec, fileExtension, isRaster } from "@/lib/artwork-specs";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/quote")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { product?: string; decoration?: string; shortlist?: boolean } => {
    const out: { product?: string; decoration?: string; shortlist?: boolean } = {};
    if (typeof search["product"] === "string" && search["product"])
      out.product = search["product"] as string;
    if (typeof search["decoration"] === "string" && search["decoration"])
      out.decoration = search["decoration"] as string;
    if (search["shortlist"] === true || search["shortlist"] === "true") out.shortlist = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Request a Quote & Upload Your Logo | See See Bloom" },
      {
        name: "description",
        content:
          "Send us your brief and upload your logo files. We reply with a curated merchandise shortlist and pricing, usually within one business day.",
      },
      { property: "og:title", content: "Request a Quote & Upload Your Logo | See See Bloom" },
      {
        property: "og:description",
        content:
          "Upload logo files and tell us your brief — curated merchandise shortlist and pricing within one business day.",
      },
    ],
  }),
  component: QuotePage,
});

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 6;

const quoteSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  productInterest: z.string().trim().max(200).optional().or(z.literal("")),
  decorationMethod: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z
    .string()
    .trim()
    .max(9)
    .regex(/^\d*$/, "Quantity must be a whole number")
    .optional()
    .or(z.literal("")),
  deadline: z.string().trim().max(20).optional().or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  brief: z.string().trim().min(10, "Tell us a little more about the brief").max(2000),
  password: z
    .string()
    .max(72)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.length >= 8, "Password must be at least 8 characters"),
});


type FieldErrors = Partial<Record<keyof z.infer<typeof quoteSchema>, string>>;

function QuotePage() {
  const { product, decoration } = Route.useSearch();
  const preselectedDecoration = decoration
    ? (decorations.find(
        (d) =>
          d.slug === decoration ||
          d.name.toLowerCase() === decoration.toLowerCase(),
      )?.name ?? "")
    : "";
  const categories = useQuery(catalogQueryOptions()).data ?? [];
  const sendConfirmation = useServerFn(confirmQuoteRequest);
  const { items: shortlist, clear: clearShortlist, remove: removeShortlisted } = useShortlist();
  const [files, setFiles] = useState<File[]>([]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [method, setMethod] = useState(preselectedDecoration);
  const [lowRes, setLowRes] = useState<string[]>([]);
  const [artworkConfirmed, setArtworkConfirmed] = useState(false);
  const [artworkError, setArtworkError] = useState("");

  const spec = getArtworkSpec(method);
  const invalidFiles = files.filter((f) => !spec.fileTypes.includes(fileExtension(f.name)));

  async function measure(file: File) {
    if (!isRaster(file.name) || spec.minRasterEdge === 0) return;
    try {
      const url = URL.createObjectURL(file);
      const bitmap = await createImageBitmap(file).finally(() => URL.revokeObjectURL(url));
      if (Math.min(bitmap.width, bitmap.height) < spec.minRasterEdge) {
        setLowRes((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]));
      }
    } catch {
      /* unreadable formats (PSD, TIFF) are checked by our studio instead */
    }
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const accepted: File[] = [];
    for (const file of picked) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 20MB`);
        continue;
      }
      if (!spec.fileTypes.includes(fileExtension(file.name))) {
        toast.error(
          `${file.name} isn't a supported format for ${method || "this brief"} — use ${spec.fileTypes.join(", ")}`,
        );
        continue;
      }
      accepted.push(file);
      void measure(file);
    }
    setArtworkError("");
    setFiles((prev) => {
      const next = [...prev, ...accepted];
      if (next.length > MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files`);
      }
      return next.slice(0, MAX_FILES);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries()) as Record<string, string>;
    const parsed = quoteSchema.safeParse(raw);

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

    if (invalidFiles.length > 0) {
      setErrors({});
      setArtworkError(
        `${invalidFiles.map((f) => f.name).join(", ")} ${invalidFiles.length > 1 ? "aren't" : "isn't"} accepted for ${method}. Accepted: ${spec.fileTypes.join(", ")}.`,
      );
      toast.error("Please fix the artwork files before sending");
      return;
    }

    if (files.length > 0 && spec.confirmRequired && !artworkConfirmed) {
      setErrors({});
      setArtworkError("Please confirm the resolution and bleed requirements for this method.");
      toast.error("Confirm the artwork requirements to continue");
      return;
    }

    setErrors({});
    setArtworkError("");
    setSubmitting(true);


    try {
      const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
      const shortlistText =
        shortlist.length > 0 ? `\n\nShortlisted items:\n${shortlistSummary(shortlist)}` : "";
      const shortlistProducts = shortlist.map((item) => item.name).join(", ");
      const { error } = await supabase.from("quote_requests").insert({
        id: requestId,
        name: values.fullName,
        email: values.email,
        company: values.company || null,
        phone: values.phone || null,
        product_interest:
          values.productInterest || (shortlistProducts ? shortlistProducts.slice(0, 200) : null),
        decoration:
          values.decorationMethod ||
          (shortlist.find((item) => item.decoration)?.decoration ?? null),
        quantity: values.quantity ? Number(values.quantity) : null,
        required_by: values.deadline || null,
        budget: values.budget || null,
        notes: `${values.brief}${shortlistText}`,
        file_paths: paths,
      });

      if (error) throw error;

      if (values.password) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (signUpError) {
          toast.error(
            signUpError.message.toLowerCase().includes("registered")
              ? "Your brief is in. You already have an account — sign in from Client login."
              : `Your brief is in, but we couldn't set up your account: ${signUpError.message}`,
          );
        } else {
          setAccountCreated(true);
        }
      }

      // Confirmation email with a secure link into the quote timeline.
      try {
        await sendConfirmation({ data: { requestId } });
      } catch (emailError) {
        console.error("Confirmation email failed", emailError);
      }

      setDone(true);
      setFiles([]);
      clearShortlist();

    } catch (error) {
      console.error("Quote submission failed", error);
      toast.error("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-28 text-center">
        <CheckCircle2 className="mx-auto size-14 text-spectrum-green" aria-hidden="true" />
        <h1 className="display-type mt-6 text-4xl">Brief received</h1>
        <p className="mt-4 text-muted-foreground">
          Thanks — your request and any artwork are with our studio. We'll come back with a curated
          shortlist and pricing, usually within one business day. A confirmation email is on its way
          with a secure link to your quote timeline.
        </p>

        {accountCreated && (
          <p className="mt-4 text-sm text-muted-foreground">
            We've also started your client portal account — check your inbox to confirm your email,
            then sign in at <Link to="/auth" className="underline underline-offset-4">Client login</Link>{" "}
            to track this quote, sign proofs and follow your order.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/products"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Keep browsing products
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
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Get a quote
      </p>
      <h1 className="display-type mt-4 text-4xl sm:text-5xl">Tell us the brief</h1>
      <p className="mt-5 text-muted-foreground">
        Share the essentials and upload your logo or design files. Vector artwork (AI, EPS, PDF, SVG)
        reproduces best, but we can work from high-resolution PNGs too.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-8">
        <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <legend className="display-type px-2 text-base">Your details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="fullName" required error={errors.fullName} />
            <Field label="Work email" name="email" type="email" required error={errors.email} />
            <Field label="Company" name="company" error={errors.company} />
            <Field label="Phone" name="phone" type="tel" error={errors.phone} />
          </div>
          <div className="space-y-2 border-t border-border pt-5">
            <Label htmlFor="password">Create a client portal password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-muted-foreground">
              Optional, but this is the only way to create an account. Set a password and we'll open
              your portal so you can track this quote, sign proofs and follow your order. Already
              have an account? Leave it blank and{" "}
              <Link to="/auth" className="underline underline-offset-4">
                sign in
              </Link>
              .
            </p>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
        </fieldset>


        <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <legend className="display-type px-2 text-base">The project</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productInterest">Product interest</Label>
              <Input
                id="productInterest"
                name="productInterest"
                list="product-options"
                defaultValue={product ?? ""}
                placeholder="e.g. Insulated bottles"
                maxLength={200}
              />
              <datalist id="product-options">
                {categories.flatMap((c) => [
                  <option key={c.slug} value={c.name} />,
                  ...c.products.map((p) => <option key={`${c.slug}-${p.name}`} value={p.name} />),
                ])}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decorationMethod">Preferred decoration</Label>
              <select
                id="decorationMethod"
                name="decorationMethod"
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setArtworkConfirmed(false);
                  setArtworkError("");
                  setLowRes([]);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Not sure — recommend one</option>
                {decorations.map((d) => (
                  <option key={d.slug} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Quantity"
              name="quantity"
              type="number"
              placeholder="e.g. 250"
              error={errors.quantity}
            />
            <Field label="Needed by" name="deadline" type="date" error={errors.deadline} />
            <Field
              label="Budget guide"
              name="budget"
              placeholder="e.g. £12 per pack"
              error={errors.budget}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">
              Brief <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="brief"
              name="brief"
              rows={5}
              maxLength={2000}
              required
              placeholder="Who is it for, what's the occasion, any colours or products you already have in mind?"
              aria-invalid={Boolean(errors.brief)}
            />
            {errors.brief && <p className="text-xs text-destructive">{errors.brief}</p>}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-card p-6">
          <legend className="display-type px-2 text-base">Logos & designs</legend>

          <div className="mt-2 rounded-xl border border-border bg-secondary/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Artwork requirements{method ? ` · ${method}` : ""}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold">File types</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{spec.formatGuidance}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold">Resolution</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{spec.dpi}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold">Bleed</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{spec.bleed}</dd>
              </div>
            </dl>
            {spec.notes.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {spec.notes.map((note) => (
                  <li key={note} className="flex gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
            {!method && (
              <p className="mt-4 text-xs text-muted-foreground">
                Pick a preferred decoration above to see the exact file, resolution and bleed rules.
              </p>
            )}
          </div>

          <label
            htmlFor="artwork"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary px-6 py-10 text-center transition-colors hover:border-primary"
          >
            <UploadCloud className="size-7 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold">Choose files to upload</span>
            <span className="text-xs text-muted-foreground">
              {spec.fileTypes.map((t) => t.replace(".", "").toUpperCase()).join(" · ")} · up to{" "}
              {MAX_FILES} files · 20MB each
            </span>
            <input
              id="artwork"
              type="file"
              multiple
              accept={spec.fileTypes.join(",")}
              className="sr-only"
              onChange={addFiles}
            />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => {
                const badType = !spec.fileTypes.includes(fileExtension(file.name));
                const soft = lowRes.includes(file.name);
                return (
                  <li
                    key={`${file.name}-${i}`}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      badType ? "border-destructive/60 bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => {
                          setFiles((prev) => prev.filter((_, index) => index !== i));
                          setLowRes((prev) => prev.filter((n) => n !== file.name));
                          setArtworkError("");
                        }}
                        className="shrink-0 rounded-full p-1 hover:bg-accent"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    {badType && (
                      <p className="mt-1.5 flex gap-2 text-xs text-destructive">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        Not accepted for {method} — remove it or supply{" "}
                        {spec.fileTypes.slice(0, 4).join(", ")}.
                      </p>
                    )}
                    {!badType && soft && (
                      <p className="mt-1.5 flex gap-2 text-xs text-spectrum-orange">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        Resolution looks low — this method needs {spec.minRasterEdge}px minimum on
                        the shortest edge. Send vector artwork if you have it.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {files.length > 0 && spec.confirmRequired && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-xs">
              <input
                type="checkbox"
                checked={artworkConfirmed}
                onChange={(e) => {
                  setArtworkConfirmed(e.target.checked);
                  setArtworkError("");
                }}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                I confirm this artwork meets the {method} requirements above — correct file type,{" "}
                {spec.dpi.toLowerCase()} and the bleed noted.
              </span>
            </label>
          )}

          {artworkError && (
            <p className="mt-3 flex gap-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {artworkError}
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Sending…" : "Send quote request"}
        </button>
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
