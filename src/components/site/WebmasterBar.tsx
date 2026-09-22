import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useIsWebmaster, useManageMode } from "@/lib/webmaster";

/**
 * A small floating bar shown only to a signed-in webmaster, so they can browse
 * the live site and switch on the per-item removal controls.
 */
export function WebmasterBar() {
  const isWebmaster = useIsWebmaster();
  const [manageMode, setManageMode] = useManageMode();

  if (!isWebmaster) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium text-foreground">Manage mode</span>
      <Switch
        checked={manageMode}
        onCheckedChange={setManageMode}
        aria-label="Toggle manage mode"
      />
      <Link
        to="/admin"
        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Back office
      </Link>
    </div>
  );
}
