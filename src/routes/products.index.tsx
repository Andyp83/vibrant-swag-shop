import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { borderAccentClass, spectrum } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory, type CmsProduct } from "@/lib/catalog-query";
import { Reveal } from "@/components/site/Reveal";
import { ProductFilters } from "@/components/site/ProductFilters";
import { ProductQuickView } from "@/components/site/ProductQuickView";
import {
  colourImageFor,
  colourOptions,
  coloursFromSearch,
  coloursToSearch,
  decorationOptions,
  matchesFilters,
  parseFilterSearch,
  sortProducts,
  type ProductFilterValue,
} from "@/lib/product-filters";

export const Route = createFileRoute("/products/")({
  validateSearch: parseFilterSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "All Branded Merchandise Products | See See Bloom" },
      {
        name: "description",
        content:
          "Browse every branded merchandise product in one place — filter by category, sub-range, decoration method, colour and minimum order quantity.",
      },
      { property: "og:title", content: "All Branded Merchandise Products | See See Bloom" },
      {
        property: "og:description",
        content:
          "One page, every product. Filter by category, sub-range, decoration, colour and minimum order quantity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/products" }],
  }),
  component: AllProductsPage,
});

type Entry = { family: ProductFamily; category: CmsCategory; subSlug: string };

function AllProductsPage() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [quickView, setQuickView] = useState<Entry | null>(null);
  const PAGE_SIZE = 48;
  const [shown, setShown] = useState(PAGE_SIZE);

  const filters: ProductFilterValue = {
    category: search.category ?? "",
    subcategory: search.sub ?? "",
    decoration: search.decoration ?? "",
    colours: coloursFromSearch(search.colour),
    colourMatch: search.colourMatch ?? "any",
    sort: search.sort ?? "default",
    impact: search.impact ?? false,
    moq: search.moq ?? 0,
    density: search.density ?? "5",
  };

  const activeCategory = categories.find((c) => c.slug === filters.category) ?? null;
  const scoped = activeCategory ? [activeCategory] : categories;

  const allEntries: Entry[] = scoped.flatMap((category) =>
    groupFamilies(category.products).map((family) => ({
      family,
      category,
      subSlug:
        category.subcategories.find((s) => s.id === family.primary.subcategory_id)?.slug ?? "",
    })),
  );

  const matching = allEntries.filter(
    (e) =>
      familyMatchesFilters(e.family, filters, e.category.slug) &&
      (!filters.subcategory || e.subSlug === filters.subcategory),
  );
  const visible = sortFamilies(
    matching.map((e) => e.family),
    filters,
  ).map((family) => matching.find((e) => e.family === family) as Entry);

  const updateFilters = (next: Partial<ProductFilterValue>) => {
    setShown(PAGE_SIZE);
    const merged = { ...filters, ...next };
    navigate({
      search: {
        ...(merged.category ? { category: merged.category } : {}),
        ...(merged.category && merged.subcategory ? { sub: merged.subcategory } : {}),
        ...(merged.decoration ? { decoration: merged.decoration } : {}),
        ...(merged.colours.length ? { colour: coloursToSearch(merged.colours) } : {}),
        ...(merged.colours.length > 1 && merged.colourMatch === "all"
          ? { colourMatch: "all" as const }
          : {}),
        ...(merged.colours.length && merged.sort === "colour-match"
          ? { sort: "colour-match" as const }
          : {}),
        ...(merged.impact ? { impact: true } : {}),
        ...(merged.moq ? { moq: merged.moq } : {}),
        ...(merged.density === "3" ? { density: "3" as const } : {}),
      },
      replace: true,
    });
  };

  const cols = filters.density === "5" ? 5 : 3;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Product range
        </p>
        <h1 className="display-type mt-4 max-w-2xl text-5xl sm:text-6xl">All products</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Everything in one place. Start with a category, then narrow by sub-range, decoration
          method, colour or minimum order quantity.
        </p>
      </Reveal>

      <ProductFilters
        className="mt-10"
        value={filters}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        subcategories={
          activeCategory
            ? activeCategory.subcategories
                .filter((s) =>
                  activeCategory.products.some((p) => p.subcategory_id === s.id),
                )
                .map((s) => ({ slug: s.slug, name: s.name }))
            : []
        }
        decorations={decorationOptions(allEntries.flatMap((e) => e.family.variants))}
        colours={colourOptions(allEntries.flatMap((e) => e.family.variants))}
        onChange={updateFilters}
        resultCount={visible.length}
        totalCount={allEntries.length}
      />

      <div
        className={`mt-8 grid gap-4 sm:grid-cols-2 ${
          filters.density === "5" ? "lg:grid-cols-5" : "lg:grid-cols-3"
        }`}
      >
        {visible.slice(0, shown).map((e, i) => {
          const accent = spectrum(e.category.colour);
          const featured = featuredVariant(e.family, filters);
          const previewImage = colourImageFor(featured, filters.colours) ?? featured.image_url;
          return (
            <Reveal key={e.family.key} delay={(i % cols) * 90} variant="up">
              <button
                type="button"
                onClick={() => setQuickView(e)}
                className={`lift group flex h-full w-full flex-col rounded-xl border-2 bg-card text-left ${
                  filters.density === "5" ? "p-3" : "p-5"
                } ${borderAccentClass[accent]}`}
              >
                <span className="block aspect-square w-full overflow-hidden rounded-lg bg-background">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={
                        filters.colours.length
                          ? `${e.product.name} in ${filters.colours.join(", ")}`
                          : e.product.name
                      }
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      width={640}
                      height={640}
                      className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="mt-3 block text-sm font-semibold">{e.product.name}</span>
              </button>
            </Reveal>
          );
        })}
      </div>

      {visible.length > shown ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="rounded-full border-2 border-border px-7 py-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Load more products ({visible.length - shown} remaining)
          </button>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No products match those filters — try clearing a filter or choosing another category.
        </p>
      ) : null}

      <ProductQuickView
        product={quickView?.product ?? null}
        accent={quickView ? spectrum(quickView.category.colour) : "red"}
        categoryName={quickView?.category.name ?? ""}
        categorySlug={quickView?.category.slug ?? ""}
        preferredColours={filters.colours}
        productLink={
          quickView
            ? {
                subcategory: quickView.subSlug || "range",
                product: quickView.product.slug || quickView.product.id,
              }
            : undefined
        }
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
