import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory, type CmsSubcategory } from "@/lib/catalog-query";
import type { CmsProduct } from "@/lib/catalog.functions";

export const Route = createFileRoute("/products/$category/$subcategory")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQueryOptions());
    const category = catalog.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    const subcategory = category.subcategories.find((s) => s.slug === params.subcategory);
    if (!subcategory) throw notFound();
    return {
      category,
      subcategory,
      products: category.products.filter((p) => p.subcategory_id === subcategory.id),
      siblings: category.subcategories.filter((s) => s.slug !== subcategory.slug),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable | See See Bloom" }, { name: "robots", content: "noindex" }],
      };
    }
    const { category, subcategory } = loaderData;
    const title = `Branded ${subcategory.name} — ${category.name} | See See Bloom`;
    const description =
      subcategory.description ||
      `Custom branded ${subcategory.name.toLowerCase()} from our ${category.name.toLowerCase()} range — decorated with your logo, sourced to your budget and deadline.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: SubcategoryNotFound,
  component: SubcategoryPage,
});

function SubcategoryNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="display-type text-3xl">Range not found</h1>
      <p className="mt-4 text-muted-foreground">
        That sub-category doesn't exist — browse the full product range instead.
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

function SubcategoryPage() {
  const { category, subcategory, products, siblings } = Route.useLoaderData() as {
    category: CmsCategory;
    subcategory: CmsSubcategory;
    products: CmsProduct[];
    siblings: CmsSubcategory[];
  };
  const accent = spectrum(category.colour);

  return (
    <div className={softBgClass[accent]}>
      <div className={`h-2 w-full ${swatchClass[accent]}`} />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Link
          to="/products/$category"
          params={{ category: category.slug }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {category.name}
        </Link>

        <Reveal variant="left" className="mt-8 max-w-3xl">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${textClass[accent]}`}>
            {category.name}
          </p>
          <h1 className="display-type mt-4 text-5xl sm:text-6xl">{subcategory.name}</h1>
          <p className="mt-5 text-muted-foreground">
            {subcategory.description ||
              `Branded ${subcategory.name.toLowerCase()} sourced, decorated and delivered to spec. Tell us your quantity, colours and deadline and we'll come back with options and pricing.`}
          </p>
          <Link
            to="/quote"
            search={{ product: `${category.name} — ${subcategory.name}` }}
            className="sweep group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
          >
            Get a quote
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        {products.length > 0 ? (
          <>
            <h2 className="display-type mt-16 text-2xl sm:text-3xl">Examples</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
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
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        to="/quote"
                        search={{ product: p.name }}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                      >
                        Quote this item
                        <ArrowRight
                          className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                      <FavoriteButton
                        item={{
                          id: p.id,
                          name: p.name,
                          categoryName: `${category.name} — ${subcategory.name}`,
                          categorySlug: category.slug,
                          methods: p.methods,
                          moq: p.moq,
                        }}
                      />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-16 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            We're still adding example products to this range. Ask us for a quote and we'll send
            current options, colours and pricing straight back.
          </p>
        )}

        <h2 className="display-type mt-20 text-2xl">More in {category.name}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {siblings.map((s) => (
            <Link
              key={s.id}
              to="/products/$category/$subcategory"
              params={{ category: category.slug, subcategory: s.slug }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span className={`size-2.5 rounded-full ${swatchClass[accent]}`} aria-hidden="true" />
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
