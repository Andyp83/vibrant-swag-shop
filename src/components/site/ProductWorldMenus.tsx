import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { MegaMenu, MenuHeading } from "@/components/site/MegaMenu";
import { swatchClass } from "@/lib/catalog";
import { categoriesQueryOptions, type CmsCategory } from "@/lib/catalog-query";
import { decorations } from "@/lib/catalog";

const GIFTING_SLUG = "hampers-gifting";
const PRINT_SLUG = "print";

function useCategories() {
  const { data } = useQuery(categoriesQueryOptions());
  return data ?? [];
}

/** Two-pane list: categories on the left, subcategories of the hovered one on the right. */
function CategoryPanes({
  categories,
  close,
  emptyLabel,
}: {
  categories: CmsCategory[];
  close: () => void;
  emptyLabel: string;
}) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  const active = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
      <ul className="max-h-[58vh] space-y-0.5 overflow-y-auto pr-1">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              to="/products/$category"
              params={{ category: c.slug }}
              onMouseEnter={() => setActiveSlug(c.slug)}
              onFocus={() => setActiveSlug(c.slug)}
              onClick={close}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active?.slug === c.slug ? "bg-accent text-foreground" : "hover:bg-accent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-6 shrink-0 rounded-full ${swatchClass[(c.colour as keyof typeof swatchClass) in swatchClass ? (c.colour as keyof typeof swatchClass) : "red"]}`}
                />
                {c.name}
              </span>
              <ChevronRight className="size-3.5 shrink-0 opacity-40" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="min-w-0 rounded-2xl border border-border bg-card p-5">
        {active ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <MenuHeading>{active.name}</MenuHeading>
              <Link
                to="/products/$category"
                params={{ category: active.slug }}
                onClick={close}
                className="text-xs font-semibold underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            {active.tagline && (
              <p className="mt-1 text-sm text-muted-foreground">{active.tagline}</p>
            )}
            {active.subcategories.length > 0 ? (
              <ul className="mt-4 grid max-h-[46vh] gap-x-4 gap-y-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {active.subcategories.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/products/$category/$subcategory"
                      params={{ category: active.slug, subcategory: s.slug }}
                      onClick={close}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function SideLinks({
  title,
  links,
  close,
}: {
  title: string;
  links: { to: string; label: string; note: string; params?: Record<string, string> }[];
  close: () => void;
}) {
  return (
    <div className="mt-6 border-t border-border pt-5">
      <MenuHeading>{title}</MenuHeading>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link
            key={l.label}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={l.to as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={l.params as any}
            onClick={close}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <span className="block text-sm font-semibold">{l.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{l.note}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** 1. Branded merchandise — all spectrum categories + catalogues / sourcing / decoration. */
export function BrandedMenu() {
  const categories = useCategories().filter(
    (c) => c.slug !== GIFTING_SLUG && c.slug !== PRINT_SLUG,
  );

  return (
    <MegaMenu label="Branded merchandise" to="/products">
      {(close) => (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <MenuHeading>Branded merchandise</MenuHeading>
              <p className="mt-1 text-sm text-muted-foreground">
                Hover a category to see its ranges — everything brandable, colour-blocked by
                category.
              </p>
            </div>
            <Link
              to="/products"
              onClick={close}
              className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent lg:inline-flex"
            >
              Browse all products
            </Link>
          </div>

          <CategoryPanes
            categories={categories}
            close={close}
            emptyLabel="Browse the full range for this category."
          />

          <SideLinks
            title="Also under branded merchandise"
            close={close}
            links={[
              { to: "/catalogues", label: "Catalogues", note: "Flipbooks, lookbooks & guides" },
              { to: "/procurement", label: "Sourcing", note: "Request anything off-catalogue" },
              {
                to: "/decoration",
                label: "Decoration",
                note: `${decorations.length} branding methods`,
              },
              { to: "/shortlist", label: "Shortlist", note: "Your saved items & decoration picks" },
            ]}
          />
        </>
      )}
    </MegaMenu>
  );
}

const printServices = [
  { label: "Design studio", note: "Artwork setup, templates & brand kits", to: "/quote" },
  { label: "Print brokering", note: "Trade print sourced and managed for you", to: "/procurement" },
  { label: "Artwork requirements", note: "File types, DPI, bleed & colour", to: "/decoration" },
  { label: "Colour guide", note: "Pantone, CMYK and spot matching", to: "/colour-guide" },
];

/** 2. Print with us — print substrates + design & brokering services. */
export function PrintMenu() {
  const print = useCategories().find((c) => c.slug === PRINT_SLUG);

  return (
    <MegaMenu label="Print with us" to="/products/$category" params={{ category: PRINT_SLUG }}>
      {(close) => (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <MenuHeading>Print with us</MenuHeading>
              <p className="mt-1 text-sm text-muted-foreground">
                Design, artwork and print brokering — plus every substrate we print on.
              </p>
            </div>
            <Link
              to="/products/$category"
              params={{ category: PRINT_SLUG }}
              onClick={close}
              className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent lg:inline-flex"
            >
              View print range
            </Link>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <MenuHeading>Substrates & products</MenuHeading>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {(print?.subcategories ?? []).map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/products/$category/$subcategory"
                      params={{ category: PRINT_SLUG, subcategory: s.slug }}
                      onClick={close}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                {["Flyers & brochures", "Posters", "Presentation folders", "Pull-up banners"].map(
                  (label) => (
                    <li key={label}>
                      <Link
                        to="/quote"
                        search={{ product: label }}
                        onClick={close}
                        className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <MenuHeading>Services</MenuHeading>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {printServices.map((s) => (
                  <Link
                    key={s.label}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={s.to as any}
                    onClick={close}
                    className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{s.note}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </MegaMenu>
  );
}

const giftOccasions = [
  { label: "Christmas gifting", note: "Hampers and staff gifts for December" },
  { label: "End of financial year", note: "Thank-you gifts for clients and referrers" },
  { label: "Onboarding & welcome packs", note: "New starter kits that feel considered" },
  { label: "Settlement & handover gifts", note: "Builders, dealerships and property" },
];

/** 3. Gifting — hamper ranges plus seasonal gift ideas. */
export function GiftingMenu() {
  const gifting = useCategories().find((c) => c.slug === GIFTING_SLUG);
  const giftPacks = useCategories().find((c) => c.slug === "gift-packs");

  return (
    <MegaMenu label="Gifting" to="/products/$category" params={{ category: GIFTING_SLUG }}>
      {(close) => (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <MenuHeading>Gifting</MenuHeading>
              <p className="mt-1 text-sm text-muted-foreground">
                Hampers, client gifts and seasonal ideas — curated, packed and delivered in
                Australia.
              </p>
            </div>
            <Link
              to="/products/$category"
              params={{ category: GIFTING_SLUG }}
              onClick={close}
              className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent lg:inline-flex"
            >
              View gifting range
            </Link>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <MenuHeading>Gift ranges</MenuHeading>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {(gifting?.subcategories ?? []).map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/products/$category/$subcategory"
                      params={{ category: GIFTING_SLUG, subcategory: s.slug }}
                      onClick={close}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                {giftPacks && (
                  <li>
                    <Link
                      to="/products/$category"
                      params={{ category: giftPacks.slug }}
                      onClick={close}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {giftPacks.name}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <MenuHeading>Gift ideas by occasion</MenuHeading>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {giftOccasions.map((o) => (
                  <Link
                    key={o.label}
                    to="/quote"
                    search={{ product: o.label }}
                    onClick={close}
                    className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="block text-sm font-semibold">{o.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{o.note}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </MegaMenu>
  );
}
