import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { banners } from "@/lib/banners";
import { BannerRow } from "@/components/site/BannerStrip";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Brands Lookbook | Brand Bento" },
      {
        name: "description",
        content:
          "Browse the Brand Bento brands lookbook: curated merchandise ideas, product pairings and real-world inspiration for branded corporate gifts and team merch.",
      },
      { property: "og:title", content: "Brands Lookbook | Brand Bento" },
      {
        property: "og:description",
        content:
          "Curated merchandise ideas and product pairings from the brands lookbook — inspiration for your next branded gift or team drop.",
      },
    ],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Brands Lookbook
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Inspiration for every brand moment
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the lookbook to see how products come together into considered kits, event
        drops and corporate gift sets.
      </p>

      <BannerRow banners={[banners.lookbookLwb]} className="mt-10" />

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">

        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="Brand Bento brands lookbook"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=brands_lookbook_-_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Ready to build your kit?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Share the pages or products you love, upload your logo and we'll put together a quote with
          decoration options and quantities.
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
