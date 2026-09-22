/**
 * Reads the supplier cost tables that ship with each catalogue item.
 *
 * Supplier copy is stored as one long text block on `catalog_products.carton_details`,
 * e.g. "... Unbranded 25 50 100 250 500 1,000 $6.29 $6.17 ... Additional Costs Per Unit Qty
 * Per Order Qty Pad Print Per Colour 40mm x 40mm $0.50 $40.00 ... Shipping and Handling
 * Per domestic address $15.00 ...". Everything here is pure text parsing — no network, no db.
 */

export type PriceBreak = { qty: number; unitCents: number };

export type DecorationCost = {
  method: string;
  unitCents: number;
  setupCents: number;
};

export type SupplierPricing = {
  breaks: PriceBreak[];
  decorations: DecorationCost[];
  freightCents: number | null;
};

const DEFAULT_FREIGHT_CENTS = 1500;

function toCents(value: string): number {
  const numeric = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

function toQty(value: string): number {
  const numeric = Number.parseInt(value.replace(/,/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The first "Unbranded <quantities...> <prices...>" run is the cost-per-unit ladder. */
function parseBreaks(text: string): PriceBreak[] {
  const match = /Unbranded((?:\s+[\d,]+)+)((?:\s+\$[\d.,]+)+)/.exec(text);
  if (!match) return [];

  const quantities = (match[1] ?? "").trim().split(/\s+/).map(toQty).filter((qty) => qty > 0);
  const prices = (match[2] ?? "")
    .trim()
    .split(/\s+/)
    .map((price) => toCents(price.replace("$", "")))
    .filter((cents) => cents > 0);

  const pairs = Math.min(quantities.length, prices.length);
  const breaks: PriceBreak[] = [];
  for (let i = 0; i < pairs; i += 1) {
    breaks.push({ qty: quantities[i] as number, unitCents: prices[i] as number });
  }
  return breaks.sort((a, b) => a.qty - b.qty);
}

/**
 * Decoration costs are listed as "<method> [Per Colour] [size] $<per unit> $<per order setup>".
 * We only look for the methods the product actually offers, which keeps the match tight.
 */
function parseDecorations(text: string, methods: string[]): DecorationCost[] {
  const region = text.slice(text.indexOf("Additional Costs"));
  const scope = region || text;
  const found: DecorationCost[] = [];

  for (const method of methods) {
    const clean = method.trim();
    if (!clean) continue;
    const pattern = new RegExp(
      `${escapeRegExp(clean)}[^$]{0,80}?\\$([\\d.,]+)\\s*\\$([\\d.,]+)`,
      "i",
    );
    const match = pattern.exec(scope);
    if (!match) continue;
    found.push({
      method: clean,
      unitCents: toCents(match[1] ?? "0"),
      setupCents: toCents(match[2] ?? "0"),
    });
  }

  return found;
}

function parseFreight(text: string): number | null {
  const match = /Shipping and Handling[^$]{0,60}\$([\d.,]+)/i.exec(text);
  if (!match) return null;
  const cents = toCents(match[1] ?? "0");
  return cents > 0 ? cents : null;
}

export function parseSupplierPricing(
  cartonDetails: string | null | undefined,
  methods: string[] = [],
): SupplierPricing {
  const text = (cartonDetails ?? "").replace(/\s+/g, " ");
  if (!text) return { breaks: [], decorations: [], freightCents: null };
  return {
    breaks: parseBreaks(text),
    decorations: parseDecorations(text, methods),
    freightCents: parseFreight(text),
  };
}

export { DEFAULT_FREIGHT_CENTS };
