import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/real-estate-essentials")({
  head: () => ({
    meta: [
      { title: "Real Estate Essentials Lookbook | See See Bloom" },
      {
        name: "description",
        content:
          "Browse the Real Estate Essentials lookbook from See See Bloom: branded merchandise and corporate gifts tailored for real estate agencies and property professionals.",
      },
      { property: "og:title", content: "Real Estate Essentials Lookbook | See See Bloom" },
      {
        property: "og:description",
        content:
          "Branded merchandise and corporate gifts curated for real estate agencies and property professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/real-estate-essentials" }],
  }),
  component: RealEstateEssentialsPage,
});

function RealEstateEssentialsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Real Estate Essentials
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Merchandise for property professionals
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the Real Estate Essentials lookbook to see branded merchandise and gift ideas
        curated for real estate agencies — from open-home giveaways to settlement gifts and staff
        rewards.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="See See Bloom Real Estate Essentials lookbook"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=real_estate_essentials_lookbook&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Found something for your agency?</h2>
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
