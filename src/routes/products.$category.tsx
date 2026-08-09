import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory } from "@/lib/catalog-query";

export const Route = createFileRoute("/products/$category")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQueryOptions());
    const category = catalog.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    return { category, others: catalog.filter((c) => c.slug !== category.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Category not found | Brand Bento" }, { name: "robots", content: "noindex" }],
      };
    }
    const { category } = loaderData;
    const title = `${category.name} — Branded Merchandise | Brand Bento`;
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
  component: CategoryPage,
});

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
  const accent = spectrum(category.colour);

  return (
    <div>
      <div className={`h-2 w-full ${swatchClass[accent]}`} />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All categories
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.3em] ${textClass[accent]}`}
            >
              {category.tagline}
            </p>
            <h1 className="display-type mt-4 text-4xl sm:text-5xl">{category.name}</h1>
            <p className="mt-5 text-muted-foreground">{category.description}</p>
            <Link
              to="/quote"
              search={{ product: category.name }}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Quote this category <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            <img
              src={category.image_url}
              alt={`${category.name} branded merchandise examples`}
              width={1200}
              height={900}
              className="size-full object-cover"
            />
          </div>
        </div>

        <BannerRow
          title="Featured ranges"
          banners={categoryBanners[category.slug] ?? []}
          className="mt-20"
        />

        <h2 className="display-type mt-20 text-2xl sm:text-3xl">Examples</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.products.map((p) => (
            <article
              key={p.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
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
          ))}
        </div>

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
