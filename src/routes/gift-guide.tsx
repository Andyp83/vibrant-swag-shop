import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/gift-guide")({
  head: () => ({
    meta: [
      { title: "Gift Guide 2026–27 | See See Bloom" },
      {
        name: "description",
        content:
          "Browse the See See Bloom Gift Guide 2026–27: curated corporate gift ideas, hampers and branded merchandise for every occasion this year.",
      },
      { property: "og:title", content: "Gift Guide 2026–27 | See See Bloom" },
      {
        property: "og:description",
        content:
          "Curated corporate gift ideas, hampers and branded merchandise for every occasion — the 2026–27 Gift Guide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/gift-guide" }],
  }),
  component: GiftGuidePage,
});

function GiftGuidePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Gift Guide 2026–27
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Gifts worth remembering this year
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the 2026–27 Gift Guide for curated corporate gift ideas, hampers and branded
        merchandise — perfect for client appreciation, milestones and end-of-year gifting.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="See See Bloom Gift Guide 2026–27"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=gift_guide_-_2026_2027_-_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Ready to put together your gift list?</h2>
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
