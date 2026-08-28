import { X } from "lucide-react";

import {
  colourSwatchCss,
  moqOptions,
  type ProductFilterValue,
} from "@/lib/product-filters";

type Props = {
  value: ProductFilterValue;
  decorations: string[];
  colours: string[];
  onChange: (next: Partial<ProductFilterValue>) => void;
  resultCount: number;
  totalCount: number;
  className?: string;
};

export function ProductFilters({
  value,
  decorations,
  colours,
  onChange,
  resultCount,
  totalCount,
  className = "",
}: Props) {
  const active = Boolean(value.decoration) || Boolean(value.colour) || value.impact || value.moq > 0;

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex flex-wrap items-end gap-5">
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

        <label className="flex min-w-[150px] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Colour
          <span className="relative flex items-center">
            {value.colour ? (
              <span
                className="pointer-events-none absolute left-4 size-3 rounded-full border border-border"
                style={{ backgroundColor: colourSwatchCss(value.colour) }}
                aria-hidden="true"
              />
            ) : null}
            <select
              value={value.colour}
              onChange={(e) => onChange({ colour: e.target.value })}
              className={`w-full rounded-full border border-border bg-background py-2 pr-4 text-sm font-medium normal-case tracking-normal text-foreground ${
                value.colour ? "pl-9" : "px-4"
              }`}
            >
              <option value="">Any colour</option>
              {colours.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </span>
        </label>

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

        {active ? (
          <button
            type="button"
            onClick={() => onChange({ decoration: "", colour: "", impact: false, moq: 0 })}
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
