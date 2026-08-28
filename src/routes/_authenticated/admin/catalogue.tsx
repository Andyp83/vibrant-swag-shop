import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { swatchClass, type SpectrumColor } from "@/lib/catalog";
import { catalogQueryOptions } from "@/lib/catalog-query";
import {
  checkIsAdmin,
  deleteCategory,
  deleteProduct,
  deleteSubcategory,
  saveCategory,
  saveProduct,
  saveSubcategory,
  type CmsCategory,
  type CmsProduct,
  type CmsSubcategory,
} from "@/lib/catalog.functions";


export const Route = createFileRoute("/_authenticated/admin/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue Manager | See See Bloom" },
      {
        name: "description",
        content:
          "Manage See See Bloom product categories, minimum order quantities, decoration tags and catalogue imagery.",
      },
      { property: "og:title", content: "Catalogue Manager | See See Bloom" },
      { property: "og:description", content: "Manage the See See Bloom product catalogue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const colourOptions = Object.keys(swatchClass) as SpectrumColor[];

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdminFn = useServerFn(checkIsAdmin);

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });
  const catalogQuery = useQuery(catalogQueryOptions());

  const [categoryDraft, setCategoryDraft] = useState<Partial<CmsCategory> | null>(null);
  const [subcategoryDraft, setSubcategoryDraft] = useState<Partial<CmsSubcategory> | null>(null);
  const [productDraft, setProductDraft] = useState<Partial<CmsProduct> | null>(null);

  const saveCategoryFn = useServerFn(saveCategory);
  const deleteCategoryFn = useServerFn(deleteCategory);
  const saveSubcategoryFn = useServerFn(saveSubcategory);
  const deleteSubcategoryFn = useServerFn(deleteSubcategory);
  const saveProductFn = useServerFn(saveProduct);
  const deleteProductFn = useServerFn(deleteProduct);


  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };

  const categoryMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => saveCategoryFn({ data: values }),
    onSuccess: () => {
      toast.success("Category saved");
      setCategoryDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const productMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => saveProductFn({ data: values }),
    onSuccess: () => {
      toast.success("Product saved");
      setProductDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => deleteCategoryFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Category removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => deleteProductFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Product removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const subcategoryMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => saveSubcategoryFn({ data: values }),
    onSuccess: () => {
      toast.success("Sub-category saved");
      setSubcategoryDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeSubcategory = useMutation({
    mutationFn: (id: string) => deleteSubcategoryFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Sub-category removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });



  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (!adminQuery.data?.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="display-type text-3xl">No admin access</h1>
        <p className="mt-4 text-muted-foreground">
          This account isn't an administrator, so it can't edit the catalogue.
        </p>
        <Button onClick={handleSignOut} className="mt-6 rounded-full">
          Sign out
        </Button>
      </div>
    );
  }

  const categories = catalogQuery.data ?? [];
  const nextCategoryOrder = categories.length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Catalogue manager
          </p>
          <h1 className="display-type mt-3 text-4xl">Categories & products</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Everything here goes straight to the live site — category imagery, MOQ values and
            decoration tags all update the moment you save.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              setCategoryDraft({
                slug: "",
                name: "",
                tagline: "",
                description: "",
                colour: "red",
                image_url: "",
                sort_order: nextCategoryOrder,
              })
            }
            className="rounded-full"
          >
            <Plus className="size-4" aria-hidden="true" /> New category
          </Button>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      {catalogQuery.isLoading ? (
        <p className="mt-16 text-center text-muted-foreground">Loading catalogue…</p>
      ) : (
        <div className="mt-12 space-y-10">
          {categories.map((category) => (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-border">
              <div className={`h-2 w-full ${swatchClass[coerceColour(category.colour)]}`} />
              <div className="flex flex-wrap items-start gap-5 p-6">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={`${category.name} catalogue image`}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-48 flex-1">
                  <h2 className="display-type text-xl">{category.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    /{category.slug} · {category.tagline}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCategoryDraft(category)}>
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${category.name}” and its ${category.products.length} products?`,
                        )
                      ) {
                        removeCategory.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-border px-6 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Sub-categories ({category.subcategories.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSubcategoryDraft({
                        category_id: category.id,
                        slug: "",
                        name: "",
                        description: "",
                        image_url: null,
                        sort_order: category.subcategories.length + 1,
                      })
                    }
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Add sub-category
                  </Button>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {category.subcategories.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center gap-1 rounded-full border border-border bg-card pl-3 text-xs font-medium"
                    >
                      {sub.name}
                      <button
                        type="button"
                        aria-label={`Edit ${sub.name}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setSubcategoryDraft(sub)}
                      >
                        <Pencil className="size-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${sub.name}`}
                        className="p-1.5 pr-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (window.confirm(`Delete “${sub.name}”?`)) {
                            removeSubcategory.mutate(sub.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border bg-secondary/40 px-6 py-5">

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Products ({category.products.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setProductDraft({
                        category_id: category.id,
                        subcategory_id: null,
                        name: "",
                        blurb: "",
                        colours: "",
                        moq: "MOQ 25",
                        methods: [],
                        image_url: null,
                        sort_order: category.products.length,
                      })

                    }
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Add product
                  </Button>
                </div>

                <ul className="mt-4 space-y-2">
                  {category.products.map((product) => (
                    <li
                      key={product.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="min-w-44 flex-1">
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.colours} · {product.moq}
                          {product.subcategory_id
                            ? ` · ${
                                category.subcategories.find((s) => s.id === product.subcategory_id)
                                  ?.name ?? ""
                              }`
                            : ""}
                        </p>
                      </div>

                      <ul className="flex flex-wrap gap-1.5">
                        {product.methods.map((m) => (
                          <li
                            key={m}
                            className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                          >
                            {m}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setProductDraft(product)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete “${product.name}”?`)) {
                              removeProduct.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {categoryDraft ? (
        <CategoryDialog
          draft={categoryDraft}
          saving={categoryMutation.isPending}
          onCancel={() => setCategoryDraft(null)}
          onSave={(values) => categoryMutation.mutate(values)}
        />
      ) : null}

      {subcategoryDraft ? (
        <SubcategoryDialog
          draft={subcategoryDraft}
          saving={subcategoryMutation.isPending}
          onCancel={() => setSubcategoryDraft(null)}
          onSave={(values) => subcategoryMutation.mutate(values)}
        />
      ) : null}

      {productDraft ? (
        <ProductDialog
          draft={productDraft}
          subcategories={
            categories.find((c) => c.id === productDraft.category_id)?.subcategories ?? []
          }
          saving={productMutation.isPending}
          onCancel={() => setProductDraft(null)}
          onSave={(values) => productMutation.mutate(values)}
        />
      ) : null}

    </div>
  );
}

function coerceColour(colour: string): SpectrumColor {
  return (colourOptions as string[]).includes(colour) ? (colour as SpectrumColor) : "red";
}

function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
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

function ImageField({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
}) {
  const { upload, uploading } = useImageUpload();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
          {value ? <img src={value} alt="" className="size-full object-cover" /> : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImageUp className="size-4" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  toast.error("Images must be 10MB or smaller");
                  return;
                }
                const url = await upload(file);
                if (url) onChange(url);
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="w-fit text-xs text-muted-foreground underline underline-offset-4"
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CategoryDialog({
  draft,
  saving,
  onCancel,
  onSave,
}: {
  draft: Partial<CmsCategory>;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    slug: draft.slug ?? "",
    name: draft.name ?? "",
    tagline: draft.tagline ?? "",
    description: draft.description ?? "",
    colour: coerceColour(draft.colour ?? "red"),
    image_url: draft.image_url ?? "",
    hero_image_url: draft.hero_image_url ?? null,
    sort_order: draft.sort_order ?? 0,
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            The slug becomes the page address, e.g. /products/{form.slug || "drinkware"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-tagline">Tagline</Label>
            <Input
              id="cat-tagline"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Accent colour</Label>
            <div className="flex flex-wrap gap-2">
              {colourOptions.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  aria-label={colour}
                  aria-pressed={form.colour === colour}
                  onClick={() => setForm({ ...form, colour })}
                  className={`size-8 rounded-full ${swatchClass[colour]} ${
                    form.colour === colour ? "ring-2 ring-foreground ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <ImageField
            label="Category image (homepage tile)"
            value={form.image_url || null}
            onChange={(value) => setForm({ ...form, image_url: value ?? "" })}
          />

          <ImageField
            label="Category page hero image"
            value={form.hero_image_url}
            onChange={(value) => setForm({ ...form, hero_image_url: value })}
          />


          <div className="space-y-2">
            <Label htmlFor="cat-order">Display order</Label>
            <Input
              id="cat-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => onSave(draft.id ? { ...form, id: draft.id } : form)}
          >
            {saving ? "Saving…" : "Save category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubcategoryDialog({
  draft,
  saving,
  onCancel,
  onSave,
}: {
  draft: Partial<CmsSubcategory>;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    slug: draft.slug ?? "",
    name: draft.name ?? "",
    description: draft.description ?? "",
    image_url: draft.image_url ?? null,
    sort_order: draft.sort_order ?? 0,
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit sub-category" : "New sub-category"}</DialogTitle>
          <DialogDescription>
            The slug becomes the page address, e.g. /products/drinkware/{form.slug || "travel-mugs"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: draft.id ? prev.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-slug">Slug</Label>
              <Input
                id="sub-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-description">Description</Label>
            <Textarea
              id="sub-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <ImageField
            label="Sub-category image (optional)"
            value={form.image_url}
            onChange={(value) => setForm({ ...form, image_url: value })}
          />

          <div className="space-y-2">
            <Label htmlFor="sub-order">Display order</Label>
            <Input
              id="sub-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => onSave({ ...form, id: draft.id, category_id: draft.category_id })}
          >
            {saving ? "Saving…" : "Save sub-category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ProductDialog({
  draft,
  subcategories,
  saving,
  onCancel,
  onSave,
}: {
  draft: Partial<CmsProduct>;
  subcategories: CmsSubcategory[];
  saving: boolean;
  onCancel: () => void;
  onSave: (values: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    name: draft.name ?? "",
    blurb: draft.blurb ?? "",
    colours: draft.colours ?? "",
    moq: draft.moq ?? "",
    methods: (draft.methods ?? []).join(", "),
    image_url: draft.image_url ?? null,
    colour_images: draft.colour_images ?? [],
    subcategory_id: draft.subcategory_id ?? "",
    sort_order: draft.sort_order ?? 0,
  });


  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Decoration tags are shown as chips on the category page — separate them with commas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Name</Label>
            <Input
              id="prod-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-blurb">Description</Label>
            <Textarea
              id="prod-blurb"
              rows={3}
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod-colours">Colour availability</Label>
              <Input
                id="prod-colours"
                placeholder="17 powder-coat colours"
                value={form.colours}
                onChange={(e) => setForm({ ...form, colours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-moq">MOQ</Label>
              <Input
                id="prod-moq"
                placeholder="MOQ 25"
                value={form.moq}
                onChange={(e) => setForm({ ...form, moq: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-subcategory">Sub-category</Label>
            <select
              id="prod-subcategory"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.subcategory_id}
              onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-methods">Decoration tags</Label>
            <Input
              id="prod-methods"
              placeholder="Laser engraving, Digital UV print"
              value={form.methods}
              onChange={(e) => setForm({ ...form, methods: e.target.value })}
            />
          </div>


          <ImageField
            label="Product image (optional)"
            value={form.image_url}
            onChange={(value) => setForm({ ...form, image_url: value })}
          />

          <div className="space-y-3 rounded-lg border border-border p-3">
            <Label>Colour photos</Label>
            <p className="text-xs text-muted-foreground">
              Add one photo per colour — these appear in the pop-up gallery on the category page.
            </p>
            {form.colour_images.map((shot, index) => (
              <div key={index} className="space-y-2 rounded-md bg-muted/40 p-2">
                <Input
                  placeholder="Colour name"
                  value={shot.label}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      colour_images: form.colour_images.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    })
                  }
                />
                <ImageField
                  label="Photo"
                  value={shot.url || null}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      colour_images: form.colour_images.map((item, i) =>
                        i === index ? { ...item, url: value ?? "" } : item,
                      ),
                    })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      colour_images: form.colour_images.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="mr-1 size-3.5" aria-hidden="true" /> Remove colour
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setForm({ ...form, colour_images: [...form.colour_images, { label: "", url: "" }] })
              }
            >
              <Plus className="mr-1 size-3.5" aria-hidden="true" /> Add colour
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-order">Display order</Label>
            <Input
              id="prod-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                ...form,
                id: draft.id,
                category_id: draft.category_id,
                subcategory_id: form.subcategory_id || null,
                colour_images: form.colour_images.filter((shot) => Boolean(shot.url)),
                methods: form.methods
                  .split(",")
                  .map((m) => m.trim())
                  .filter(Boolean),
              })

            }
          >
            {saving ? "Saving…" : "Save product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
