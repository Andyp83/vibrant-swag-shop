import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { decorations, swatchClass } from "@/lib/catalog";
import { decorationImages } from "@/lib/decoration-images";

/** Desktop nav item that expands on hover into a grid of decoration methods. */
export function DecorationMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        to="/decoration"
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        activeProps={{ className: "text-foreground" }}
      >
        Decoration
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Link>

      <div
        className={`fixed left-0 right-0 top-[var(--ssb-header-h,84px)] z-40 origin-top border-b border-border bg-background/98 shadow-xl backdrop-blur transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="spectrum-bar h-1 w-full" />
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Decoration options
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {decorations.length} branding methods — pick one to see specs, lead times and
                artwork requirements.
              </p>
            </div>
            <Link
              to="/decoration"
              onClick={() => setOpen(false)}
              className="hidden shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent lg:inline-flex"
            >
              View all
            </Link>
          </div>

          <div className="mt-7 grid max-h-[60vh] gap-3 gap-y-8 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
            {decorations.map((d) => (
              <Link
                key={d.slug}
                to="/decoration"
                hash={d.slug}
                onClick={() => setOpen(false)}
                className="group relative rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                {decorationImages[d.slug]?.url && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -top-4 size-14 transition-transform duration-200 ease-out group-hover:scale-125 lg:size-16"
                  >
                    <img
                      src={decorationImages[d.slug]!.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-contain mix-blend-multiply drop-shadow-lg"
                    />
                  </span>
                )}
                <span
                  className={`block h-1.5 w-8 rounded-full ${swatchClass[d.colour]}`}
                  aria-hidden="true"
                />
                <span className="mt-3 block pr-12 text-sm font-semibold leading-snug lg:pr-14">
                  {d.name}
                </span>
                <span className="mt-1 block line-clamp-2 pr-12 text-xs text-muted-foreground lg:pr-14">
                  {d.bestFor}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
