import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useShortlist, type ShortlistInput } from "@/lib/shortlist";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  item,
  className,
}: {
  item: ShortlistInput;
  className?: string | undefined;
}) {
  const { has, toggle } = useShortlist();
  const active = has(item.id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${item.name} from shortlist` : `Add ${item.name} to shortlist`}
      onClick={() => {
        const added = toggle(item);
        toast.success(
          added ? `${item.name} added to your shortlist` : `${item.name} removed from your shortlist`,
        );
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-3.5", active && "fill-current")} aria-hidden="true" />
      {active ? "Shortlisted" : "Favourite"}
    </button>
  );
}
