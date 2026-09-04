import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { FavoriteButton } from "@/components/site/FavoriteButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { borderAccentClass, swatchClass, textClass, type SpectrumColor } from "@/lib/catalog";
import { productDetailQueryOptions, type CmsProduct } from "@/lib/catalog-query";
import { colourSwatchCss } from "@/lib/product-filters";

export type QuickViewProduct = CmsProduct;

type GalleryShot = { colourLabel?: string | null; label: string; url: string };
type Gallery = GalleryShot[];

function cssColorFor(shot: GalleryShot): string {
  return colourSwatchCss(shot.colourLabel || shot.label);
}


function optionLabel(product: QuickViewProduct): string {
  return (product.variant_label ?? "").trim() || "Standard";
}

function buildGallery(product: QuickViewProduct): Gallery {
  const shots: Gallery = [];
  for (const image of product.images ?? []) {
    if (!image?.image_url || shots.some((shot) => shot.url === image.image_url)) continue;
    const colourLabel = image.colour_label?.trim() || null;
    shots.push({
      colourLabel,
      label: colourLabel || image.image_code || image.shot_type || "Product",
      url: image.image_url,
    });
  }

  const colourShots = (product.colour_images ?? []).filter((image) => Boolean(image?.url));
  for (const [index, image] of colourShots.entries()) {
    if (shots.some((shot) => shot.url === image.url)) continue;
    shots.push({
      colourLabel: image.label || null,
      label: image.label || `Colour ${index + 1}`,
      url: image.url,
    });
  }

  if (product.image_url && !shots.some((shot) => shot.url === product.image_url)) {
    shots.unshift({ label: "Product", url: product.image_url });
  }
  return shots;
}

/** Index of the first gallery shot matching any of the preferred colour names. */
function preferredIndex(gallery: Gallery, preferred: string[]): number {
  for (const wanted of preferred.map((c) => c.trim().toLowerCase()).filter(Boolean)) {
    const index = gallery.findIndex((shot) =>
      `${shot.colourLabel ?? ""} ${shot.label}`.toLowerCase().includes(wanted),
    );
    if (index >= 0) return index;
  }
  return 0;
}

