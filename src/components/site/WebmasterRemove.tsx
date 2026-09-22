import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { removeCatalogEntry } from "@/lib/webmaster.functions";
import { useIsWebmaster, useManageMode } from "@/lib/webmaster";

type Kind = "product" | "category" | "subcategory";

const KIND_LABEL: Record<Kind, string> = {
  product: "product",
  category: "category",
  subcategory: "sub-range",
};

/**
 * The small X a signed-in webmaster sees on live-site catalogue items and
 * taxonomy tiles while manage mode is on. Every removal asks for their password
 * and lets them choose between taking the entry off the site (kept in the back
 * office) and erasing it for good.
 */
export function WebmasterRemove({
  kind,
  id,
  name,
  className,
}: {
  kind: Kind;
  id: string;
  name: string;
  className?: string;
}) {
  const isWebmaster = useIsWebmaster();
  const [manageMode] = useManageMode();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"hide" | "erase">("hide");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const remove = useServerFn(removeCatalogEntry);

  const mutation = useMutation({
    mutationFn: () => remove({ data: { kind, id, mode, password } }),
    onSuccess: (result) => {
      toast.success(
        result.mode === "hide"
          ? `${name} is off the site — it's still in your back office.`
          : `${name} has been erased.`,
      );
      setOpen(false);
      setPassword("");
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isWebmaster || !manageMode) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={
          className ??
          "absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full border border-destructive/40 bg-background/90 text-destructive shadow-sm transition hover:bg-destructive hover:text-destructive-foreground"
        }
      >
        <X className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={(next) => (mutation.isPending ? null : setOpen(next))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {KIND_LABEL[kind]}</DialogTitle>
            <DialogDescription>{name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as "hide" | "erase")}>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 text-sm">
                <RadioGroupItem value="hide" className="mt-0.5" />
                <span>
                  <span className="font-medium">Take it off the site</span>
                  <span className="mt-1 block text-muted-foreground">
                    Nobody can browse or quote on it. It stays in your back office so you can put it
                    back later.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 text-sm">
                <RadioGroupItem value="erase" className="mt-0.5" />
                <span>
                  <span className="font-medium">Erase it completely</span>
                  <span className="mt-1 block text-muted-foreground">
                    Deleted for good, including its photos and colour options. This can't be undone.
                  </span>
                </span>
              </label>
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor={`webmaster-password-${id}`}>Confirm with your password</Label>
              <Input
                id={`webmaster-password-${id}`}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your account password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!password || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "hide" ? "Take off the site" : "Erase completely"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
