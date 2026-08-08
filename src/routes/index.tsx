import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { decorations, spectrum, swatchClass } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";

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
  { value: "1,400+", label: "products across 8 categories" },
  { value: "17", label: "colours on our flagship bottle" },
  { value: "24hr", label: "typical quote turnaround" },
  { value: "8", label: "in-house decoration methods" },
];

function Home() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="spectrum-rays absolute inset-x-0 bottom-0 h-[420px] opacity-[0.18]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Branded merchandise · Corporate gifts
          </p>
          <h1 className="display-type mx-auto mt-6 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">
            Merch worth
            <br />
            keeping
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Brand Bento sources, decorates and delivers promotional product in every colour of the
            spectrum. Neatly curated. Beautifully branded.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Browse products <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-primary px-7 py-3 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Get a quote
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-type text-3xl sm:text-4xl">Shop by category</h2>
          <Link to="/products" className="text-sm font-semibold underline underline-offset-4">
            See everything
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/products/$category"
              params={{ category: c.slug }}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={c.image_url}
                  alt={`${c.name} promotional products`}
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className={`h-1.5 w-full ${swatchClass[spectrum(c.colour)]}`} />
              <div className="p-5">
                <p className="display-type text-base">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="display-type text-3xl sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.n}>
                <div
                  className={`flex size-11 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${
                    [swatchClass.red, swatchClass.amber, swatchClass.teal, swatchClass.violet][i]
                  }`}
                >
                  {s.n}
                </div>
                <p className="mt-4 font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="display-type text-3xl sm:text-4xl">Eight ways to put your logo on it</h2>
            <p className="mt-4 text-muted-foreground">
              Screen print, embroidery, laser engraving, full-colour wraps and more. Each method has
              its own colour limits, lead time and artwork requirements — we pick the one that suits
              the product and the look you're after.
            </p>
            <Link
              to="/decoration"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Compare decoration options <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {decorations.map((d) => (
              <li
                key={d.slug}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className={`size-3 rounded-full ${swatchClass[d.colour]}`} aria-hidden="true" />
                <span className="text-sm font-medium">{d.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-secondary py-16">
        <dl className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="display-type text-4xl">{s.value}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h2 className="display-type text-4xl sm:text-5xl">Ready for a quote?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Upload your logo, tell us roughly what you need, and we'll come back with a curated
          shortlist and pricing — usually within one business day.
        </p>
        <Link
          to="/quote"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start your quote request <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
