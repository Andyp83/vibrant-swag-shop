import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink, HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";

import { FavoriteButton } from "@/components/site/FavoriteButton";
import { Reveal } from "@/components/site/Reveal";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { catalogQueryOptions, type CmsCategory, type CmsSubcategory } from "@/lib/catalog-query";
import type { CmsProduct } from "@/lib/catalog.functions";

export const Route = createFileRoute("/products/$category_/$subcategory_/$product")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQueryOptions());
    const category = catalog.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    const subcategory = category.subcategories.find((s) => s.slug === params.subcategory);
    if (!subcategory) throw notFound();
    const product = category.products.find(
      (p) =>
        p.subcategory_id === subcategory.id &&
        (p.slug === params.product || p.id === params.product || p.plu === params.product),
    );
    if (!product) throw notFound();
    return { category, subcategory, product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product not found | See See Bloom" }, { name: "robots", content: "noindex" }],
      };
    }
    const { category, subcategory, product } = loaderData;
    const title = `${product.name} | See See Bloom`;
    const description = product.description || product.blurb || category.description;
    const url = `https://seeseebloom.com.au/products/${category.slug}/${subcategory.slug}/${product.slug || product.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(product.image_url ? [{ property: "og:image", content: product.image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            sku: product.plu || undefined,
            image: product.image_url || undefined,
            description,
            material: product.materials || product.material_group || undefined,
            category: `${category.name} / ${subcategory.name}`,
            brand: { "@type": "Brand", name: "See See Bloom" },
          }),
        },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="display-type text-3xl">Product not found</h1>
      <p className="mt-4 text-muted-foreground">
        That product is not available in the catalogue right now.
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

function ProductPage() {
  const { category, subcategory, product } = Route.useLoaderData() as {
    category: CmsCategory;
    subcategory: CmsSubcategory;
    product: CmsProduct;
  };
  const accent = spectrum(category.colour);
  const specs = splitSpecList(product.specifications);
  const features = splitSpecList(product.features);

  return (
    <div className={softBgClass[accent]}>
      <div className={`h-2 w-full ${swatchClass[accent]}`} />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Link
          to="/products/$category/$subcategory"
          params={{ category: category.slug, subcategory: subcategory.slug }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {subcategory.name}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <Reveal variant="scale" className="rounded-2xl border bg-card p-6">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                width={900}
                height={900}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                Image coming soon
              </div>
            )}
          </Reveal>

          <Reveal variant="left">
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${textClass[accent]}`}>
              {category.name} / {subcategory.name}
            </p>
            <h1 className="display-type mt-4 text-4xl sm:text-6xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              {product.plu ? <span className="rounded-full border px-3 py-1">PLU {product.plu}</span> : null}
              {product.service ? <span className="rounded-full border px-3 py-1">{product.service}</span> : null}
              {product.material_group ? (
                <span className="rounded-full border px-3 py-1">{product.material_group}</span>
              ) : null}
            </div>
            <p className="mt-5 text-muted-foreground">
              {product.description || product.blurb || "Ask us for current colours, branding options and pricing."}
            </p>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Colours" value={product.colours} />
              <Detail label="Minimum" value={product.moq} />
              <Detail label="Dimensions" value={product.dimensions} />
              <Detail label="Materials" value={product.materials} />
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/quote"
                search={{ product: product.name }}
                className="sweep group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
              >
                Quote this item
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <FavoriteButton
                item={{
                  id: product.id,
                  name: product.name,
                  categoryName: `${category.name} - ${subcategory.name}`,
                  categorySlug: category.slug,
                  methods: product.methods,
                  moq: product.moq,
                }}
              />
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <InfoSection title="Features">
            {features.length > 1 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {features.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className={`mt-2 size-1.5 shrink-0 rounded-full ${swatchClass[accent]}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{product.features || product.blurb}</p>
            )}
          </InfoSection>

          <InfoSection title="Branding Options">
            {product.methods.length > 0 ? (
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {product.methods.map((method) => (
                  <li
                    key={method}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${borderAccentClass[accent]} ${textClass[accent]}`}
                  >
                    {method}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {product.branding_options || "Branding options depend on artwork, quantity and stock."}
            </p>
          </InfoSection>

          <InfoSection title="Specifications">
            {specs.length > 1 ? (
              <dl className="space-y-2 text-sm text-muted-foreground">
                {specs.map((item) => {
                  const [label, ...rest] = item.split(": ");
                  return (
                    <div key={item} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                      <dt className="font-semibold text-foreground">{rest.length ? label : "Spec"}</dt>
                      <dd>{rest.length ? rest.join(": ") : item}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{product.specifications || "Specifications on request."}</p>
            )}
          </InfoSection>

          <InfoSection title="Packaging">
            <p className="text-sm text-muted-foreground">
              {product.packaging || "Packaging details confirmed at quote stage."}
            </p>
            {product.carton_details ? (
              <p className="mt-4 text-xs text-muted-foreground">{product.carton_details}</p>
            ) : null}
          </InfoSection>
        </div>

        {product.source_url ? (
          <a
            href={product.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            Source product page
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}

        <div className={`mt-14 rounded-2xl border-2 bg-card p-6 ${borderAccentClass[accent]}`}>
          <HeartHandshake className={`size-8 ${textClass[accent]}`} aria-hidden="true" />
          <h2 className="display-type mt-4 text-2xl">Need a tighter shortlist?</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tell us the quantity, deadline and artwork style. We'll check current stock, recommend
            the right decoration method and return a quote with realistic lead times.
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm">{value}</dd>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="display-type text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function splitSpecList(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}
