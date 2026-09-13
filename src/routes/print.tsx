import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, Palette, Printer } from "lucide-react";
import { categoriesQueryOptions } from "@/lib/catalog-query";
import { Reveal } from "@/components/site/Reveal";
import { PRINT_CATEGORY_SLUGS } from "@/lib/worlds";
import heroPrint from "@/assets/hero/hero-print-rainbow.webp";

const TITLE = "Design & Print — Business Cards, Signage & Labels | See See Bloom";
const DESCRIPTION =
  "Trade print backed by a design studio: business cards, signage, labels, magnets and stickers. Artwork set up properly, proofed and printed in Australia.";

export const Route = createFileRoute("/print")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/print" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/print" }],
  }),
  component: PrintPage,
});

const services = [
  {
    icon: Palette,
    title: "Design studio",
    body: "Send a rough idea, a template or nothing at all. Our studio builds the artwork, sets the colours and shows you a proof.",
  },
  {
    icon: Printer,
    title: "Trade print",
    body: "Business cards, flyers, signage, labels, magnets and stickers — printed to spec and delivered Australia-wide.",
  },
  {
    icon: FileCheck2,
    title: "Print brokering",
    body: "Unusual stock, special finishes or a big run? We source and manage the whole job for you.",
  },
];

function PrintPage() {
  const { data: allCategories } = useSuspenseQuery(categoriesQueryOptions());
  const printCategory = allCategories.find((c) => PRINT_CATEGORY_SLUGS.includes(c.slug));

  return (
    <div>
      <section className="hero-world-print relative overflow-hidden text-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
              Design services · Print
            </p>
            <h1 className="display-type mt-5 text-5xl leading-[0.95] sm:text-6xl">
              Design it with us
            </h1>
            <p className="mt-6 max-w-xl text-ink/70">
              Upload your template or start from scratch — our studio builds the artwork, sets the
              colours and prints it. Brochures, packaging, signage and everything between.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/products"
                search={{ world: "print" }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-primary-foreground"
              >
                Browse the print range
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/quote"
                className="inline-flex items-center rounded-full border border-ink/25 px-7 py-3.5 text-sm font-semibold hover:bg-ink/5"
              >
                Get a quote
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
              <Link to="/colour-guide" className="underline underline-offset-4">
                Colour guide
              </Link>
              <Link to="/decoration" className="underline underline-offset-4">
                Artwork requirements
              </Link>
              <Link to="/procurement" className="underline underline-offset-4">
                Design &amp; print brokering
              </Link>
            </div>
          </div>
          <img
            src={heroPrint}
            alt="Printed business cards, signage, labels and stickers in bright colours"
            width={1400}
            height={900}
            className="w-full"
          />
        </div>
        <div className="spectrum-bar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
      </section>

      {/* Sub-ranges */}
      {printCategory && printCategory.subcategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="display-type text-4xl sm:text-5xl">What we print</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {printCategory.subcategories.map((sub, i) => (
              <Reveal key={sub.slug} delay={i * 60} variant="up">
                <Link
                  to="/products/$category/$subcategory"
                  params={{ category: printCategory.slug, subcategory: sub.slug }}
                  className="lift block rounded-xl border-2 border-border bg-card p-6"
                >
                  <p className="display-type text-lg">{sub.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Browse the range</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      <section className="border-y border-border bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="display-type text-4xl sm:text-5xl">How we help</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 90} variant="up">
                <s.icon className="size-7" aria-hidden="true" />
                <p className="mt-5 text-lg font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Reveal>
          <h2 className="display-type text-4xl sm:text-5xl">Send us your artwork</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Upload what you have — even a photo of a sketch. We'll tell you what's needed and quote
            the job, usually within one business day.
          </p>
          <Link
            to="/quote"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Start a print quote
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
