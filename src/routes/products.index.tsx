import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { Reveal } from "@/components/site/Reveal";


export const Route = createFileRoute("/products/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Branded Merchandise Categories | See See Bloom" },
      {
        name: "description",
        content:
          "Explore branded merchandise by category: drinkware, promotional items, headwear, business items, outdoor, bags, apparel, packaging and curated corporate gift sets.",
      },
      { property: "og:title", content: "Branded Merchandise Categories | See See Bloom" },
      {
        property: "og:description",
        content:
          "Drinkware, promotional items, headwear, business items, outdoor, bags, apparel, packaging and curated corporate gift sets.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Product examples
        </p>
        <h1 className="display-type mt-4 max-w-2xl text-5xl sm:text-6xl">
          Branded merchandise, by category
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          A sample of what we source most often. Every item can be colour-matched to your brand and
          decorated with the method that suits it best — pick a category to see examples, colour
          ranges and minimum order quantities.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 2) * 120} variant={i % 2 ? "right" : "left"}>
            <article
              className={`lift group overflow-hidden rounded-2xl border-2 ${borderAccentClass[spectrum(c.colour)]} ${softBgClass[spectrum(c.colour)]}`}
            >
              <Link to="/products/$category" params={{ category: c.slug }} className="block">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={c.image_url}
                    alt={`${c.name} branded merchandise examples`}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    width={1200}
                    height={900}
                    className="size-full object-cover object-center transition-transform duration-[1100ms] ease-out group-hover:scale-110"
                  />
                </div>

                <div className={`h-2 w-full ${swatchClass[spectrum(c.colour)]}`} />
                <div className="p-6">
                  <h2 className="display-type text-xl">{c.name}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                    {c.products.length > 0
                      ? `View ${c.products.length} examples`
                      : `View ${c.subcategories.length} sub-ranges`}

                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    />
                  </p>
                </div>
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

