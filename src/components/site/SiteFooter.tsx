import { Link, useLoaderData } from "@tanstack/react-router";
import type { CmsCategory } from "@/lib/catalog-query";

export function SiteFooter() {
  const data = useLoaderData({ from: "__root__" }) as CmsCategory[] | undefined;
  const categories = data ?? [];

  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="spectrum-bar h-1.5 w-full" />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={brandMark.url}
            alt="Brand Bento logo"
            width={40}
            height={40}
            className="size-10 rounded-md"
          />
          <p className="display-type mt-3 text-lg">Brand Bento</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Neatly curated. Beautifully branded. Merchandise and corporate gifts, sourced and
            decorated for teams that care how things look.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/products/$category"
                  params={{ category: c.slug }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Company
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/products" className="text-muted-foreground hover:text-foreground">
                All products
              </Link>
            </li>
            <li>
              <Link to="/decoration" className="text-muted-foreground hover:text-foreground">
                Decoration options
              </Link>
            </li>
            <li>
              <Link to="/quote" className="text-muted-foreground hover:text-foreground">
                Request a quote
              </Link>
            </li>
            <li>
              <Link to="/lookbook" className="text-muted-foreground hover:text-foreground">
                Brands lookbook
              </Link>
            </li>
            <li>
              <Link to="/colour-guide" className="text-muted-foreground hover:text-foreground">
                Colour guide
              </Link>
            </li>
            <li>
              <Link to="/impact-aware" className="text-muted-foreground hover:text-foreground">
                Impact Aware
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Catalogue manager
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Studio
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Mon–Fri, 8.30am–5pm
            <br />
            hello@brandbento.example
            <br />
            Artwork studio replies within one business day.
          </p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          © {new Date().getFullYear()} Brand Bento. Product imagery shown unbranded for illustration.
        </p>
      </div>
    </footer>
  );
}
