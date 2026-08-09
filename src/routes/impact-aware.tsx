import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/impact-aware")({
  head: () => ({
    meta: [
      { title: "Impact Aware | Brand Bento" },
      {
        name: "description",
        content:
          "Explore Impact Aware Edition 2 from Brand Bento: sustainable branded merchandise and corporate gifts designed with environmental impact in mind.",
      },
      { property: "og:title", content: "Impact Aware | Brand Bento" },
      {
        property: "og:description",
        content:
          "Impact Aware Edition 2 — sustainable branded merchandise and corporate gifts that make a difference.",
      },
    ],
  }),
  component: ImpactAwarePage,
});

function ImpactAwarePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Impact Aware Edition 2
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Merchandise that makes a difference
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the Impact Aware lookbook to see sustainable products, recycled materials and
        thoughtful corporate gifts with a lighter footprint.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="Brand Bento Impact Aware Edition 2"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=impact_aware_edition_2_-_draft&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Ready to go impact-first?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Tell us which products caught your eye and we'll build a sustainable quote with decoration
          options and quantities.
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
