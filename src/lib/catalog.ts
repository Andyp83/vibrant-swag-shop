export type SpectrumColor =
  | "red"
  | "orange"
  | "amber"
  | "lime"
  | "green"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "magenta"
  | "pink";

export const swatchClass: Record<SpectrumColor, string> = {
  red: "bg-spectrum-red",
  orange: "bg-spectrum-orange",
  amber: "bg-spectrum-amber",
  lime: "bg-spectrum-lime",
  green: "bg-spectrum-green",
  teal: "bg-spectrum-teal",
  cyan: "bg-spectrum-cyan",
  blue: "bg-spectrum-blue",
  indigo: "bg-spectrum-indigo",
  violet: "bg-spectrum-violet",
  magenta: "bg-spectrum-magenta",
  pink: "bg-spectrum-pink",
};

export const textClass: Record<SpectrumColor, string> = {
  red: "text-spectrum-red",
  orange: "text-spectrum-orange",
  amber: "text-spectrum-amber",
  lime: "text-spectrum-lime",
  green: "text-spectrum-green",
  teal: "text-spectrum-teal",
  cyan: "text-spectrum-cyan",
  blue: "text-spectrum-blue",
  indigo: "text-spectrum-indigo",
  violet: "text-spectrum-violet",
  magenta: "text-spectrum-magenta",
  pink: "text-spectrum-pink",
};

export const softBgClass: Record<SpectrumColor, string> = {
  red: "bg-spectrum-red-soft",
  orange: "bg-spectrum-orange-soft",
  amber: "bg-spectrum-amber-soft",
  lime: "bg-spectrum-lime-soft",
  green: "bg-spectrum-green-soft",
  teal: "bg-spectrum-teal-soft",
  cyan: "bg-spectrum-cyan-soft",
  blue: "bg-spectrum-blue-soft",
  indigo: "bg-spectrum-indigo-soft",
  violet: "bg-spectrum-violet-soft",
  magenta: "bg-spectrum-magenta-soft",
  pink: "bg-spectrum-pink-soft",
};

export const borderAccentClass: Record<SpectrumColor, string> = {
  red: "border-spectrum-red",
  orange: "border-spectrum-orange",
  amber: "border-spectrum-amber",
  lime: "border-spectrum-lime",
  green: "border-spectrum-green",
  teal: "border-spectrum-teal",
  cyan: "border-spectrum-cyan",
  blue: "border-spectrum-blue",
  indigo: "border-spectrum-indigo",
  violet: "border-spectrum-violet",
  magenta: "border-spectrum-magenta",
  pink: "border-spectrum-pink",
};

export const onAccentTextClass: Record<SpectrumColor, string> = {
  red: "text-spectrum-red",
  orange: "text-spectrum-orange",
  amber: "text-spectrum-amber",
  lime: "text-spectrum-lime",
  green: "text-spectrum-green",
  teal: "text-spectrum-teal",
  cyan: "text-spectrum-cyan",
  blue: "text-spectrum-blue",
  indigo: "text-spectrum-indigo",
  violet: "text-spectrum-violet",
  magenta: "text-spectrum-magenta",
  pink: "text-spectrum-pink",
};

export function spectrum(colour: string): SpectrumColor {
  return colour in swatchClass ? (colour as SpectrumColor) : "red";
}

export type Decoration = {
  slug: string;
  name: string;
  colour: SpectrumColor;
  what: string;
  bestFor: string;
  colourLimit: string;
  leadTime: string;
  artwork: string;
};

