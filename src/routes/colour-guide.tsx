import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/colour-guide")({
  head: () => ({
    meta: [
      { title: "Colour Guide — Product Colours & Finishes | Brand Bento" },
      {
        name: "description",
        content:
          "Browse the full Brand Bento colour guide flipbook: unbranded product colourways, finishes and swatches to help you match merchandise to your brand palette.",
      },
      { property: "og:title", content: "Colour Guide — Product Colours & Finishes | Brand Bento" },
      {
        property: "og:description",
        content:
          "The full unbranded colour guide flipbook — colourways, finishes and swatches for matching merch to your brand.",
      },
    ],
  }),
  component: ColourGuidePage,
});

function ColourGuidePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Colour guide
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Every colourway, page by page
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the unbranded colour guide to see the shades and finishes available across the
        range, then tell us which ones match your brand when you request a quote.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="Brand Bento colour guide flipbook"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=colour_guide_-_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Found your colours?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Send us the page or product codes with your logo and we'll confirm stock, decoration method
          and pricing.
        </p>
        <Link
          to="/quote"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Request a quote <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
