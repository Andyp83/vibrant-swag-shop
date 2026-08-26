import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Trash2, ArrowRight } from "lucide-react";

import { decorations } from "@/lib/catalog";
import { useShortlist } from "@/lib/shortlist";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const navigate = useNavigate();

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
            {items.map((item) => {
              const options = item.methods.length > 0 ? item.methods : decorations.map((d) => d.name);
              return (
                <li key={item.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.categoryName}
                        {item.moq ? ` · minimum ${item.moq}` : ""}
                      </p>
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`decoration-${item.id}`}>Favoured decoration</Label>
                      <select
                        id={`decoration-${item.id}`}
                        value={item.decoration}
                        onChange={(e) => update(item.id, { decoration: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Not sure — recommend one</option>
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
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/quote", search: { shortlist: true } })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Send shortlist as a quote request
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
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
