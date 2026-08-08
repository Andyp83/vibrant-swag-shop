import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/decoration", label: "Decoration" },
  { to: "/colour-guide", label: "Colour guide" },
  { to: "/quote", label: "Get a quote" },
] as const;


export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="spectrum-bar h-1.5 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid grid-cols-2 gap-0.5">
            <span className="size-2.5 rounded-[2px] bg-spectrum-red" />
            <span className="size-2.5 rounded-[2px] bg-spectrum-amber" />
            <span className="size-2.5 rounded-[2px] bg-spectrum-teal" />
            <span className="size-2.5 rounded-[2px] bg-spectrum-violet" />
          </span>
          <span className="display-type text-lg leading-none">Brand Bento</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.slice(0, 4).map((item) => (
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
          <Link
            to="/quote"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get a quote
          </Link>
        </nav>

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
