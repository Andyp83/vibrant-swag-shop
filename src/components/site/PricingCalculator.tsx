import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Check, Loader2, Search, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/backoffice/format";
import { priceShortlist, searchPricingProducts, type PricingSearchProduct } from "@/lib/pricing/quote.functions";
import { useShortlist } from "@/lib/shortlist";

export function PricingCalculator() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<PricingSearchProduct | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [decoration, setDecoration] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { has, add, update } = useShortlist();
  const searchProducts = useServerFn(searchPricingProducts);
  const priceItems = useServerFn(priceShortlist);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const results = useQuery({
    queryKey: ["pricing-product-search", debouncedSearch],
    queryFn: () => searchProducts({ data: { query: debouncedSearch } }),
    enabled: debouncedSearch.length >= 2 && !selected,
    staleTime: 60_000,
    retry: false,
  });

  const line = useMemo(() => {
    if (!selected) return null;
    return {
      productId: selected.id,
      name: selected.name,
      decoration,
      quantity: Math.max(1, Number(quantity) || 1),
      notes: "",
    };
  }, [decoration, quantity, selected]);

  const estimate = useQuery({
    queryKey: ["pricing-calculator", line],
    queryFn: () => priceItems({ data: { items: line ? [line] : [] } }),
    enabled: Boolean(line && submitted),
    staleTime: 60_000,
    retry: false,
  });

  function chooseProduct(product: PricingSearchProduct) {
    setSelected(product);
    setSearch(product.name);
    setDecoration(product.methods.length === 1 ? (product.methods[0] ?? "") : "");
    setSubmitted(false);
  }

  function resetProduct() {
    setSelected(null);
    setSearch("");
    setDecoration("");
    setSubmitted(false);
  }

  function addToShortlist() {
    if (!selected || !line) return;
    if (!has(selected.id)) {
      add({
        id: selected.id,
        name: selected.name,
        categoryName: selected.categoryName,
        categorySlug: selected.categorySlug,
        methods: selected.methods,
        moq: selected.moq,
      });
    }
    update(selected.id, { decoration, quantity: String(line.quantity) });
    toast.success(`${selected.name} added to your shortlist`);
  }

  const pricing = estimate.data;
  const pricedLine = pricing?.lines[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="calculator-fields">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-spectrum-cyan-soft text-spectrum-cyan">
            <Calculator className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">One item at a time</p>
            <h2 id="calculator-fields" className="display-type text-2xl">Choose your product</h2>
          </div>
        </div>

        <div className="relative mt-7 space-y-2">
          <Label htmlFor="pricing-product">Item</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="pricing-product"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                if (selected) setSelected(null);
                setSubmitted(false);
              }}
              placeholder="Search products by name"
              className="pl-9 pr-20"
              autoComplete="off"
            />
            {selected && (
              <Button type="button" variant="ghost" size="sm" onClick={resetProduct} className="absolute right-1 top-1">
                Change
              </Button>
            )}
          </div>

          {!selected && debouncedSearch.length >= 2 && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
              {results.isLoading ? (
                <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Searching…</p>
              ) : results.data?.length ? (
                results.data.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => chooseProduct(product)}
                    className="flex w-full items-start justify-between gap-4 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{product.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{product.categoryName}{product.plu ? ` · ${product.plu}` : ""}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{product.moq ? `MOQ ${product.moq}` : ""}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">No matching merchandise found.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pricing-quantity">Quantity</Label>
            <Input
              id="pricing-quantity"
              type="number"
              min={1}
              max={1000000}
              value={quantity}
              onChange={(event) => { setQuantity(event.target.value); setSubmitted(false); }}
            />
            {selected?.moq && <p className="text-xs text-muted-foreground">Supplier minimum: {selected.moq}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricing-decoration">Decoration</Label>
            <select
              id="pricing-decoration"
              value={decoration}
              disabled={!selected}
              onChange={(event) => { setDecoration(event.target.value); setSubmitted(false); }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Unbranded / recommend one</option>
              {(selected?.methods ?? []).map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          disabled={!selected || estimate.isFetching}
          onClick={() => setSubmitted(true)}
          className="mt-7 rounded-full px-7"
        >
          {estimate.isFetching ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Calculator aria-hidden="true" />}
          {estimate.isFetching ? "Calculating…" : "Calculate price"}
        </Button>
      </section>

      <aside className="rounded-2xl border border-border bg-secondary p-6 sm:p-8" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Indicative price</p>
        {!submitted || !selected ? (
          <div className="mt-8 border-t border-border pt-8 text-sm text-muted-foreground">
            Select a catalogue item, quantity and decoration to see your estimate before adding it to your shortlist.
          </div>
        ) : estimate.isError ? (
          <p className="mt-8 border-t border-border pt-8 text-sm text-destructive">We couldn't calculate that item. Please try again.</p>
        ) : pricing && pricedLine ? (
          <div className="mt-5">
            <h3 className="display-type text-2xl">{selected.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{pricedLine.quantity} units{pricedLine.decoration ? ` · ${pricedLine.decoration}` : ""}</p>

            {pricedLine.priced ? (
              <>
                <p className="display-type mt-7 text-4xl">{formatMoney(pricing.totalCents)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Estimated total including GST and freight</p>
                <dl className="mt-7 space-y-3 border-t border-border pt-5 text-sm">
                  <PriceRow label="Price per item" value={formatMoney(pricedLine.unitPriceCents)} />
                  <PriceRow label="Items" value={formatMoney(pricedLine.amountCents)} />
                  {pricing.setupCents > 0 && <PriceRow label="Decoration setup" value={formatMoney(pricing.setupCents)} />}
                  <PriceRow label="Freight" value={formatMoney(pricing.freightCents)} />
                  <PriceRow label={`GST ${pricing.taxRate}%`} value={formatMoney(pricing.taxCents)} />
                </dl>
              </>
            ) : (
              <div className="mt-7 border-t border-border pt-6">
                <p className="display-type text-3xl">Price on application</p>
                <p className="mt-2 text-sm text-muted-foreground">This product does not have a complete supplier cost table yet. Add it to your shortlist and we'll price it manually.</p>
              </div>
            )}

            <Button type="button" onClick={addToShortlist} className="mt-8 w-full rounded-full" size="lg">
              {has(selected.id) ? <Check aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
              {has(selected.id) ? "Update shortlist item" : "Add to shortlist"}
            </Button>
            <Link to="/shortlist" className="mt-4 block text-center text-sm font-semibold underline underline-offset-4">Review and submit shortlist</Link>
          </div>
        ) : (
          <p className="mt-8 flex items-center gap-2 border-t border-border pt-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Working out your estimate…</p>
        )}
        <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Indicative only. We confirm stock, artwork and final pricing before production.</p>
      </aside>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}