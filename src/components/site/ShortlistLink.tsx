import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { useShortlist } from "@/lib/shortlist";

export function ShortlistLink({
  onNavigate,
  className,
}: {
  onNavigate?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const { items } = useShortlist();

  return (
    <Link
      to="/shortlist"
      onClick={onNavigate}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      }
      activeProps={{ className: "text-foreground" }}
    >
      <Heart className="size-4" aria-hidden="true" />
      Shortlist
      {items.length > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {items.length}
        </span>
      )}
    </Link>
  );
}
