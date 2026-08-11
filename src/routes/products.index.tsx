import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";

export const Route = createFileRoute("/products/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Branded Merchandise Categories | Brand Bento" },
      {
        name: "description",
        content:
          "Explore branded merchandise by category: drinkware, apparel, bags, tech, stationery, eco, headwear and curated corporate gift sets.",
      },
      { property: "og:title", content: "Branded Merchandise Categories | Brand Bento" },
      {
        property: "og:description",
        content:
          "Drinkware, apparel, bags, tech, stationery, eco, headwear and curated corporate gift sets.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Product examples
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Branded merchandise, by category
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        A sample of what we source most often. Every item can be colour-matched to your brand and
        decorated with the method that suits it best — pick a category to see examples, colour
        ranges and minimum order quantities.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {categories.map((c) => (
          <article
            key={c.slug}
            className={`group overflow-hidden rounded-2xl border-2 ${borderAccentClass[spectrum(c.colour)]} ${softBgClass[spectrum(c.colour)]}`}
          >
            <Link to="/products/$category" params={{ category: c.slug }} className="block">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={c.image_url}
                  alt={`${c.name} branded merchandise examples`}
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className={`h-2 w-full ${swatchClass[spectrum(c.colour)]}`} />
              <div className="p-6">
                <h2 className="display-type text-xl">{c.name}</h2>
                <p className={`mt-3 text-sm ${textClass[spectrum(c.colour)]}`}>{c.description}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  View {c.products.length} examples
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
