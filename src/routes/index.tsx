import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { borderAccentClass, decorations, softBgClass, spectrum, swatchClass } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { banners } from "@/lib/banners";
import { BannerRow } from "@/components/site/BannerStrip";
import { Reveal } from "@/components/site/Reveal";
import { Marquee } from "@/components/site/Marquee";
import { CountUp } from "@/components/site/CountUp";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Brand Bento — Branded Merchandise & Corporate Gifts" },
      {
        name: "description",
        content:
          "Neatly curated, beautifully branded. Bright promotional merchandise and corporate gift kits, decorated in-house and quoted within one business day.",
      },
      { property: "og:title", content: "Brand Bento — Branded Merchandise & Corporate Gifts" },
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

const stats = [
  { to: 1400, suffix: "+", label: "products across 8 categories" },
  { to: 17, suffix: "", label: "colours on our flagship bottle" },
  { to: 24, suffix: "hr", label: "typical quote turnaround" },
  { to: 8, suffix: "", label: "in-house decoration methods" },
];

const heroWords = ["Merch", "worth", "keeping"];

function Home() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());

  return (
    <div>
      {/* ---------- Cinematic hero ---------- */}
      <section className="relative isolate overflow-hidden border-b border-border bg-ink text-primary-foreground">
        <div
          className="spectrum-rays spectrum-rays-spin absolute left-1/2 top-1/2 -z-10 aspect-square w-[160vw] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-[1px]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_18%,var(--ink)_82%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-24 text-center sm:pt-32">
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
            Brand Bento sources, decorates and delivers promotional product in every colour of the
            spectrum. Neatly curated. Beautifully branded.
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

          <div className="relative mx-auto mt-16 size-24" aria-hidden="true">
            <span className="pulse-ring absolute inset-0 rounded-full border border-white/40" />
            <span
              className="pulse-ring absolute inset-0 rounded-full border border-white/40"
              style={{ animationDelay: "1.3s" }}
            />
            <span className="spectrum-bar absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full" />
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
            "Screen print",
            "Embroidery",
            "Laser engraving",
            "Full-colour wraps",
            "Doming",
            "Debossing",
            "Digital UV",
            "Pad print",
            "24hr quotes",
            "In-house decoration",
          ]}
        />
      </div>

      <Reveal variant="blur">
        <BannerRow
          title="In the spotlight"
          banners={[banners.aura, banners.camaro, banners.brandcraft]}
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
                width={1200}
                height={900}
                className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
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
                    loading="lazy"
                    width={1200}
                    height={900}
                    className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
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

      {/* ---------- Decoration ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal variant="left">
            <h2 className="display-type text-4xl sm:text-5xl">Eight ways to put your logo on it</h2>
            <p className="mt-5 text-muted-foreground">
              Screen print, embroidery, laser engraving, full-colour wraps and more. Each method has
              its own colour limits, lead time and artwork requirements — we pick the one that suits
              the product and the look you're after.
            </p>
            <Link
              to="/decoration"
              className="sweep group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
            >
              Compare decoration options
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
          <ul className="grid gap-3 sm:grid-cols-2">
            {decorations.map((d, i) => (
              <Reveal key={d.slug} delay={i * 60} variant="right" as="li">
                <span className="lift flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
                  <span
                    className={`size-3 rounded-full ${swatchClass[d.colour]}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">{d.name}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-y border-border bg-secondary py-20">
        <dl className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} variant="scale">
              <div>
                <dt className="display-type text-5xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">{s.label}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
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
