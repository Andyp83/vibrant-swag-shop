import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import brandLockup from "@/assets/brand/see-see-bloom-lockup-light.png";
import { BrandedMenu, GiftingMenu, PrintMenu } from "@/components/site/ProductWorldMenus";
import { ShortlistLink } from "@/components/site/ShortlistLink";

type MobileLink = { label: string; to: string; params?: Record<string, string> };

const mobileSections: { title: string; links: MobileLink[] }[] = [
  {
    title: "Branded merchandise",
    links: [
      { label: "All products", to: "/products" },
      { label: "Catalogues", to: "/catalogues" },
      { label: "Sourcing", to: "/procurement" },
      { label: "Decoration", to: "/decoration" },
      { label: "Shortlist", to: "/shortlist" },
    ],
  },
  {
    title: "Print with us",
    links: [
      { label: "Print range", to: "/products/$category", params: { category: "print" } },
      { label: "Colour guide", to: "/colour-guide" },
      { label: "Design & print brokering", to: "/procurement" },
    ],
  },
  {
    title: "Gifting",
    links: [
      {
        label: "Hampers & gifting",
        to: "/products/$category",
        params: { category: "hampers-gifting" },
      },
      { label: "Gift packs", to: "/products/$category", params: { category: "gift-packs" } },
    ],
  },
  {
    title: "More",
    links: [
      { label: "Get a quote", to: "/quote" },
      { label: "Client login", to: "/portal" },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="spectrum-bar h-1.5 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <img
            src={brandLockup}
            alt="See See Bloom — branded merchandise for brands worth remembering"
            width={1991}
            height={400}
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <BrandedMenu />
          <PrintMenu />
          <GiftingMenu />
          <ShortlistLink />
          <Link
            to="/portal"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Client login
          </Link>
          <Link
            to="/quote"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get a quote
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-5 pb-6 md:hidden">
          {mobileSections.map((section) => (
            <div key={section.title} className="border-b border-border py-3 last:border-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={link.to as any}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  params={link.params as any}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
