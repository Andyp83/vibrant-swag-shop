import { matchColourImage, cleanColourName } from "@/lib/colour-match";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ExternalLink, HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";
import { Reveal } from "@/components/site/Reveal";
import { borderAccentClass, softBgClass, spectrum, swatchClass, textClass } from "@/lib/catalog";
import { productPageQueryOptions, type CmsCategory, type CmsSubcategory } from "@/lib/catalog-query";
import type { CmsProduct } from "@/lib/catalog.functions";
import { detectExtras, parseBrandingOptions, parseProductChoices, splitBrandingOptions } from "@/lib/product-options";
import { useShortlist } from "@/lib/shortlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$category_/$subcategory_/$product")({
  loader: async ({ params, context }) => {
    // One product read, instead of downloading the whole catalogue.
    const result = await context.queryClient.ensureQueryData(
      productPageQueryOptions({
        category: params.category,
        subcategory: params.subcategory,
        product: params.product,
      }),
    );
    if (!result) throw notFound();
    return result;
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
  const gallery = useMemo(
    () =>
      product.images.length > 0
        ? product.images
        : product.image_url
          ? [
              {
                id: product.id,
                product_id: product.id,
                image_code: product.plu || product.id,
                image_url: product.image_url,
                source_filename: "",
                colour_label: null,
                shot_type: "Primary",
                sort_order: 0,
              },
            ]
          : [],
    [product],
  );
  const [selectedImage, setSelectedImage] = useState(gallery[0]);

  useEffect(() => {
    setSelectedImage(gallery[0]);
  }, [gallery]);

  const brandingOptions = useMemo(
    () => splitBrandingOptions(parseBrandingOptions(product.branding_options, product.methods)),
    [product],
  );
  const productChoices = useMemo(() => parseProductChoices(product.specifications), [product]);
  const extrasAvailable = useMemo(
    () =>
      Array.from(
        new Set([
          ...detectExtras(product.features, product.packaging, product.specifications, product.description),
          ...brandingOptions.extras,
        ]),
      ),
    [product, brandingOptions],
  );
  const shortlist = useShortlist();
  const saved = shortlist.items.find((item) => item.id === product.id);
  const [colour, setColour] = useState("");
  const [brandings, setBrandings] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<string[]>([]);
  const [loadedSaved, setLoadedSaved] = useState(false);

  useEffect(() => {
    if (loadedSaved || !shortlist.hydrated) return;
    setLoadedSaved(true);
    if (!saved) return;
    setColour(saved.colour ?? "");
    setBrandings((saved.brandings ?? []).map((b) => b.method));
    setChoices(saved.choices ?? {});
    setExtras(saved.extras ?? []);
  }, [saved, shortlist.hydrated, loadedSaved]);

  const pickColour = (label: string, name: string) => {
    const next = colour === label ? "" : label;
    setColour(next);
    if (next) {
      const match = matchColourImage(gallery, name, (img) => img.colour_label);
      // No confident photo for this colour: show the main shot rather than a wrong colour.
      setSelectedImage(match ?? gallery[0]);
    }
  };
  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const addToShortlist = () => {
    const added = shortlist.upsert(
      {
        id: product.id,
        name: product.name,
        categoryName: `${category.name} - ${subcategory.name}`,
        categorySlug: category.slug,
        imageUrl: selectedImage?.image_url ?? product.image_url ?? undefined,
        colourOptions: product.colour_options.map(
          (option) => cleanColourName(option.colour_name) || option.colour_name,
        ),
        methods: product.methods,
        moq: product.moq,
      },
      {
        colour,
        brandings: brandingOptions.branding.filter((b) => brandings.includes(b.method)),
        choices,
        extras,
      },
    );
    toast.success(added ? `${product.name} added to your shortlist` : "Shortlist updated with your choices");
  };

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
          <div className="space-y-6">
          <Reveal variant="scale" className="rounded-2xl border bg-card p-5">
            {selectedImage ? (
              <>
                <img
                  src={selectedImage.image_url}
                  alt={`${product.name} ${selectedImage.image_code}`}
                  width={900}
                  height={900}
                  className="aspect-square w-full object-contain"
                />
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  Image {selectedImage.image_code}
                  {selectedImage.colour_label ? ` / ${selectedImage.colour_label}` : ""}
                </p>
                {gallery.length > 1 ? (
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {gallery.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`aspect-square rounded-lg border bg-background p-1 transition ${
                          selectedImage.id === image.id ? borderAccentClass[accent] : "border-border"
                        }`}
                        aria-label={`Show image ${image.image_code}`}
                      >
                        <img
                          src={image.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={160}
                          height={160}
                          className="size-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                Image coming soon
              </div>
            )}
          </Reveal>

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
          </div>

          <Reveal variant="left">
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${textClass[accent]}`}>
              {category.name} / {subcategory.name}
            </p>
            <h1 className="display-type mt-4 text-4xl sm:text-6xl">{product.name}</h1>
            {product.publish_status === "draft" ? <DraftReviewPanel product={product} /> : null}
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

            <p className="mt-7 text-sm font-medium">
              Tap a colour, branding options and any extras, then add to your shortlist.
            </p>

            {product.colour_options.length > 0 ? (
              <OptionGroup title="Colour" hint="Choose one">
                <div className="flex flex-wrap gap-2">
                  {product.colour_options.map((c) => {
                    const label = cleanColourName(c.colour_name) || c.colour_name;
                    return (
                      <OptionButton
                        key={c.id}
                        active={colour === label}
                        accent={accent}
                        onClick={() => pickColour(label, label)}
                      >
                        <span className="font-semibold">{label}</span>
                      </OptionButton>
                    );
                  })}
                </div>
              </OptionGroup>
            ) : null}

            {productChoices.map((choice) => (
              <OptionGroup key={choice.label} title={choice.label} hint="Choose one">
                <div className="flex flex-wrap gap-2">
                  {choice.options.map((opt) => (
                    <OptionButton
                      key={opt}
                      active={choices[choice.label] === opt}
                      accent={accent}
                      onClick={() =>
                        setChoices((prev) => {
                          const next = { ...prev };
                          if (next[choice.label] === opt) delete next[choice.label];
                          else next[choice.label] = opt;
                          return next;
                        })
                      }
                    >
                      {opt}
                    </OptionButton>
                  ))}
                </div>
              </OptionGroup>
            ))}

            {brandingOptions.branding.length > 0 ? (
              <OptionGroup title="Branding options" hint="Choose one or more to compare prices">
                <ul className="space-y-2">
                  {brandingOptions.branding.map((b) => (
                    <li key={b.method} className="flex flex-wrap items-center gap-3">
                      <OptionButton
                        active={brandings.includes(b.method)}
                        accent={accent}
                        onClick={() => setBrandings((prev) => toggleIn(prev, b.method))}
                      >
                        {b.method}
                      </OptionButton>
                      {b.size ? <span className="text-xs text-muted-foreground">{b.size}</span> : null}
                    </li>
                  ))}
                </ul>
              </OptionGroup>
            ) : null}

            {extrasAvailable.length > 0 ? (
              <OptionGroup title="Optional extras" hint="Choose any">
                <div className="flex flex-wrap gap-2">
                  {extrasAvailable.map((e) => (
                    <OptionButton
                      key={e}
                      active={extras.includes(e)}
                      accent={accent}
                      onClick={() => setExtras((prev) => toggleIn(prev, e))}
                    >
                      {e}
                    </OptionButton>
                  ))}
                </div>
              </OptionGroup>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addToShortlist}
                className="sweep group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
              >
                {saved ? "Update shortlist" : "Add to Shortlist"}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
              {saved ? (
                <Link to="/shortlist" className="text-sm font-semibold underline underline-offset-4">
                  View shortlist
                </Link>
              ) : null}
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

function OptionGroup({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title} <span className="ml-1 normal-case tracking-normal opacity-80">· {hint}</span>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function OptionButton({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent: ReturnType<typeof spectrum>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 px-4 py-2 text-xs font-medium transition",
        active
          ? `${swatchClass[accent]} border-foreground text-foreground shadow-sm`
          : "border-border bg-card hover:border-foreground",
      )}
    >
      {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
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

/** Review-only panel: shows the supplier source data and outstanding warnings for a draft item. */
function DraftReviewPanel({ product }: { product: CmsProduct }) {
  const meta = product.supplier_meta ?? {};
  const text = (key: string) => {
    const value = meta[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  };
  const warnings = (product.review_notes ?? "")
    .split(" | ")
    .map((note) => note.trim())
    .filter(Boolean);
  const rows: [string, string][] = [
    ["Supplier SKU", text("supplier_sku")],
    ["Supplier title", text("supplier_title")],
    ["Supplier range", [text("supplier_subcategory"), text("supplier_detail_category")].filter(Boolean).join(" / ")],
    ["Supplier price", [text("currency"), text("supplier_price")].filter(Boolean).join(" ")],
    ["Supplier cost per item", [text("currency"), text("supplier_cost_per_item")].filter(Boolean).join(" ")],
    ["Supplier RRP", [text("currency"), text("supplier_rrp")].filter(Boolean).join(" ")],
    ["Website selling price", text("website_selling_price") || "Not set"],
    ["Stock snapshot", text("stock_quantity_snapshot")],
    ["Warranty source value", text("warranty_source_value")],
    ["Source export date", text("source_export_date")],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <aside className="mt-5 rounded-xl border-2 border-dashed p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em]">Draft — for review</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Not visible on the live site. Internal supplier source data below; no website selling price has been set.
      </p>
      {warnings.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          {warnings.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {typeof meta["source_url"] === "string" && meta["source_url"].length > 0 ? (
        <a
          className="mt-4 inline-block text-sm font-semibold underline"
          href={String(meta["source_url"])}
          target="_blank"
          rel="noreferrer"
        >
          Supplier source page
        </a>
      ) : null}
    </aside>
  );
}
