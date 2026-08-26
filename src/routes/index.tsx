import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";
import heroProducts from "@/assets/hero/hero-lineup-1862.webp.asset.json";
import heroProductsSmall from "@/assets/hero/hero-lineup-1400.webp.asset.json";
import { PlacementBanners } from "@/components/site/PlacementBanners";
import { Reveal } from "@/components/site/Reveal";
import { Marquee } from "@/components/site/Marquee";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "See See Bloom — Branded Merchandise for Brands Worth Remembering" },
      {
        name: "description",
        content:
          "Branded merchandise for brands worth remembering. Bright promotional merchandise and corporate gift kits, decorated in-house and quoted within one business day.",
      },
      { property: "og:title", content: "See See Bloom — Branded Merchandise for Brands Worth Remembering" },
      {
        property: "og:description",
        content:
          "Bright promotional merchandise and corporate gift kits, decorated in-house and quoted within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const steps = [
  {
    n: "01",
    title: "Tell us the brief",
    body: "Quantity, budget, deadline and who it's for. Send your logo while you're there.",
  },
  {
    n: "02",
    title: "We curate options",
    body: "A shortlist of products that suit the brief, with the right decoration method for each.",
  },
  {
    n: "03",
    title: "Approve your proof",
    body: "A digital proof of every placement and colour. Nothing prints until you sign off.",
  },
  {
    n: "04",
    title: "Packed and delivered",
    body: "Bulk to one address, or kitted and drop-shipped to individual doors.",
  },
];

const faqs = [
  {
    question: "How long does a typical quote take?",
    answer:
      "Most quotes come back within one business day. Complex jobs — like multi-product gift packs or special decoration — can take a little longer, but we'll keep you posted.",
  },
  {
    question: "What logo file do you need?",
    answer:
      "Vector files are best: EPS, AI or PDF with editable outlines. High-resolution PNG or JPEG works for some digital methods. Not sure? Upload what you have and we'll let you know if it's suitable.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer:
      "Minimums vary by product and decoration method. Screen-printed apparel often starts at 25–50 units, while promotional products can start lower. We'll flag any MOQ clearly in your quote.",
  },
  {
    question: "Can you handle large bulk orders?",
    answer:
      "Yes. We regularly manage hundreds to tens of thousands of units, with staged production and delivery options. Bulk orders also unlock volume pricing once quantities are confirmed.",
  },
  {
    question: "Can you ship to multiple addresses?",
    answer:
      "Absolutely. We can pack and drop-ship individual kits to staff or event locations, or deliver everything to one warehouse — whatever suits your project.",
  },
  {
    question: "Will I see a proof before production?",
    answer:
      "Always. We send a digital proof showing logo size, position and colours for every item. Nothing goes to print until you approve it.",
  },
];


const heroWords = ["Merch", "worth", "keeping"];

