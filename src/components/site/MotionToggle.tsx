import { Sparkles, Waves } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-reduced-motion";

/**
 * Lets visitors turn the site's motion effects on or off.
 * Defaults to whatever their operating system asks for.
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { reduced, toggle } = useMotionPreference();
  const Icon = reduced ? Waves : Sparkles;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={reduced}
      title={reduced ? "Turn animations on" : "Reduce animations"}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
        {reduced ? "Animations off" : "Reduce motion"}
      </span>
    </button>
  );
}
