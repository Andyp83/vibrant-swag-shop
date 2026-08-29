import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PlacementBanners } from "@/components/site/PlacementBanners";
import { ProductFilters } from "@/components/site/ProductFilters";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { spectrum, swatchClass } from "@/lib/catalog";
import {
  colourOptions,
  coloursFromSearch,
  coloursToSearch,
  decorationOptions,
  familyMatchesFilters,
  featuredVariant,
  groupFamilies,
  parseFilterSearch,
  sortFamilies,

  type ProductFilterValue,
} from "@/lib/product-filters";

export const Route = createFileRoute("/lookbook")({
  validateSearch: parseFilterSearch,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(catalogQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Brands Lookbook | See See Bloom" },
      {
        name: "description",
        content:
          "Browse the See See Bloom brands lookbook: filter every product by decoration method, Impact Aware materials and minimum order quantity to find ideas fast.",
      },
      { property: "og:title", content: "Brands Lookbook | See See Bloom" },
      {
        property: "og:description",
        content:
          "Filter the full range by decoration method, Impact Aware materials and minimum order quantity — inspiration for your next branded gift or team drop.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl px-5 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">Lookbook not found.</div>
  ),
  component: LookbookPage,
});

function LookbookPage() {
  const { data: categories } = useSuspenseQuery(catalogQueryOptions());
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filters: ProductFilterValue = {
    category: "",
    subcategory: "",
    decoration: search.decoration ?? "",
    colours: coloursFromSearch(search.colour),
    colourMatch: search.colourMatch ?? "any",
    sort: search.sort ?? "default",
    impact: search.impact ?? false,
    moq: search.moq ?? 0,
    density: search.density ?? "5",
  };

  const updateFilters = (next: Partial<ProductFilterValue>) => {
    const merged = { ...filters, ...next };
    navigate({
      search: {
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

  const allEntries = categories.flatMap((c) =>
    groupFamilies(c.products).map((family) => ({ family, category: c })),
  );
  const matching = allEntries.filter(({ family, category }) =>
    familyMatchesFilters(family, filters, category.slug),
  );
  const visible = sortFamilies(
    matching.map((entry) => entry.family),
    filters,
  ).map((family) => matching.find((entry) => entry.family === family)!);


  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Brands Lookbook
      </p>
      <h1 className="display-type mt-4 max-w-2xl text-4xl sm:text-5xl">
        Inspiration for every brand moment
      </h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Flip through the lookbook to see how products come together into considered kits, event
        drops and corporate gift sets — or filter the full range below by decoration method, Impact
        Aware materials and minimum order quantity.
      </p>

      <PlacementBanners placement="lookbook" className="mt-10" />

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="See See Bloom brands lookbook"
          allowFullScreen
          loading="lazy"
          className="block h-[500px] w-full border-none sm:h-[640px] lg:h-[760px]"
          src="https://e.issuu.com/embed.html?d=brands_lookbook_-_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>

      <section className="mt-20">
        <h2 className="display-type text-2xl sm:text-3xl">Browse the full range</h2>
        <ProductFilters
          className="mt-6"
          value={filters}
          decorations={decorationOptions(allEntries.flatMap((x) => x.family.variants))}
          colours={colourOptions(allEntries.flatMap((x) => x.family.variants))}
          onChange={updateFilters}
          resultCount={visible.length}
          totalCount={allEntries.length}
        />

        <div
          className={`mt-8 grid gap-4 sm:grid-cols-2 ${
            filters.density === "5" ? "lg:grid-cols-5" : "lg:grid-cols-3"
          }`}
        >
          {visible.map(({ family, category: c }) => {
            const p = featuredVariant(family, filters);
            return (
            <article key={family.key} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <span
                className={`h-1.5 w-10 rounded-full ${swatchClass[spectrum(c.colour)]}`}
                aria-hidden="true"
              />
              <Link
                to="/products/$category"
                params={{ category: c.slug }}
                className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {c.name}
              </Link>
              <h3 className="mt-2 font-semibold">{family.name}</h3>
              {family.variants.length > 1 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {family.variants.length} options
                </p>
              ) : null}
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
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {m}
                  </li>
                ))}
              </ul>
              <Link
                to="/quote"
                search={{ product: p.name }}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
              >
                Quote this item <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </article>
            );
          })}
        </div>
        {visible.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing matches those filters yet — try another decoration method or a higher minimum
            order.
          </p>
        ) : null}
      </section>

      <section className="mt-16 rounded-2xl border border-border bg-secondary p-10 text-center">
        <h2 className="display-type text-3xl">Ready to build your kit?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Share the pages or products you love, upload your logo and we'll put together a quote with
          decoration options and quantities.
        </p>
        <Link
          to="/quote"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Request a quote <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
