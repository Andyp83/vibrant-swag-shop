import { Check, ChevronDown, LayoutGrid, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  colourSwatchCss,
  moqOptions,
  type GridDensity,
  type ProductFilterValue,
} from "@/lib/product-filters";

type Option = { slug: string; name: string };

type Props = {
  value: ProductFilterValue;
  categories?: Option[];
  subcategories?: Option[];
  decorations: string[];
  colours: string[];
  onChange: (next: Partial<ProductFilterValue>) => void;
  resultCount: number;
  totalCount: number;
  className?: string;
};

export function ProductFilters({
  value,
  categories,
  subcategories,
  decorations,
  colours,
  onChange,
  resultCount,
  totalCount,
  className = "",
}: Props) {
  const selected = value.colours ?? [];
  const active =
    Boolean(value.category) ||
    Boolean(value.subcategory) ||
    Boolean(value.decoration) ||
    selected.length > 0 ||
    value.impact ||
    value.moq > 0;

  const toggleColour = (colour: string) => {
    const next = selected.includes(colour)
      ? selected.filter((c) => c !== colour)
      : [...selected, colour];
    onChange({ colours: next });
  };


  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex flex-wrap items-end gap-5">
        {categories && categories.length > 0 ? (
          <label className="flex min-w-[190px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
            <select
              value={value.category}
              onChange={(e) => onChange({ category: e.target.value, subcategory: "" })}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {subcategories && subcategories.length > 0 ? (
          <label className="flex min-w-[190px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sub-range
            <select
              value={value.subcategory}
              onChange={(e) => onChange({ subcategory: e.target.value })}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              <option value="">All sub-ranges</option>
              {subcategories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex min-w-[190px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Decoration
          <select
            value={value.decoration}
            onChange={(e) => onChange({ decoration: e.target.value })}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground"
          >
            <option value="">Any method</option>
            {decorations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <div className="flex min-w-[210px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Colours
          <Popover>
            <PopoverTrigger
              className="flex w-full items-center justify-between gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground hover:bg-accent"
              aria-label="Filter by colours"
            >
              <span className="flex items-center gap-2 truncate">
                {selected.length > 0 ? (
                  <>
                    <span className="flex -space-x-1" aria-hidden="true">
                      {selected.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundColor: colourSwatchCss(c) }}
                        />
                      ))}
                    </span>
                    <span className="truncate">
                      {selected.length === 1
                        ? selected[0]
                        : `${selected.length} colours selected`}
                    </span>
                  </>
                ) : (
                  "Any colour"
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border p-2">
                <div
                  className="flex rounded-full border border-border p-0.5"
                  role="group"
                  aria-label="Colour match mode"
                >
                  {(["any", "all"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={(value.colourMatch ?? "any") === mode}
                      onClick={() => onChange({ colourMatch: mode })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        (value.colourMatch ?? "any") === mode
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Match {mode}
                    </button>
                  ))}
                </div>
                {selected.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onChange({ colours: [] })}
                    className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {colours.map((c) => {
                  const isOn = selected.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => toggleColour(c)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                    >
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: colourSwatchCss(c) }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{c}</span>
                      {isOn ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>


        {selected.length > 0 ? (
          <label className="flex min-w-[200px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sort
            <select
              value={value.sort ?? "default"}
              onChange={(e) =>
                onChange({ sort: e.target.value === "colour-match" ? "colour-match" : "default" })
              }
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              <option value="default">Featured order</option>
              <option value="colour-match">Best colour match</option>
            </select>
          </label>
        ) : null}


        <label className="flex min-w-[170px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Minimum order
          <select
            value={String(value.moq)}
            onChange={(e) => onChange({ moq: Number(e.target.value) })}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium normal-case tracking-normal text-foreground"
          >
            {moqOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          aria-pressed={value.impact}
          onClick={() => onChange({ impact: !value.impact })}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            value.impact
              ? "border-transparent bg-spectrum-green text-background"
              : "border-border bg-background hover:bg-accent"
          }`}
        >
          <span className="size-2.5 rounded-full bg-spectrum-green" aria-hidden="true" />
          Impact Aware only
        </button>

        <div
          className="flex rounded-full border border-border p-0.5"
          role="group"
          aria-label="Grid density"
        >
          {(["3", "5"] as GridDensity[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={value.density === d}
              onClick={() => onChange({ density: d })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                value.density === d
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={`${d} products per row`}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              {d}
            </button>
          ))}
        </div>

        {active ? (
          <button
            type="button"
            onClick={() =>
              onChange({
                category: "",
                subcategory: "",
                decoration: "",
                colours: [],
                colourMatch: "any",
                sort: "default",
                impact: false,
                moq: 0,
                density: "3",
              })
            }

            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" /> Clear filters
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        Showing {resultCount} of {totalCount} products
      </p>
    </div>
  );
}
