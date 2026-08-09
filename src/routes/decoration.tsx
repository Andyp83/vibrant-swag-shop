import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { artworkFaq, decorations, swatchClass, textClass } from "@/lib/catalog";
import { decorationImages } from "@/lib/decoration-images";
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
          "Compare eight branding methods: screen print, embroidery, pad print, laser engraving, digital UV, debossing, full-colour wrap and doming, with lead times and artwork specs.",
      },
      {
        property: "og:title",
        content: "Decoration Options — Print, Embroidery & Engraving | Brand Bento",
      },
      {
        property: "og:description",
        content:
          "Eight branding methods compared: colour limits, lead times and artwork requirements for each.",
      },
    ],
  }),
  component: DecorationPage,
});

function DecorationPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Decoration
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Eight ways to put your logo on it
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        The method matters as much as the product. Each one has its own colour limits, lead time and
        artwork requirements — here's what to expect, so you can brief us with confidence.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {decorations.map((d) => (
          <article key={d.slug} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className={`h-2 w-full ${swatchClass[d.colour]}`} />
            <div className="p-6">
              <h2 className={`display-type text-xl ${textClass[d.colour]}`}>{d.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{d.what}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Best for
                  </dt>
                  <dd className="mt-1">{d.bestFor}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Colours
                  </dt>
                  <dd className="mt-1">{d.colourLimit}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lead time
                  </dt>
                  <dd className="mt-1">{d.leadTime}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Artwork needed
                  </dt>
                  <dd className="mt-1">{d.artwork}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>

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
