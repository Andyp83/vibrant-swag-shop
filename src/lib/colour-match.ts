/**
 * Strict colour → photo matching. Loose substring matching picked the wrong
 * shot (e.g. "Green" matched a "Bright Green" photo, "Yellow" fell through to
 * an unrelated default), so matching is exact first, then by shade family.
 */

/** Strip supplier noise like "Pants: White. Sizes 6 8…" down to "white". */
export function cleanColourName(raw: string | null | undefined): string {
  let value = (raw ?? "").trim();
  const colon = value.lastIndexOf(":");
  if (colon >= 0) value = value.slice(colon + 1);
  value = value.split(/\.\s|\.$/)[0] ?? value;
  return value.replace(/\s+/g, " ").trim();
}

function norm(raw: string | null | undefined): string {
  return cleanColourName(raw).toLowerCase().replace(/\bgray\b/g, "grey");
}

// Order matters: more specific families first.
const FAMILIES: [string, RegExp][] = [
  ["navy", /\bnavy\b/],
  ["teal", /\b(teal|turquoise|aqua)\b/],
  ["light blue", /\b(light|sky|pale|baby) blue\b|\bsky\b/],
  ["blue", /\bblue\b|\b(royal|cobalt)\b/],
  ["bright green", /\b(bright|lime|neon) green\b|\blime\b/],
  ["green", /\bgreen\b|\b(olive|forest|bottle|khaki)\b/],
  ["yellow", /\b(yellow|lemon|mustard)\b/],
  ["orange", /\borange\b/],
  ["pink", /\b(pink|magenta|fuchsia)\b/],
  ["red", /\b(red|maroon|burgundy|wine)\b/],
  ["purple", /\b(purple|violet|lilac|lavender)\b/],
  ["gold", /\bgold\b/],
  ["silver", /\b(silver|chrome)\b/],
  ["grey", /\b(grey|charcoal|gunmetal|slate)\b/],
  ["brown", /\b(brown|chocolate|coffee)\b/],
  ["natural", /\b(natural|beige|cream|ecru|sand|stone|tan|kraft|bamboo|wood)\b/],
  ["clear", /\b(clear|transparent|frosted)\b/],
  ["black", /\bblack\b/],
  ["white", /\bwhite\b/],
];

/** Every shade family named in a colour (two for "Black/White"). */
function families(raw: string | null | undefined): string[] {
  const value = norm(raw);
  const found: string[] = [];
  let rest = value;
  for (const [name, re] of FAMILIES) {
    if (re.test(rest)) {
      found.push(name);
      rest = rest.replace(re, " ");
    }
  }
  return found;
}

/**
 * Best photo for a colour, or null when none is a confident match. Exact name
 * beats same-shade-family; a photo whose label names a different family is
 * never returned.
 */
export function matchColourImage<T>(
  images: T[],
  colour: string,
  labelOf: (image: T) => string | null | undefined,
): T | null {
  const wanted = norm(colour);
  if (!wanted) return null;
  const labelled = images.filter((img) => norm(labelOf(img)));
  const exact = labelled.find((img) => norm(labelOf(img)) === wanted);
  if (exact) return exact;
  const want = families(colour);
  if (!want.length) return null;
  const key = want.join("+");
  return labelled.find((img) => families(labelOf(img)).join("+") === key) ?? null;
}
