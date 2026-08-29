import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory, type CmsProduct } from "@/lib/catalog-query";
import { categoryPlacement } from "@/lib/banners";
import { PlacementBanners } from "@/components/site/PlacementBanners";
import { Reveal } from "@/components/site/Reveal";
import { ProductQuickView } from "@/components/site/ProductQuickView";

import { ProductFilters } from "@/components/site/ProductFilters";
import {
  colourImageFor,
  colourOptions,
  coloursFromSearch,
  coloursToSearch,
  decorationOptions,
  familyMatchesFilters,
  featuredVariant,
  groupFamilies,
  parseFilterSearch,
  sortFamilies,
  type ProductFamily,
  type ProductFilterValue,
} from "@/lib/product-filters";

export const Route = createFileRoute("/products/$category")({
  validateSearch: parseFilterSearch,
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQueryOptions());
    const category = catalog.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    return { category, others: catalog.filter((c) => c.slug !== category.slug) };
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
            numberOfItems: category.products.length,
            itemListElement: category.products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Product",
                name: product.name,
                description: product.blurb || undefined,
                category: category.name,
                brand: { "@type": "Brand", name: "See See Bloom" },
              },
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
  const subcategoryIdFor = (slug: string) =>
    category.subcategories.find((s) => s.slug === slug)?.id ?? null;
  const activeSubId = filters.subcategory ? subcategoryIdFor(filters.subcategory) : null;
  const families = groupFamilies(
    category.products.filter((p) => !activeSubId || p.subcategory_id === activeSubId),
  );
  const visibleFamilies = sortFamilies(
    families.filter((family) => familyMatchesFilters(family, filters, category.slug)),
    filters,
  );
  const accent = spectrum(category.colour);

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
          subcategories={category.subcategories
            .filter((s) => category.products.some((p) => p.subcategory_id === s.id))
            .map((s) => ({ slug: s.slug, name: s.name }))}
          decorations={decorationOptions(category.products)}
          colours={colourOptions(category.products)}
          onChange={updateFilters}
          resultCount={visibleFamilies.length}
          totalCount={families.length}
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
