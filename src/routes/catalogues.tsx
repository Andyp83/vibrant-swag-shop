import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

type Catalogue = {
  id: string;
  name: string;
  edition: string;
  blurb: string;
  src: string;
  href: "/lookbook" | "/colour-guide" | "/impact-aware" | "/star-performers";
};

const catalogues: Catalogue[] = [
  {
    id: "brands-lookbook",
    name: "Brands Lookbook",
    edition: "Current edition",
    blurb:
      "The full range of branded merchandise, kits and corporate gift ideas — the best place to start.",
    src: "https://e.issuu.com/embed.html?d=brands_lookbook_-_unbranded&hideIssuuLogo=true&u=trendscollection",
    href: "/lookbook",
  },
  {
    id: "star-performers",
    name: "Star Performers",
    edition: "Edition three",
    blurb: "Our best sellers and trending products, chosen for reliable turnaround and impact.",
    src: "https://e.issuu.com/embed.html?d=star_performers_-_edition_three_-_unbranded&hideIssuuLogo=true&u=trendscollection",
    href: "/star-performers",
  },
  {
    id: "impact-aware",
    name: "Impact Aware",
    edition: "Edition two",
    blurb: "Recycled, traceable and lower-impact materials with verified sourcing stories.",
    src: "https://e.issuu.com/embed.html?d=impact_aware_edition_2_-_draft&hideIssuuLogo=true&u=trendscollection",
    href: "/impact-aware",
  },
  {
    id: "colour-guide",
    name: "Colour Guide",
    edition: "Reference",
    blurb: "Colour matching reference for decoration, so brand palettes land exactly right.",
    src: "https://e.issuu.com/embed.html?d=colour_guide_-_unbranded&hideIssuuLogo=true&u=trendscollection",
    href: "/colour-guide",
  },
];

export const Route = createFileRoute("/catalogues")({
  head: () => ({
    meta: [
      { title: "Catalogues & Lookbooks | See See Bloom" },
      {
        name: "description",
        content:
          "Browse every See See Bloom catalogue in one place: the Brands Lookbook, Star Performers, Impact Aware and the Colour Guide.",
      },
      { property: "og:title", content: "Catalogues & Lookbooks | See See Bloom" },
      {
        property: "og:description",
        content:
          "Flip through the Brands Lookbook, Star Performers, Impact Aware and Colour Guide — all our catalogues in one scrolling library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CataloguesPage,
});

function CataloguesPage() {
  const [active, setActive] = useState<string>(catalogues[0]!.id);

  const jumpTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Catalogues
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Every catalogue, one place
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Scroll through the full library below, or jump straight to the catalogue you need.
      </p>

      <div className="sticky top-20 z-30 mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <label htmlFor="catalogue-select" className="text-sm font-semibold">
          Choose a catalogue
        </label>
        <select
          id="catalogue-select"
          value={active}
          onChange={(e) => jumpTo(e.target.value)}
          className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-medium"
        >
          {catalogues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.edition}
            </option>
          ))}
        </select>
        <div className="hidden flex-wrap gap-2 md:flex">
          {catalogues.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => jumpTo(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active === c.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-20">
        {catalogues.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-40">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {c.edition}
                </p>
                <h2 className="display-type mt-2 text-2xl sm:text-3xl">{c.name}</h2>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">{c.blurb}</p>
              </div>
              <Link
                to={c.href}
                className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
              >
                Open full page <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="spectrum-bar h-1.5 w-full" />
              <iframe
                title={`${c.name} catalogue`}
                allowFullScreen
                loading="lazy"
                className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[720px]"
                src={c.src}
              />
            </div>
          </section>
        ))}
      </div>

      <section className="mt-20 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Seen something you like?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Send us the page or product, upload your logo and we'll come back with decoration options
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
