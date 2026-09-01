import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { borderAccentClass, spectrum } from "@/lib/catalog";
import {
  categoriesQueryOptions,
  decorationMethodsQueryOptions,
  productFamiliesQueryOptions,
  type CmsCategory,
} from "@/lib/catalog-query";
import { Reveal } from "@/components/site/Reveal";
import { ProductFilters } from "@/components/site/ProductFilters";
import { ProductQuickView } from "@/components/site/ProductQuickView";
import {
  ALLOWED_COLOURS,
  colourImageFor,
  coloursFromSearch,
  coloursToSearch,
  familiesFromPage,
  featuredVariant,
  type ProductFamily,
  parseFilterSearch,
  type ProductFilterValue,
} from "@/lib/product-filters";

const PAGE_SIZE = 60;

export const Route = createFileRoute("/products/")({
  validateSearch: parseFilterSearch,
  loaderDeps: ({ search }) => ({
    category: search.category ?? "",
    sub: search.sub ?? "",
    decoration: search.decoration ?? "",
    colour: search.colour ?? "",
    colourMatch: search.colourMatch ?? "any",
    sort: search.sort ?? "default",
    impact: search.impact ?? false,
    moq: search.moq ?? 0,
    page: search.page ?? 1,
  }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
      context.queryClient.ensureQueryData(decorationMethodsQueryOptions()),
      context.queryClient.ensureQueryData(
        productFamiliesQueryOptions({
      ...(deps.category ? { category: deps.category } : {}),
      ...(deps.category && deps.sub ? { sub: deps.sub } : {}),
      ...(deps.decoration ? { decoration: deps.decoration } : {}),
      colours: coloursFromSearch(deps.colour),
      colourMode: deps.colourMatch,
      impact: deps.impact,
      moqMax: deps.moq,
      sort: deps.sort,
      page: Math.max(0, deps.page - 1),
      pageSize: PAGE_SIZE,
        }),
      ),
    ]);
  },
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
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl px-5 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">No products found.</div>
  ),
  component: AllProductsPage,
});

function AllProductsPage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [quickView, setQuickView] = useState<{ family: ProductFamily; category: CmsCategory } | null>(
    null,
  );

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
  const page = Math.max(1, search.page ?? 1);

  const activeCategory = categories.find((c) => c.slug === filters.category) ?? null;
  const decorations = useSuspenseQuery(decorationMethodsQueryOptions()).data;
  const { data: pageData } = useSuspenseQuery(
    productFamiliesQueryOptions({
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.category && filters.subcategory ? { sub: filters.subcategory } : {}),
      ...(filters.decoration ? { decoration: filters.decoration } : {}),
      colours: filters.colours,
      colourMode: filters.colourMatch,
      impact: filters.impact,
      moqMax: filters.moq,
      sort: filters.sort,
      page: page - 1,
      pageSize: PAGE_SIZE,
    }),
  );

  const families = familiesFromPage(pageData.families);
  const subSlugFor = (family: ProductFamily, category: CmsCategory | null) =>
    category?.subcategories.find((s) => s.id === family.primary.subcategory_id)?.slug ?? "";
  const categoryFor = (family: ProductFamily) =>
    categories.find((c) => c.id === family.primary.category_id) ?? activeCategory ?? categories[0]!;

  const updateFilters = (next: Partial<ProductFilterValue>) => {
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

  const goToPage = (nextPage: number) => {
    navigate({
      search: (prev) => {
        const { page: _current, ...rest } = prev;
        return nextPage > 1 ? { ...rest, page: nextPage } : rest;
      },
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cols = filters.density === "5" ? 5 : 3;
  const totalPages = Math.max(1, Math.ceil(pageData.total / PAGE_SIZE));

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
            ? activeCategory.subcategories.map((s) => ({ slug: s.slug, name: s.name }))
            : []
        }
        decorations={decorations}
        colours={ALLOWED_COLOURS}
        onChange={updateFilters}
        resultCount={pageData.total}
        totalCount={pageData.total}
      />

      <div
        className={`mt-8 grid gap-4 sm:grid-cols-2 ${
          filters.density === "5" ? "lg:grid-cols-5" : "lg:grid-cols-3"
        }`}
      >
        {families.map((family, i) => {
          const category = categoryFor(family);
          const accent = spectrum(category.colour);
          const featured = featuredVariant(family, filters);
          const previewImage = colourImageFor(featured, filters.colours) ?? featured.image_url;
          return (
            <Reveal key={family.key} delay={(i % cols) * 90} variant="up">
              <button
                type="button"
                onClick={() => setQuickView({ family, category })}
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
                          ? `${family.name} in ${filters.colours.join(", ")}`
                          : family.name
                      }
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      width={640}
                      height={640}
                      className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="mt-3 block text-sm font-semibold">{family.name}</span>
                {family.variants.length > 1 ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {family.variants.length} options
                  </span>
                ) : null}
              </button>
            </Reveal>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-full border-2 border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-full border-2 border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {families.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No products match those filters — try clearing a filter or choosing another category.
        </p>
      ) : null}

      <ProductQuickView
        product={quickView ? featuredVariant(quickView.family, filters) : null}
        variants={quickView?.family.variants}
        accent={quickView ? spectrum(quickView.category.colour) : "red"}
        categoryName={quickView?.category.name ?? ""}
        categorySlug={quickView?.category.slug ?? ""}
        preferredColours={filters.colours}
        productLink={
          quickView
            ? {
                subcategory: subSlugFor(quickView.family, quickView.category) || "range",
                product: quickView.family.primary.slug || quickView.family.primary.id,
              }
            : undefined
        }
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
