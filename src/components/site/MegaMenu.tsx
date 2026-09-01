import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

/**
 * Desktop nav item that expands on hover into a full-width panel.
 * Shared shell used by the three top-level product worlds.
 */
export function MegaMenu({
  label,
  to,
  params,
  children,
  onNavigate,
}: {
  label: string;
  to: string;
  params?: Record<string, string>;
  children: (close: () => void) => ReactNode;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(84);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    const header = wrapRef.current?.closest("header");
    if (header) setTop(header.getBoundingClientRect().bottom);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };
  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={to as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={params as any}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        activeProps={{ className: "text-foreground" }}
      >
        {label}
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Link>

      <div
        style={{ top }}
        className={`fixed left-0 right-0 z-40 origin-top border-b border-border bg-background/98 shadow-xl backdrop-blur transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="spectrum-bar h-1 w-full" />
        <div className="mx-auto max-w-6xl px-5 py-8">{children(close)}</div>
      </div>
    </div>
  );
}

/** Small heading used inside mega-menu panels. */
export function MenuHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}
