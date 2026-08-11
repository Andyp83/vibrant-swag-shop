import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import brandMark from "@/assets/brand/brand-bento-mark.png.asset.json";
import { MotionToggle } from "@/components/site/MotionToggle";

const nav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/colour-guide", label: "Colour guide" },
  { to: "/impact-aware", label: "Impact Aware" },
  { to: "/decoration", label: "Decoration" },
  { to: "/quote", label: "Get a quote" },
] as const;


export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="spectrum-bar h-1.5 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img
            src={brandMark.url}
            alt="Brand Bento logo"
            width={36}
            height={36}
            className="size-9 rounded-md"
          />
          <span className="display-type text-lg leading-none">Brand Bento</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <MotionToggle />
          <Link
            to="/quote"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get a quote
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <MotionToggle />
          <button
            type="button"
            aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md border border-border md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-border px-5 pb-4 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-border py-3 text-sm font-medium last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
