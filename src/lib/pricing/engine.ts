/**
 * Turns supplier cost tables into See See Bloom sell prices.
 *
 * House rules (agreed with the business):
 *  - flat 65% markup on supplier cost, decoration run-charges and setups
 *  - GST 10% on the order
 *  - $15 freight per order (supplier shipping and handling)
 *  - items with no supplier cost table come back as "price on application"
 */

import { DEFAULT_FREIGHT_CENTS, parseSupplierPricing, type SupplierPricing } from "./parse";

export const MARKUP = 0.65;
export const TAX_RATE = 10;
export const FREIGHT_CENTS = DEFAULT_FREIGHT_CENTS;

export type PricingProduct = {
  id: string;
  name: string;
  plu: string | null;
  methods: string[];
  carton_details: string | null;
  moq_min: number | null;
};

export type PricedLine = {
  productId: string | null;
  name: string;
  decoration: string;
  quantity: number;
  /** Sell price per unit, including the chosen decoration's run charge. */
  unitPriceCents: number;
  /** Once-off decoration setup, marked up. */
  setupCents: number;
  amountCents: number;
  /** False when we have no supplier cost table for this item. */
  priced: boolean;
  /** The quantity band the unit price came from. */
  tierQty: number | null;
  notes: string;
};

export type PricedQuote = {
  lines: PricedLine[];
  linesSubtotalCents: number;
  setupCents: number;
  freightCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  unpricedCount: number;
};

export function applyMarkup(costCents: number): number {
  return Math.round(costCents * (1 + MARKUP));
}

function pickBreak(pricing: SupplierPricing, quantity: number) {
  if (!pricing.breaks.length) return null;
  const eligible = pricing.breaks.filter((band) => band.qty <= quantity);
  return eligible.length ? eligible[eligible.length - 1] : pricing.breaks[0];
}

export type LineInput = {
  productId: string | null;
  name: string;
  decoration: string;
  quantity: number;
  notes?: string;
};

/** Prices one shortlist line against its product's supplier table. */
export function priceLine(input: LineInput, product: PricingProduct | null): PricedLine {
  const quantity = Math.max(1, Math.round(input.quantity || 0));
  const base: PricedLine = {
    productId: input.productId,
    name: product?.name ?? input.name,
    decoration: input.decoration,
    quantity,
    unitPriceCents: 0,
    setupCents: 0,
    amountCents: 0,
    priced: false,
    tierQty: null,
    notes: input.notes ?? "",
  };

  if (!product) return base;

  const pricing = parseSupplierPricing(product.carton_details, product.methods);
  const band = pickBreak(pricing, quantity);
  if (!band) return base;

  const wanted = input.decoration.trim().toLowerCase();
  const decoration =
    pricing.decorations.find((item) => item.method.toLowerCase() === wanted) ??
    (wanted ? null : (pricing.decorations[0] ?? null));

  const unitPriceCents = applyMarkup(band.unitCents + (decoration?.unitCents ?? 0));
  const setupCents = applyMarkup(decoration?.setupCents ?? 0);

  return {
    ...base,
    decoration: decoration?.method ?? input.decoration,
    unitPriceCents,
    setupCents,
    amountCents: unitPriceCents * quantity,
    priced: true,
    tierQty: band.qty,
  };
}

/** Prices a whole shortlist, adding GST and one freight charge for the order. */
export function priceQuote(
  inputs: LineInput[],
  products: Map<string, PricingProduct>,
): PricedQuote {
  const lines = inputs.map((input) =>
    priceLine(input, input.productId ? (products.get(input.productId) ?? null) : null),
  );

  const linesSubtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const setupCents = lines.reduce((sum, line) => sum + line.setupCents, 0);
  const anyPriced = lines.some((line) => line.priced);
  const freightCents = anyPriced ? FREIGHT_CENTS : 0;
  const subtotal = linesSubtotalCents + setupCents + freightCents;
  const taxCents = Math.round((subtotal * TAX_RATE) / 100);

  return {
    lines,
    linesSubtotalCents,
    setupCents,
    freightCents,
    taxRate: TAX_RATE,
    taxCents,
    totalCents: subtotal + taxCents,
    unpricedCount: lines.filter((line) => !line.priced).length,
  };
}