export const decorations: Decoration[] = [
  {
    slug: "screen-print",
    name: "Screen Print",
    colour: "red",
    what: "Ink pushed through a fine mesh screen, one screen per colour. The workhorse for apparel and bags.",
    bestFor: "Tees, hoodies, totes, drawstring bags, large flat areas",
    colourLimit: "1–6 spot colours, matched to Pantone",
    leadTime: "8–10 working days",
    artwork: "Vector (AI, EPS, PDF) with colours separated and text converted to outlines.",
  },
  {
    slug: "embroidery",
    name: "Embroidery",
    colour: "orange",
    what: "Your logo stitched directly into the fabric with coloured thread. Premium, textured and effectively permanent.",
    bestFor: "Caps, beanies, polos, jackets, backpacks",
    colourLimit: "Up to 12 thread colours, matched to Madeira",
    leadTime: "10–12 working days (plus one-off digitising)",
    artwork: "Vector preferred. Fine detail under 2mm and thin type will not hold a stitch.",
  },
  {
    slug: "pad-print",
    name: "Pad Print",
    colour: "amber",
    what: "A silicone pad lifts ink from an etched plate and lays it onto curved or uneven surfaces.",
    bestFor: "Pens, USB drives, small tech, mugs, uneven shapes",
    colourLimit: "1–4 spot colours",
    leadTime: "7–9 working days",
    artwork: "Vector, single colour per plate, minimum line weight 0.3mm.",
  },
  {
    slug: "laser-engraving",
    name: "Laser Engraving",
    colour: "green",
    what: "A laser removes the surface coating to reveal the material underneath. No ink, nothing to wear off.",
    bestFor: "Stainless drinkware, metal pens, bamboo, cork, leather",
    colourLimit: "Single tone — the natural colour of the substrate",
    leadTime: "7–9 working days",
    artwork: "Vector or high-contrast black and white. Gradients cannot be reproduced.",
  },
  {
    slug: "digital-uv-print",
    name: "Digital UV Print",
    colour: "cyan",
    what: "Full-colour inkjet cured instantly with UV light, printed straight onto the product.",
    bestFor: "Notebooks, drinkware, chargers, boxes, photographic artwork",
    colourLimit: "Unlimited CMYK, plus white underbase on dark products",
    leadTime: "6–8 working days",
    artwork: "300dpi raster (PNG, TIFF, PDF) or vector, in CMYK.",
  },
  {
    slug: "debossing",
    name: "Debossing",
    colour: "indigo",
    what: "A heated brass die presses your mark into the material, leaving a clean recessed impression.",
    bestFor: "PU and leather notebooks, cases, tags, journals",
    colourLimit: "Blind (no colour) or foiled in gold, silver or a spot colour",
    leadTime: "10–12 working days",
    artwork: "Bold vector shapes. Very fine strokes fill in under pressure.",
  },
  {
    slug: "full-colour-wrap",
    name: "Full-Colour Wrap",
    colour: "violet",
    what: "A printed film wrapped around the whole product for edge-to-edge, seam-free coverage.",
    bestFor: "Bottles, tumblers, can coolers, desk mats, all-over artwork",
    colourLimit: "Unlimited CMYK with photographic detail",
    leadTime: "9–11 working days",
    artwork: "Supplied to our wrap template at 300dpi with 3mm bleed.",
  },
  {
    slug: "doming",
    name: "Doming",
    colour: "magenta",
    what: "A printed label finished with a clear polyurethane dome that magnifies the artwork and shrugs off scratches.",
    bestFor: "Cables, keyrings, trucker caps, chargers, badges",
    colourLimit: "Unlimited CMYK plus metallic bases",
    leadTime: "9–11 working days",
    artwork: "Vector or 300dpi raster with a defined outer cut shape.",
  },
];

export const artworkFaq = [
  {
    q: "What file format should I send?",
    a: "Vector artwork (AI, EPS or PDF) is ideal because it scales to any size without losing quality. If you only have a raster file, send the largest version you have at 300dpi — ideally a PNG with a transparent background.",
  },
  {
    q: "I only have a logo from our website. Is that enough?",
    a: "Often not. Web logos are usually 72dpi and too small to print cleanly. Send it through anyway — our studio will tell you honestly whether it will hold up, and can redraw it as vector for a one-off fee.",
  },
  {
    q: "How do you match our brand colours?",
    a: "Send your Pantone references and we match spot-colour methods to them exactly. Full-colour methods are converted to the closest CMYK build, and we can supply a pre-production sample if the colour is critical.",
  },
  {
    q: "Will I see a proof before production?",
    a: "Always. Every order gets a digital proof showing placement, size and colours, and nothing goes to production until you approve it in writing.",
  },
  {
    q: "Can you print onto dark products?",
    a: "Yes. Screen and digital methods can lay down a white underbase first so colours stay bright instead of sinking into the garment or bottle.",
  },
];
