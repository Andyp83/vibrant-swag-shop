import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { artworkFaq, decorations, swatchClass, textClass } from "@/lib/catalog";
import { decorationImages } from "@/lib/decoration-images";
import { decorationBanners } from "@/lib/banners";
import { BannerRow } from "@/components/site/BannerStrip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";



export const Route = createFileRoute("/decoration")({
  head: () => ({
    meta: [
      { title: "Decoration Options — Print, Embroidery & Engraving | Brand Bento" },
      {
        name: "description",
        content:
          "Compare twenty-four branding methods: screen print, embroidery, pad print, laser engraving, digital UV, debossing, full-colour wrap, doming, Colourflex transfer, DigiFlex transfer, Digital Packaging Print, Digital Print, Direct Digital, Faux Embroidery, Foil Printing, Hot Stamping, Imitation Etch, Prism Digital Print, Puff Print, Resin Coated Finish, Rotary Digital Print, Rotary Screen Print, Silicone Digital Print and Sublimation Print, with lead times and artwork specs.",
      },
      {
        property: "og:title",
        content: "Decoration Options — Print, Embroidery & Engraving | Brand Bento",
      },
      {
        property: "og:description",
        content:
          "Twenty-four branding methods compared: colour limits, lead times and artwork requirements for each.",
      },
    ],
  }),
  component: DecorationPage,
});

function DecorationPage() {
  const [selected, setSelected] = useState(decorations[0]!.slug);
  const active = decorations.find((d) => d.slug === selected) ?? decorations[0]!;

  useEffect(() => {
    const readHash = () => {
      const slug = window.location.hash.replace("#", "");
      if (decorations.find((d) => d.slug === slug)) setSelected(slug);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Decoration
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Twenty-four ways to put your logo on it
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        The method matters as much as the product. Pick a method below to see what it's best for, how
        many colours it holds, lead time and the artwork we need.
      </p>

      <div
        role="tablist"
        aria-label="Decoration methods"
        className="mt-8 flex flex-wrap gap-2"
      >
        {decorations.map((d) => {
          const isActive = d.slug === active.slug;
          return (
            <button
              key={d.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="decoration-detail"
              onClick={() => setSelected(d.slug)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <span
                className={`size-2.5 rounded-full ${swatchClass[d.colour]}`}
                aria-hidden="true"
              />
              {d.name}
            </button>
          );
        })}
      </div>

      <section
        id="decoration-detail"
        role="tabpanel"
        aria-live="polite"
        className="mt-8 overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className={`h-2 w-full ${swatchClass[active.colour]}`} />
        <div className="grid gap-0 lg:grid-cols-2">
          <figure className="aspect-[4/3] overflow-hidden bg-secondary">
            <img
              src={decorationImages[active.slug]?.url}
              alt={decorationImages[active.slug]?.alt ?? `${active.name} example`}
              loading="lazy"
              width={1200}
              height={900}
              className="size-full object-cover"
            />
          </figure>
          <div className="p-7 sm:p-9">
            <h2 className={`display-type text-2xl ${textClass[active.colour]}`}>{active.name}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{active.what}</p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Best for
                </dt>
                <dd className="mt-1">{active.bestFor}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Colours
                </dt>
                <dd className="mt-1">{active.colourLimit}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lead time
                </dt>
                <dd className="mt-1">{active.leadTime}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Artwork needed
                </dt>
                <dd className="mt-1">{active.artwork}</dd>
              </div>
            </dl>
            {(active.advantages || active.limitations) && (
              <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
                {active.advantages && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Advantages
                    </dt>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {active.advantages.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {active.limitations && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Limitations
                    </dt>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {active.limitations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <Link
              to="/quote"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
            >
              Quote a {active.name.toLowerCase()} job{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {decorations.map((d) => (
          <button
            key={d.slug}
            type="button"
            onClick={() => setSelected(d.slug)}
            aria-pressed={d.slug === active.slug}
            className={`rounded-2xl border p-5 text-left transition-colors ${
              d.slug === active.slug
                ? "border-foreground bg-secondary"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            <span
              className={`block h-1.5 w-10 rounded-full ${swatchClass[d.colour]}`}
              aria-hidden="true"
            />
            <span className="mt-4 block font-semibold">{d.name}</span>
            <span className="mt-2 block text-sm text-muted-foreground">{d.bestFor}</span>
          </button>
        ))}
      </div>

      <BannerRow title="New branding technologies" banners={decorationBanners} className="mt-16" />

      <section className="mt-20">
        <h2 className="display-type text-2xl sm:text-3xl">Artwork, answered</h2>
        <Accordion type="single" collapsible className="mt-6">
          {artworkFaq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mt-20 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Not sure which method you need?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Send your logo through with the quote request and our studio will recommend the method that
          reproduces it best on the products you're considering.
        </p>
        <Link
          to="/quote"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Upload artwork & get a quote <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