export function ProductQuickView({
  product,
  variants,
  accent,
  categoryName,
  categorySlug,
  productLink,
  preferredColours = [],
  onClose,
}: {
  product: QuickViewProduct | null;
  /** Sibling sizes/lids/finishes of the same item, including `product`. */
  variants?: QuickViewProduct[] | undefined;
  accent: SpectrumColor;
  categoryName: string;
  categorySlug: string;
  productLink?: { subcategory: string; product: string } | undefined;
  preferredColours?: string[];
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const preferredKey = preferredColours.join(",");

  const options = (variants ?? []).length > 1 ? (variants as QuickViewProduct[]) : [];
  const selected = options.find((v) => v.id === selectedId) ?? product;

  // The catalogue list omits long-text fields; pull the description on demand.
  const { data: detail } = useQuery({
    ...productDetailQueryOptions(selected?.id ?? ""),
    enabled: Boolean(selected?.id),
  });


  useEffect(() => {
    setSelectedId(product?.id ?? null);
  }, [product]);

  useEffect(() => {
    if (!selected) return;
    setActiveIndex(preferredIndex(buildGallery(selected), preferredKey.split(",")));
  }, [selected, preferredKey]);

  if (!product || !selected) return null;

  const gallery = buildGallery(selected);
  const active = gallery[Math.min(activeIndex, Math.max(gallery.length - 1, 0))];

  const colourNames = selected.colours
    ? selected.colours
        .split(/[,/]/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const familyName = options.length ? (selected.name.split(" - ")[0] ?? selected.name) : selected.name;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="text-left">
          <span className={`h-1.5 w-10 rounded-full ${swatchClass[accent]}`} aria-hidden="true" />
          <DialogTitle className="display-type mt-3 text-3xl">{familyName}</DialogTitle>
          <DialogDescription>
            {selected.plu ? `PLU ${selected.plu} · ` : ""}
            {categoryName}
          </DialogDescription>
        </DialogHeader>

        {options.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Options
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Product options">
              {options.map((variant) => {
                const isActive = variant.id === selected.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedId(variant.id)}
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? `${borderAccentClass[accent]} ${textClass[accent]}`
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {optionLabel(variant)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {active ? (
              <div
                className={`aspect-square overflow-hidden rounded-xl border-2 bg-background ${borderAccentClass[accent]}`}
              >
                <img
                  src={active.url}
                  alt={`${selected.name} — ${active.label}`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-contain p-4"
                />
              </div>
            ) : null}

            {gallery.length > 1 ? (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pick a colour
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2" role="listbox" aria-label="Colour options">
                  {gallery.map((shot, index) => (
                    <button
                      key={`swatch-${shot.url}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onClick={() => setActiveIndex(index)}
                      title={shot.label}
                      aria-label={`Show ${shot.label}`}
                      className={`size-8 rounded-full border-2 transition-all hover:scale-110 ${
                        index === activeIndex
                          ? `${borderAccentClass[accent]} ring-2 ring-offset-2 ring-offset-background ${borderAccentClass[accent].replace("border-", "ring-")}`
                          : "border-border"
                      }`}
                      style={{ backgroundColor: cssColorFor(shot) }}
                    />
                  ))}
                  {active ? (
                    <span className="ml-1 text-xs font-medium text-muted-foreground">{active.label}</span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gallery.map((shot, index) => (
                    <button
                      key={`${shot.url}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      title={shot.label}
                      aria-label={shot.label}
                      aria-current={index === activeIndex}
                      className={`size-14 overflow-hidden rounded-lg border-2 bg-background transition-transform hover:scale-105 ${
                        index === activeIndex ? borderAccentClass[accent] : "border-border"
                      }`}
                    >
                      <img
                        src={shot.url}
                        alt={shot.label}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
                {active ? (
                  <p className="mt-2 text-xs text-muted-foreground">{active.label}</p>
                ) : null}
              </>
            ) : null}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {detail?.description || selected.blurb}
            </p>

            <dl className="mt-5 space-y-2 text-xs text-muted-foreground">
              {selected.material_group && selected.material_group !== "General" ? (
                <div className="flex gap-2">
                  <dt className="font-semibold text-foreground">Material:</dt>
                  <dd>{selected.material_group}</dd>
                </div>
              ) : null}
              {selected.colours ? (
                <div className="flex gap-2">
                  <dt className="font-semibold text-foreground">Colours:</dt>
                  <dd>{selected.colours}</dd>
                </div>
              ) : null}
              {detail?.dimensions ? (
                <div className="flex gap-2">
                  <dt className="font-semibold text-foreground">Size:</dt>
                  <dd>{detail.dimensions}</dd>
                </div>
              ) : null}

              {selected.moq ? (
                <div className="flex gap-2">
                  <dt className="font-semibold text-foreground">Minimum:</dt>
                  <dd>{selected.moq}</dd>
                </div>
              ) : null}
            </dl>

            {gallery.length <= 1 && colourNames.length > 1 ? (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {colourNames.map((colour) => (
                  <li
                    key={colour}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {colour}
                  </li>
                ))}
              </ul>
            ) : null}

            {selected.methods.length > 0 ? (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Branding
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {selected.methods.map((method) => (
                    <li
                      key={method}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${borderAccentClass[accent]} ${textClass[accent]}`}
                    >
                      {method}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/quote"
                search={{ product: selected.name }}
                className="sweep group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Quote this item
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <FavoriteButton
                item={{
                  id: selected.id,
                  name: selected.name,
                  categoryName,
                  categorySlug,
                  methods: selected.methods,
                  moq: selected.moq,
                }}
              />
            </div>

            {productLink ? (
              <Link
                to="/products/$category/$subcategory/$product"
                params={{
                  category: categorySlug,
                  subcategory: productLink.subcategory,
                  product: productLink.product,
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
              >
                Full product page
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
