export type BrandingOption = { method: string; size: string };
export type ProductChoice = { label: string; options: string[] };

const split = (value: string) =>
  (value || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

/** "Pad Print: 45mm circle | 50mm x 25mm | Screen Print: ..." → one option per method with its sizes. */
export function parseBrandingOptions(text: string, methods: string[]): BrandingOption[] {
  const out: BrandingOption[] = [];
  for (const part of split(text)) {
    const idx = part.indexOf(":");
    const head = idx > 0 ? part.slice(0, idx).trim() : "";
    const isMethod =
      head.length > 0 &&
      head.length <= 40 &&
      (methods.some((m) => m.toLowerCase() === head.toLowerCase()) || /^[A-Z][\w &-]+$/.test(head));
    if (isMethod) {
      out.push({ method: head, size: part.slice(idx + 1).trim() });
    } else if (out.length > 0) {
      const last = out[out.length - 1]!;
      last.size = last.size ? `${last.size} · ${part}` : part;
    }
  }
  const seen = new Set(out.map((o) => o.method.toLowerCase()));
  for (const m of methods.filter((x) => !/\d\s*mm|^\d/i.test(x))) if (!seen.has(m.toLowerCase())) out.push({ method: m, size: "" });
  return out;
}

const PACKAGING_METHOD = /packaging|gift box/i;
const DIGITAL_METHOD = /digital/i;
/** A size that is only dimensions, e.g. "100mm x 50mm" or "210 x 140". */
const DIMENSIONS_ONLY = /^\d[\d\s.,x×\-]*\s*(mm|cm)?\s*(x|×)?\s*[\d\s.,x×\-]*\s*(mm|cm)?$/i;

/** Packaging/gift-box methods, and digital prints listed only with dimensions, belong under optional extras, not branding. */
export function splitBrandingOptions(options: BrandingOption[]): { branding: BrandingOption[]; extras: string[] } {
  const branding: BrandingOption[] = [];
  const extras: string[] = [];
  for (const o of options) {
    const isExtra = PACKAGING_METHOD.test(o.method) || (DIGITAL_METHOD.test(o.method) && !!o.size && DIMENSIONS_ONLY.test(o.size));
    if (isExtra) extras.push(o.size ? `${o.method} (${o.size})` : o.method);
    else branding.push(o);
  }
  return { branding, extras };
}

/** "Lid Style: Sipper lid | Carabiner lid | Flip valve lid" → a choice with 3 options. */
export function parseProductChoices(specifications: string): ProductChoice[] {
  const parts = split(specifications);
  const choices: ProductChoice[] = [];
  let current: ProductChoice | null = null;
  for (const part of parts) {
    const idx = part.indexOf(":");
    if (idx > 0) {
      current = { label: part.slice(0, idx).trim(), options: [part.slice(idx + 1).trim()] };
      choices.push(current);
    } else if (current) {
      current.options.push(part);
    }
  }
  return choices
    .filter((c) => c.options.length > 1 && !/country|colour|color/i.test(c.label))
    .map((c) => ({ ...c, options: Array.from(new Set(c.options.filter(Boolean))) }));
}

const EXTRA_PATTERNS: [RegExp, string][] = [
  [/gift box sleeve/i, "Gift box sleeve"],
  [/optional[^.|]*gift box|gift box \(optional\)|gift box[^.|]*optional/i, "Gift box"],
  [/optional[^.|]*gift bag/i, "Gift bag"],
  [/optional[^.|]*pouch/i, "Pouch"],
];

export function detectExtras(...texts: string[]): string[] {
  const text = texts.join(" | ");
  if (!/optional|additional cost/i.test(text)) return [];
  const found: string[] = [];
  for (const [re, label] of EXTRA_PATTERNS) if (re.test(text) && !found.includes(label)) found.push(label);
  return found;
}
