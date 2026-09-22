import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoriesQueryOptions } from "@/lib/catalog-query";
import { NON_MERCH_CATEGORY_SLUGS } from "@/lib/worlds";

const TITLE = "Logo Match — AI Merchandise Suggestions | See See Bloom";
const DESCRIPTION =
  "Upload your logo or artwork and get instant branded merchandise suggestions: the products that suit your design, the decoration method to use and the colours to pick.";

export const Route = createFileRoute("/logo-match")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/logo-match" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: LogoMatchPage,
});

type Suggestion = {
  category: string;
  product: string;
  why: string;
  decoration: string;
  colour: string;
};

type MatchResult = {
  palette: { name: string; hex: string }[];
  style: string;
  logo_notes: string;
  recommendations: Suggestion[];
};

const MAX_BYTES = 6 * 1024 * 1024;

function LogoMatchPage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const merchCategories = categories.filter((c) => !NON_MERCH_CATEGORY_SLUGS.includes(c.slug));

  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function onPick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast.error("Please upload a PNG, JPG or WEBP image of your logo");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That file is over 6MB — please upload a smaller image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setDataUrl(value);
      setPreview(value);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit() {
    if (!dataUrl) {
      toast.error("Upload your logo first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/logo-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          brief,
          categories: merchCategories.map((c) => c.name),
        }),
      });
      const body = (await response.json()) as MatchResult & { error?: string };
      if (!response.ok || body.error) {
        toast.error(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(body);
    } catch (error) {
      console.error("Logo match failed", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Logo match
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Upload your logo, see what it belongs on
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Drop in your logo or artwork and we'll suggest merchandise from our promotional ranges — the
        products that suit your design, the decoration method to use and colours that match your
        brand.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Label htmlFor="logo-file">Your logo or artwork</Label>
          <input
            ref={fileInput}
            id="logo-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="mt-3 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center transition-colors hover:bg-accent"
          >
            {preview ? (
              <img
                src={preview}
                alt="Your uploaded logo"
                className="max-h-40 w-auto object-contain"
              />
            ) : (
              <Upload className="size-7 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold">
              {preview ? "Choose a different file" : "Choose a PNG, JPG or WEBP"}
            </span>
            <span className="text-xs text-muted-foreground">Up to 6MB</span>
          </button>

          <div className="mt-5 space-y-2">
            <Label htmlFor="logo-brief">Anything we should know? (optional)</Label>
            <Textarea
              id="logo-brief"
              rows={3}
              maxLength={1000}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Who it's for, the occasion, rough budget or quantities…"
            />
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !dataUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {loading ? "Looking at your logo…" : "Suggest merchandise"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Suggestions are a starting point — we'll confirm stock, decoration and pricing when you
            request a quote.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary p-6">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Reading your artwork and matching it to our ranges — this usually takes under a minute.
            </p>
          )}

          {!loading && !result && (
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">What you'll get back</p>
              <ul className="mt-3 space-y-2">
                <li>• The colours we can read out of your artwork</li>
                <li>• Six to eight products that suit the design</li>
                <li>• A decoration method and colour for each one</li>
                <li>• Notes on anything that needs redrawing before print</li>
              </ul>
            </div>
          )}

          {result && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Your artwork
              </p>
              <p className="mt-2 text-sm">{result.style}</p>
              {result.palette.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.palette.map((colour) => (
                    <span
                      key={`${colour.name}-${colour.hex}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold"
                    >
                      <span
                        className="size-3.5 rounded-full border border-border"
                        style={{ backgroundColor: colour.hex }}
                        aria-hidden="true"
                      />
                      {colour.name}
                    </span>
                  ))}
                </div>
              )}
              {result.logo_notes && (
                <p className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  {result.logo_notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {result && result.recommendations.length > 0 && (
        <>
          <h2 className="display-type mt-14 text-3xl">Suggested merchandise</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {result.recommendations.map((item, index) => {
              const match = merchCategories.find(
                (c) => c.name.toLowerCase() === item.category.toLowerCase(),
              );
              return (
                <li
                  key={`${item.product}-${index}`}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.category}
                  </p>
                  <h3 className="display-type mt-2 text-xl">{item.product}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.why}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Decoration</dt>
                      <dd className="font-medium">{item.decoration}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Colour</dt>
                      <dd className="font-medium">{item.colour}</dd>
                    </div>
                  </dl>
                  {match && (
                    <Link
                      to="/products/$category"
                      params={{ category: match.slug }}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
                    >
                      Browse {match.name}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-12 rounded-2xl border border-border bg-secondary p-8 text-center">
            <h2 className="display-type text-2xl">Like the look of these?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Send us your logo and the items you're drawn to and we'll come back with real pricing,
              stock and decoration options.
            </p>
            <Link
              to="/quote"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Request a quote
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
