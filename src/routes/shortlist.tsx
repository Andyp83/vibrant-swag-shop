import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getShortlistProducts } from "@/lib/catalog.functions";
import { toast } from "sonner";

import {
  ShortlistQuoteForm,
  type ArtworkSelection,
} from "@/components/site/ShortlistQuoteForm";
import { decorations } from "@/lib/catalog";
import type { ShortlistItem } from "@/lib/shortlist";
import { isFrontBackApparel, useShortlist } from "@/lib/shortlist";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/shortlist")({
  head: () => ({
    meta: [
      { title: "Your Shortlist — Favourite Merchandise | See See Bloom" },
      {
        name: "description",
        content:
          "Review the branded merchandise you've favourited, pick your preferred decoration method for each item and send the whole shortlist through as a quote request.",
      },
      { property: "og:title", content: "Your Shortlist — Favourite Merchandise | See See Bloom" },
      {
        property: "og:description",
        content:
          "Favourite products, choose a preferred print method for each and send your shortlist to our studio for pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShortlistPage,
});

function ShortlistPage() {
  const { items, hydrated, update, remove, clear } = useShortlist();
  const [artwork, setArtwork] = useState<Record<string, ArtworkSelection>>({});
  const productIds = items
    .map((i) => i.id)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const { data: liveInfo } = useQuery({
    queryKey: ["shortlist-products", productIds],
    queryFn: () => getShortlistProducts({ data: { ids: productIds } }),
    enabled: hydrated && productIds.length > 0,
    staleTime: 5 * 60_000,
  });
  const infoById = new Map((liveInfo ?? []).map((p) => [p.id, p]));

  const patchArtwork = (id: string, patch: Partial<ArtworkSelection>) => {
    setArtwork((current) => ({
      ...current,
      [id]: { usePrevious: false, ...current[id], ...patch },
    }));
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Your shortlist
      </p>
      <h1 className="display-type mt-4 text-4xl sm:text-5xl">Favourites & decoration picks</h1>
      <p className="mt-5 text-muted-foreground">
        Everything you've favourited lives here. Choose the decoration method you'd prefer on each
        item, add quantities or notes, then send the whole shortlist to our studio in one quote
        request.
      </p>

      {!hydrated ? null : items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">
            No favourites yet. Browse the ranges and tap “Favourite” on anything you like the look
            of.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 space-y-5">
            {items.map((stored, index) => {
              const info = infoById.get(stored.id);
              const item: ShortlistItem = {
                ...stored,
                imageUrl: stored.imageUrl || info?.imageUrl || undefined,
                colourOptions: stored.colourOptions?.length ? stored.colourOptions : info?.colourOptions,
              };
              const options = item.methods.length > 0 ? item.methods : decorations.map((d) => d.name);
              const selection = artwork[item.id] ?? { usePrevious: false };
              const frontBack = isFrontBackApparel(item);
              return (
                <li key={item.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-4">
                      {item.imageUrl ? (
                        <ProductLink info={info}><img
                          src={item.imageUrl}
                          alt={item.name}
                          width={112}
                          height={112}
                          className="size-24 shrink-0 rounded-lg border border-border bg-background object-contain p-2 sm:size-28"
                        /></ProductLink>
                      ) : (
                        <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-center text-[11px] text-muted-foreground sm:size-28">
                          Image coming soon
                        </div>
                      )}
                      <div className="min-w-0">
                      <h2 className="font-semibold">
                        <ProductLink info={info}>{item.name}</ProductLink>
                      </h2>
                      {info ? (
                        <Link
                          to="/products/$category/$subcategory/$product"
                          params={{ category: info.category, subcategory: info.subcategory, product: info.product }}
                          className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          View product
                        </Link>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.categoryName}
                        {item.moq ? ` · minimum ${item.moq}` : ""}
                      </p>
                      <ChoiceChips item={item} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.name} from shortlist`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {item.colourOptions && item.colourOptions.length > 0 ? (
                      <div className="space-y-2 sm:col-span-3">
                        <Label htmlFor={`colour-${item.id}`}>Colour</Label>
                        <select
                          id={`colour-${item.id}`}
                          aria-label={`Colour for ${item.name}`}
                          value={item.colour ?? ""}
                          onChange={(e) => update(item.id, { colour: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Not sure — recommend one</option>
                          {item.colour && !item.colourOptions.includes(item.colour) ? (
                            <option value={item.colour}>{item.colour}</option>
                          ) : null}
                          {item.colourOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`decoration-${item.id}`}>Favoured decoration</Label>
                      <select
                        id={`decoration-${item.id}`}
                        value={item.decoration}
                        onChange={(e) => update(item.id, { decoration: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Not sure — recommend one</option>
                        {item.decoration && !options.includes(item.decoration) ? (
                          <option value={item.decoration}>{item.decoration}</option>
                        ) : null}
                        {options.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min={1}
                        value={item.quantity}
                        placeholder="e.g. 250"
                        onChange={(e) => update(item.id, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                      <Input
                        id={`notes-${item.id}`}
                        value={item.notes}
                        maxLength={200}
                        placeholder="Colours, logo placement, deadline…"
                        onChange={(e) => update(item.id, { notes: e.target.value })}
                      />
                    </div>

                    <fieldset className="space-y-4 border-t border-border pt-5 sm:col-span-3">
                      <legend className="text-sm font-semibold">High-resolution logo or design</legend>
                      {index > 0 ? (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selection.usePrevious}
                            onCheckedChange={(checked) =>
                              patchArtwork(item.id, { usePrevious: checked === true })
                            }
                          />
                          Use the same artwork as the previous item
                        </label>
                      ) : null}

                      {!selection.usePrevious ? (
                        frontBack ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <ArtworkSlot
                              item={item}
                              placement="Front"
                              decoration={selection.frontDecoration ?? ""}
                              file={selection.frontArtwork}
                              options={options}
                              onDecoration={(value) => patchArtwork(item.id, { frontDecoration: value })}
                              onFile={(file) => patchArtwork(item.id, { frontArtwork: file })}
                            />
                            <ArtworkSlot
                              item={item}
                              placement="Back"
                              decoration={selection.backDecoration ?? ""}
                              file={selection.backArtwork}
                              options={options}
                              onDecoration={(value) => patchArtwork(item.id, { backDecoration: value })}
                              onFile={(file) => patchArtwork(item.id, { backArtwork: file })}
                            />
                          </div>
                        ) : (
                          <FilePicker
                            id={`artwork-${item.id}`}
                            file={selection.artwork}
                            onFile={(file) => patchArtwork(item.id, { artwork: file })}
                          />
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          This item will use the previous item’s uploaded artwork.
                        </p>
                      )}
                    </fieldset>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10">
            <ShortlistQuoteForm items={items} artwork={artwork} onSent={clear} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold"
            >
              Keep browsing
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold"
            >
              Clear shortlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const ARTWORK_ACCEPT = ".pdf,.ai,.eps,.svg,.png,.jpg,.jpeg,.tif,.tiff,.zip";
const ARTWORK_EXTENSION = /\.(pdf|ai|eps|svg|png|jpe?g|tiff?|zip)$/i;

function checkedFile(file: File | undefined, onFile: (file: File | undefined) => void) {
  if (file && file.size > 25 * 1024 * 1024) {
    onFile(undefined);
    return `${file.name} is larger than 25MB`;
  }
  if (file && !ARTWORK_EXTENSION.test(file.name)) {
    onFile(undefined);
    return `${file.name} isn't a supported artwork file`;
  }
  onFile(file);
  return null;
}

function FilePicker({
  id,
  file,
  onFile,
}: {
  id: string;
  file?: File | undefined;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Artwork file (optional, max 25MB)</Label>
      <Input
        id={id}
        type="file"
        accept={ARTWORK_ACCEPT}
        onChange={(event) => {
          const picked = event.target.files?.[0];
          const error = checkedFile(picked, onFile);
          if (error) {
            event.target.value = "";
            toast.error(error);
          }
        }}
      />
      {file ? <p className="text-xs text-muted-foreground">{file.name} ready to send</p> : null}
    </div>
  );
}

function ArtworkSlot({
  item,
  placement,
  decoration,
  file,
  options,
  onDecoration,
  onFile,
}: {
  item: ShortlistItem;
  placement: "Front" | "Back";
  decoration: string;
  file?: File | undefined;
  options: string[];
  onDecoration: (value: string) => void;
  onFile: (file: File | undefined) => void;
}) {
  const key = placement.toLowerCase();
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold">{placement}</h3>
      <div className="space-y-2">
        <Label htmlFor={`${key}-decoration-${item.id}`}>Decoration option</Label>
        <select
          id={`${key}-decoration-${item.id}`}
          value={decoration}
          onChange={(event) => onDecoration(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Not required / recommend one</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <FilePicker id={`${key}-artwork-${item.id}`} file={file} onFile={onFile} />
    </div>
  );
}

function ChoiceChips({ item }: { item: ShortlistItem }) {
  const chips = [
    item.colour ? `Colour: ${item.colour}` : null,
    ...Object.entries(item.choices ?? {}).map(([k, v]) => `${k}: ${v}`),
    ...(item.brandings ?? []).map((b) => (b.size ? `${b.method} · ${b.size}` : b.method)),
    ...(item.extras ?? []).map((e) => `Extra: ${e}`),
  ].filter((c): c is string => Boolean(c));
  if (chips.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <li key={c} className="rounded-full border bg-muted px-2.5 py-1 text-[11px] font-medium">
          {c}
        </li>
      ))}
    </ul>
  );
}

function ProductLink({
  info,
  children,
}: {
  info: { category: string; subcategory: string; product: string } | undefined;
  children: React.ReactNode;
}) {
  if (!info) return <>{children}</>;
  return (
    <Link
      to="/products/$category/$subcategory/$product"
      params={{ category: info.category, subcategory: info.subcategory, product: info.product }}
      className="hover:underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
