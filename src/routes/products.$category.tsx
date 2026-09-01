import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import {
  categoriesQueryOptions,
  decorationMethodsQueryOptions,
  productFamiliesQueryOptions,
  type CmsCategory,
} from "@/lib/catalog-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoryPlacement } from "@/lib/banners";
import { PlacementBanners } from "@/components/site/PlacementBanners";
import { Reveal } from "@/components/site/Reveal";
import { ProductQuickView } from "@/components/site/ProductQuickView";

import { ProductFilters } from "@/components/site/ProductFilters";
import {
  ALLOWED_COLOURS,
  colourImageFor,
  coloursFromSearch,
  coloursToSearch,
  familiesFromPage,
  featuredVariant,
  parseFilterSearch,
  type ProductFamily,
  type ProductFilterValue,
} from "@/lib/product-filters";

const PAGE_SIZE = 60;

export const Route = createFileRoute("/products/$category")({
  validateSearch: parseFilterSearch,
  loader: async ({ params, context }) => {
    const categories = await context.queryClient.ensureQueryData(categoriesQueryOptions());
    const category = categories.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Category not found | See See Bloom" }, { name: "robots", content: "noindex" }],
      };
    }
    const { category } = loaderData;
    const title = `${category.name} — Branded Merchandise | See See Bloom`;
    const url = `https://seeseebloom.com.au/products/${category.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: category.description },
        { property: "og:title", content: title },
        { property: "og:description", content: category.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
            description: category.description,
            url,
            numberOfItems: category.subcategories.length,
            itemListElement: category.subcategories.map((sub, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: sub.name,
              item: `https://seeseebloom.com.au/products/${category.slug}/${sub.slug}`,
            })),
          }),
        },
      ],
    };
  },

  notFoundComponent: CategoryNotFound,
  errorComponent: CategoryLoadError,
  component: CategoryPage,
});

function CategoryLoadError() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="display-type text-3xl">We couldn't load this category</h1>
      <p className="mt-4 text-muted-foreground">
        The connection dropped while fetching the catalogue. Please try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Retry
      </button>
    </div>
  );
}


function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="display-type text-3xl">Category not found</h1>
      <p className="mt-4 text-muted-foreground">
        That category doesn't exist — try the full product range instead.
      </p>
      <Link
        to="/products"
        className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        All categories
      </Link>
    </div>
  );
}

function CategoryPage() {
  const { category } = Route.useLoaderData() as { category: CmsCategory };
  const search = Route.useSearch();
  const [quickView, setQuickView] = useState<ProductFamily | null>(null);
  const navigate = useNavigate({ from: Route.fullPath });
  const filters: ProductFilterValue = {
    category: category.slug,
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
  const decorations = useSuspenseQuery(decorationMethodsQueryOptions()).data;
  const { data: pageData } = useSuspenseQuery(
    productFamiliesQueryOptions({
      category: category.slug,
      ...(filters.subcategory ? { sub: filters.subcategory } : {}),
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
  const visibleFamilies = familiesFromPage(pageData.families);
  const totalPages = Math.max(1, Math.ceil(pageData.total / PAGE_SIZE));
  const accent = spectrum(category.colour);

  const goToPage = (nextPage: number) => {
    navigate({
      search: (prev) => {
        const { page: _current, ...rest } = prev;
        return nextPage > 1 ? { ...rest, page: nextPage } : rest;
      },
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFilters = (next: Partial<ProductFilterValue>) => {
    const merged = { ...filters, ...next };
    navigate({
      search: {
        ...(merged.subcategory ? { sub: merged.subcategory } : {}),
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


  return (
    <div className={softBgClass[accent]}>
      <div className={`h-2 w-full ${swatchClass[accent]}`} />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All categories
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal variant="left">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.3em] ${textClass[accent]}`}
            >
              {category.tagline}
            </p>
            <h1 className="display-type mt-4 text-5xl sm:text-6xl">{category.name}</h1>
            <p className="mt-5 text-muted-foreground">{category.description}</p>
            <Link
              to="/quote"
              search={{ product: category.name }}
              className="sweep group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
            >
              Quote this category
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
          <Reveal
            variant="scale"
            className={`aspect-[4/3] overflow-hidden rounded-2xl border-2 ${borderAccentClass[accent]}`}
          >
            <img
              src={category.hero_image_url ?? category.image_url}
              alt={`${category.name} branded merchandise examples`}
              width={1200}
              height={900}
              className="ken-burns size-full object-cover object-center"
            />
          </Reveal>

        </div>

        <PlacementBanners
          placement={categoryPlacement(category.slug)}
          title="Featured ranges"
          className="mt-20"
        />

        <h2 className="display-type mt-20 text-2xl sm:text-3xl">Examples</h2>
        <ProductFilters
          className="mt-6"
          value={filters}
          subcategories={category.subcategories.map((s) => ({ slug: s.slug, name: s.name }))}
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
          {visibleFamilies.map((family, i) => {
            const p = featuredVariant(family, filters);
            const previewImage = colourImageFor(p, filters.colours) ?? p.image_url;
            const cols = filters.density === "5" ? 5 : 3;
            return (
            <Reveal key={family.key} delay={(i % cols) * 90} variant="up">
              <button
                type="button"
                onClick={() => setQuickView(family)}
                className={`lift group flex h-full w-full flex-col rounded-xl border-2 bg-card text-left ${
                  filters.density === "5" ? "p-3" : "p-5"
                } ${borderAccentClass[accent]}`}
              >
                <span className="block aspect-square w-full overflow-hidden rounded-lg bg-background">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={filters.colours.length ? `${p.name} in ${filters.colours.join(", ")}` : p.name}
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

        <ProductQuickView
          product={quickView ? featuredVariant(quickView, filters) : null}
          variants={quickView?.variants}
          accent={accent}
          categoryName={category.name}
          categorySlug={category.slug}
          preferredColours={filters.colours}

          productLink={
            quickView
              ? {
                  subcategory:
                    category.subcategories.find(
                      (s) => s.id === quickView.primary.subcategory_id,
                    )?.slug ?? "range",
                  product: quickView.primary.slug || quickView.primary.id,
                }
              : undefined
          }
          onClose={() => setQuickView(null)}
        />


        {visibleFamilies.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No examples in this category match those filters — try a different decoration method or
            a higher minimum order.
          </p>
        ) : null}


      </div>
    </div>
  );
}
