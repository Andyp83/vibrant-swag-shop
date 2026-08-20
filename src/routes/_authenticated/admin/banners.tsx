import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImageUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { bannerPlacements, bannersQueryOptions, categoryPlacement } from "@/lib/banners";
import { deleteBanner, saveBanner, type SiteBanner } from "@/lib/banners.functions";
import { catalogQueryOptions } from "@/lib/catalog-query";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
      { title: "Banner Manager | See See Bloom" },
      {
        name: "description",
        content: "Choose which promotional banners appear on each See See Bloom page.",
      },
      { property: "og:title", content: "Banner Manager | See See Bloom" },
      { property: "og:description", content: "Manage See See Bloom promotional banners." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BannersPage,
});

type Draft = Partial<SiteBanner>;

const emptyDraft: Draft = {
  key: "",
  image_url: "",
  alt: "",
  link_to: "",
  cta: "",
  placements: [],
  is_active: false,
  sort_order: 0,
};

function BannersPage() {
  const queryClient = useQueryClient();
  const bannersQuery = useQuery(bannersQueryOptions());
  const catalogQuery = useSuspenseQuery(catalogQueryOptions());
  const [draft, setDraft] = useState<Draft | null>(null);

  const saveFn = useServerFn(saveBanner);
  const deleteFn = useServerFn(deleteBanner);
  const { upload, uploading } = useImageUpload();

  const placementOptions = [
    ...bannerPlacements.map((p) => ({ value: p.value as string, label: p.label as string })),
    ...catalogQuery.data.map((category) => ({
      value: categoryPlacement(category.slug),
      label: `${category.name} page`,
    })),
  ];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["site-banners"] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => saveFn({ data: values }),
    onSuccess: () => {
      toast.success("Banner saved");
      setDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Banner removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit(values: Draft) {
    saveMutation.mutate({
      ...(values.id ? { id: values.id } : {}),
      key: values.key ?? "",
      image_url: values.image_url ?? "",
      alt: values.alt ?? "",
      link_to: values.link_to?.trim() ? values.link_to.trim() : null,
      cta: values.cta?.trim() ? values.cta.trim() : null,
      placements: values.placements ?? [],
      is_active: Boolean(values.is_active),
      sort_order: Number(values.sort_order ?? 0),
    });
  }

  const banners = bannersQuery.data ?? [];
  const liveCount = banners.filter((b) => b.is_active && b.placements.length > 0).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Banners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {banners.length} in the library · {liveCount} showing on the site. A banner appears only
            when it is switched on and assigned to at least one page.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="size-4" />
          New banner
        </Button>
      </div>

      {bannersQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <article
              key={banner.id}
              className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[220px_1fr]"
            >
              <img
                src={banner.image_url}
                alt={banner.alt}
                loading="lazy"
                className="w-full rounded-lg border bg-secondary object-contain"
              />
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{banner.key}</p>
                    <p className="text-sm text-muted-foreground">{banner.alt || "No alt text"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      aria-label={`Show ${banner.key} on the site`}
                      onCheckedChange={(checked) =>
                        submit({ ...banner, is_active: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {banner.is_active ? "Live" : "Off"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {banner.placements.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No pages assigned</span>
                  ) : (
                    banner.placements.map((placement) => (
                      <span key={placement} className="rounded-full border px-2 py-0.5 text-xs">
                        {placementOptions.find((o) => o.value === placement)?.label ?? placement}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDraft({ ...banner })}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(banner.id)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit banner" : "New banner"}</DialogTitle>
            <DialogDescription>
              Pick the pages this banner should appear on, then switch it on.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                submit(draft);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-key">Reference name</Label>
                  <Input
                    id="banner-key"
                    value={draft.key ?? ""}
                    onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                    placeholder="summer-drinkware"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-sort">Display order</Label>
                  <Input
                    id="banner-sort"
                    type="number"
                    min={0}
                    value={draft.sort_order ?? 0}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-image">Image URL</Label>
                <Input
                  id="banner-image"
                  value={draft.image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  required
                />
                <div className="flex items-center gap-3">
                  <input
                    id="banner-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      const url = await upload(file);
                      if (url) setDraft((current) => ({ ...(current ?? {}), image_url: url }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("banner-file")?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImageUp className="size-4" />
                    )}
                    Upload artwork
                  </Button>
                  {draft.image_url ? (
                    <img
                      src={draft.image_url}
                      alt=""
                      className="h-10 rounded border object-contain"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-alt">Alt text</Label>
                <Textarea
                  id="banner-alt"
                  rows={2}
                  value={draft.alt ?? ""}
                  onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-link">Link (optional)</Label>
                  <Input
                    id="banner-link"
                    value={draft.link_to ?? ""}
                    onChange={(e) => setDraft({ ...draft, link_to: e.target.value })}
                    placeholder="/products/drinkware"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-cta">Button label (optional)</Label>
                  <Input
                    id="banner-cta"
                    value={draft.cta ?? ""}
                    onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                    placeholder="See drinkware"
                  />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Show on these pages</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {placementOptions.map((option) => {
                    const checked = (draft.placements ?? []).includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = new Set(draft.placements ?? []);
                            if (event.target.checked) next.add(option.value);
                            else next.delete(option.value);
                            setDraft({ ...draft, placements: [...next] });
                          }}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <Switch
                  checked={Boolean(draft.is_active)}
                  onCheckedChange={(checked) => setDraft({ ...draft, is_active: checked })}
                />
                Show this banner on the site
              </label>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save banner
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `banners/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
        ...(file.type ? { contentType: file.type } : {}),
        upsert: false,
      });
      if (error) throw error;
      return `/api/public/catalog-image/${path}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
