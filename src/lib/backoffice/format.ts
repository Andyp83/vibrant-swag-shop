export function formatMoney(cents: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(
    (cents || 0) / 100,
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(date);
}

export function parseMoneyToCents(value: string | number): number {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

export function centsToInput(cents: number): string {
  return ((cents || 0) / 100).toFixed(2);
}

export type QuoteTotalsInput = {
  lineItems: { quantity: number; unit_price_cents: number }[];
  setup_cents: number;
  freight_cents: number;
  discount_cents: number;
  tax_rate: number;
};

export function computeQuoteTotals(input: QuoteTotalsInput) {
  const lines = input.lineItems.reduce(
    (sum, item) => sum + Math.round((item.quantity || 0) * (item.unit_price_cents || 0)),
    0,
  );
  const subtotal = lines + (input.setup_cents || 0) + (input.freight_cents || 0);
  const taxable = Math.max(0, subtotal - (input.discount_cents || 0));
  const tax = Math.round((taxable * (input.tax_rate || 0)) / 100);
  return {
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: taxable + tax,
  };
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "paid" || status === "void") return false;
  return new Date(dueDate).getTime() < Date.now();
}