function Home() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());

  return (
    <div>
      {/* ---------- Cinematic hero ---------- */}
      <section className="relative isolate overflow-hidden border-b border-border bg-ink text-primary-foreground">
        <div
          className="spectrum-rays spectrum-rays-spin absolute left-1/2 top-1/2 -z-10 aspect-square w-[160vw] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[1px]"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-4xl px-5 pb-20 pt-24 text-center sm:pt-32 lg:pb-28 lg:pt-36">
          <p className="hero-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Branded merchandise · Corporate gifts
            </span>
          </p>

          <h1 className="display-type mx-auto mt-8 max-w-4xl text-6xl leading-[0.88] sm:text-8xl">
            {heroWords.map((w, i) => (
              <span
                key={w}
                className="hero-word mr-[0.25em]"
                style={{ animationDelay: `${140 + i * 130}ms` }}
              >
                {w}
              </span>
            ))}
          </h1>

          <p
            className="hero-rise mx-auto mt-7 max-w-xl text-lg text-primary-foreground/75"
            style={{ animationDelay: "560ms" }}
          >
            See See Bloom sources, decorates and delivers promotional product in every colour of the
            spectrum. Branded merchandise for brands worth remembering.
          </p>

          <div
            className="hero-rise mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "680ms" }}
          >
            <Link
              to="/products"
              className="sweep group inline-flex items-center gap-2 rounded-full bg-primary-foreground px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.04]"
            >
              Browse products
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold transition-colors duration-300 hover:bg-white/10"
            >
              Get a quote
            </Link>
          </div>

          <div
            className="hero-rise relative -mx-3 mt-10 w-[calc(100%+1.5rem)] max-w-none sm:mx-auto sm:mt-14 sm:w-full sm:max-w-5xl sm:px-6"
            style={{ animationDelay: "800ms" }}
          >
            <div className="hero-lineup-glow pointer-events-none absolute inset-0" aria-hidden="true" />
            <img
              src={heroProducts.url}
              srcSet={`${heroProductsSmall.url} 1400w, ${heroProducts.url} 1862w`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1024px"
              alt="Bright branded merchandise including drink bottles, caps, bags, notebooks and gift sets"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={1862}
              height={683}
              className="hero-lineup relative h-auto w-full max-w-full object-contain"
            />
          </div>

        </div>

        <div className="spectrum-bar h-2 w-full" />
      </section>

      {/* ---------- Ticker ---------- */}
      <div className="border-b border-border bg-secondary py-4">
        <Marquee
          className="ticker-line text-sm sm:text-base"
          speed={42}
          items={[
            "Design services",
            "Procurement",
            "Branding",
            "Visual merchandising",
            "POS displays",
            "24-hour quote turnaround",
            "Web design",
            "Client gifts",
            "Staff welcome packs",
            "Christmas hampers",
            "Trade-show giveaways",
            "Expo stand design",
            "Kitting",
          ]}
        />
      </div>

      <Reveal variant="blur">
        <PlacementBanners
          placement="home"
          title="In the spotlight"
          className="mx-auto max-w-6xl px-5 pt-20"
        />
      </Reveal>

      {/* ---------- Colour-blocked category reel ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-type text-4xl sm:text-5xl">Shop by category</h2>
          <Link
            to="/products"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
          >
            See everything
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        {/* Expanding panels on desktop */}
        <div className="mt-12 hidden gap-3 lg:flex lg:h-[26rem]">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/products/$category"
              params={{ category: c.slug }}
              className={`group relative flex-1 overflow-hidden rounded-2xl border-2 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:flex-[3.4] ${borderAccentClass[spectrum(c.colour)]}`}
            >
              <img
                src={c.image_url}
                alt={`${c.name} promotional products`}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 1024px) 50vw, 320px"
                width={1200}
                height={900}
                className="absolute inset-0 size-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />

              <span
                className={`absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent`}
                aria-hidden="true"
              />
              <span
                className={`absolute inset-x-0 top-0 h-1.5 ${swatchClass[spectrum(c.colour)]}`}
                aria-hidden="true"
              />
              {/* Vertical label while collapsed */}
              <span className="absolute bottom-5 left-4 flex items-end transition-opacity duration-300 group-hover:opacity-0">
                <span className="display-type block text-lg leading-none tracking-tight text-primary-foreground [text-shadow:0_1px_12px_var(--ink)] [writing-mode:vertical-rl] rotate-180">
                  {c.name}
                </span>
              </span>
              {/* Horizontal label + tagline on hover */}
              <span className="absolute inset-x-0 bottom-0 p-6 text-left opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="display-type block text-2xl leading-tight text-primary-foreground [text-shadow:0_1px_12px_var(--ink)]">
                  {c.name}
                </span>
                <span className="mt-2 block max-w-sm text-sm text-primary-foreground/85">
                  {c.tagline}
                </span>
              </span>

            </Link>
          ))}
        </div>

        {/* Stacked cards on smaller screens */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:hidden">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 70} variant="scale">
              <Link
                to="/products/$category"
                params={{ category: c.slug }}
                className={`lift group block overflow-hidden rounded-xl border-2 ${borderAccentClass[spectrum(c.colour)]} ${softBgClass[spectrum(c.colour)]}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={c.image_url}
                    alt={`${c.name} promotional products`}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    width={1200}
                    height={900}
                    className="size-full object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />
                </div>

                <div className={`h-1.5 w-full ${swatchClass[spectrum(c.colour)]}`} />
                <div className="p-5">
                  <p className="display-type text-base">{c.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="relative overflow-hidden border-y border-border bg-ink py-24 text-primary-foreground">
        <div
          className="spectrum-rays absolute -bottom-1/2 left-1/2 -z-0 aspect-square w-[120vw] -translate-x-1/2 opacity-20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="display-type text-4xl sm:text-5xl">How it works</h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110} variant="up">
                <div className="group">
                  <div
                    className={`flex size-14 items-center justify-center rounded-full text-base font-bold text-primary-foreground transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      [swatchClass.red, swatchClass.amber, swatchClass.teal, swatchClass.violet][i]
                    }`}
                  >
                    {s.n}
                  </div>
                  <p className="mt-5 text-lg font-semibold">{s.title}</p>
                  <p className="mt-2 text-sm text-primary-foreground/70">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <Reveal className="text-center">
          <h2 className="display-type text-4xl sm:text-5xl">Questions we get a lot</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Quick answers about turnaround, logos and bulk orders.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-base font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative overflow-hidden bg-ink py-28 text-primary-foreground">
        <div
          className="spectrum-rays spectrum-rays-spin absolute left-1/2 top-1/2 aspect-square w-[130vw] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-2xl"
          aria-hidden="true"
        />
        <Reveal variant="scale" className="relative mx-auto max-w-4xl px-5 text-center">
          <h2 className="display-type text-5xl sm:text-6xl">Ready for a quote?</h2>
          <p className="mx-auto mt-5 max-w-xl text-primary-foreground/75">
            Upload your logo, tell us roughly what you need, and we'll come back with a curated
            shortlist and pricing — usually within one business day.
          </p>
          <Link
            to="/quote"
            className="sweep group mt-10 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-9 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.05]"
          >
            Start your quote request
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
        <div className="spectrum-bar absolute inset-x-0 bottom-0 h-2" aria-hidden="true" />
      </section>
    </div>
  );
}
