import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/star-performers")({
  head: () => ({
    meta: [
      { title: "Star Performers — Edition Three | See See Bloom" },
      {
        name: "description",
        content:
          "Browse the Star Performers Edition Three flipbook from See See Bloom: trending branded merchandise and corporate gift ideas worth remembering.",
      },
      { property: "og:title", content: "Star Performers — Edition Three | See See Bloom" },
      {
        property: "og:description",
        content:
          "Trending branded merchandise and corporate gift ideas from the Star Performers Edition Three flipbook.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StarPerformersPage,
});

function StarPerformersPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Star Performers — Edition Three
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Trending products worth remembering
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the Star Performers lookbook to see the season's standout branded merchandise,
        best-selling corporate gifts and ideas for your next campaign.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="See See Bloom Star Performers Edition Three"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=star_performers_-_edition_three_-_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Found something you love?</h2>
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
