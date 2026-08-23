import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory } from "@/lib/catalog-query";
import { categoryPlacement } from "@/lib/banners";
import { categoryVideos } from "@/lib/videos";
import { PlacementBanners } from "@/components/site/PlacementBanners";
import { VideoStrip } from "@/components/site/VideoStrip";
import { Reveal } from "@/components/site/Reveal";

import { ProductFilters } from "@/components/site/ProductFilters";
import {
  decorationOptions,
  matchesFilters,
  parseFilterSearch,
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
    return {
      meta: [
        { title },
        { name: "description", content: category.description },
        { property: "og:title", content: title },
        { property: "og:description", content: category.description },
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
  const { category, others } = Route.useLoaderData() as {
    category: CmsCategory;
    others: CmsCategory[];
  };
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const filters: ProductFilterValue = {
    decoration: search.decoration ?? "",
    impact: search.impact ?? false,
    moq: search.moq ?? 0,
  };
  const visibleProducts = category.products.filter((p) =>
    matchesFilters(p, filters, category.slug),
  );
  const accent = spectrum(category.colour);

  const updateFilters = (next: Partial<ProductFilterValue>) => {
    const merged = { ...filters, ...next };
    navigate({
      search: {
        ...(merged.decoration ? { decoration: merged.decoration } : {}),
        ...(merged.impact ? { impact: true } : {}),
        ...(merged.moq ? { moq: merged.moq } : {}),
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

        {category.subcategories.length > 0 ? (
          <section className="mt-20">
            <h2 className="display-type text-2xl sm:text-3xl">Browse {category.name}</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {category.subcategories.length} sub-ranges — pick one to see what's available and
              request a quote.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.subcategories.map((s, i) => (
                <Reveal key={s.id} delay={(i % 3) * 60} variant="up">
                  <Link
                    to="/products/$category/$subcategory"
                    params={{ category: category.slug, subcategory: s.slug }}
                    className={`lift group flex h-full items-center justify-between gap-3 rounded-xl border-2 bg-card px-5 py-4 ${borderAccentClass[accent]}`}
                  >
                    <span className="text-sm font-semibold">{s.name}</span>
                    <ArrowRight
                      className={`size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${textClass[accent]}`}
                      aria-hidden="true"
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}




        <PlacementBanners
          placement={categoryPlacement(category.slug)}
          title="Featured ranges"
          className="mt-20"
        />

        {(categoryVideos[category.slug] ?? []).length > 0 ? (
          <section className="mt-20">
            <h2 className="display-type text-2xl sm:text-3xl">In motion</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {(categoryVideos[category.slug] ?? []).map((v) => (
                <VideoStrip key={v.url} video={v} />
              ))}
            </div>
          </section>
        ) : null}



        <h2 className="display-type mt-20 text-2xl sm:text-3xl">Examples</h2>
        <ProductFilters
          className="mt-6"
          value={filters}
          decorations={decorationOptions(category.products)}
          onChange={updateFilters}
          resultCount={visibleProducts.length}
          totalCount={category.products.length}
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90} variant="up">
              <article
                className={`lift flex h-full flex-col rounded-xl border-2 bg-card p-6 ${borderAccentClass[accent]}`}
              >
                <span className={`h-1.5 w-10 rounded-full ${swatchClass[accent]}`} />
                <h3 className="mt-4 font-semibold">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <dt className="font-semibold text-foreground">Colours:</dt>
                    <dd>{p.colours}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold text-foreground">Minimum:</dt>
                    <dd>{p.moq}</dd>
                  </div>
                </dl>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.methods.map((m) => (
                    <li
                      key={m}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-transform duration-300 hover:scale-105 ${borderAccentClass[accent]} ${textClass[accent]}`}
                    >
                      {m}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/quote"
                  search={{ product: p.name }}
                  className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                >
                  Quote this item
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No examples in this category match those filters — try a different decoration method or
            a higher minimum order.
          </p>
        ) : null}


        <h2 className="display-type mt-20 text-2xl">Other categories</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {others.map((c) => (
            <Link
              key={c.slug}
              to="/products/$category"
              params={{ category: c.slug }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span className={`size-2.5 rounded-full ${swatchClass[spectrum(c.colour)]}`} aria-hidden="true" />
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
