import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import brandLockup from "@/assets/brand/see-see-bloom-lockup-light.png";
import { DecorationMenu } from "@/components/site/DecorationMenu";
import { ShortlistLink } from "@/components/site/ShortlistLink";


const nav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/catalogues", label: "Catalogues" },
  { to: "/decoration", label: "Decoration" },
  { to: "/quote", label: "Get a quote" },
  { to: "/portal", label: "Client login" },
] as const;


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
          {nav.slice(0, 3).map((item) => (
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
          <DecorationMenu />
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
