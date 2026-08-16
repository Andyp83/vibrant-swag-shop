import { decorations } from "@/lib/catalog";

export type ArtworkSpec = {
  /** Accepted file extensions, lower case, with leading dot. */
  fileTypes: string[];
  /** Short human sentence about preferred formats. */
  formatGuidance: string;
  /** Resolution guidance shown to the client. */
  dpi: string;
  /** Minimum pixel edge we accept for raster uploads (0 = raster not accepted). */
  minRasterEdge: number;
  /** Bleed requirement copy. */
  bleed: string;
  /** Whether the client must confirm bleed/resolution before submitting. */
  confirmRequired: boolean;
  notes: string[];
};

const VECTOR = [".ai", ".eps", ".pdf", ".svg", ".cdr"];
const RASTER = [".png", ".tif", ".tiff", ".jpg", ".jpeg", ".psd"];

function vectorOnly(overrides: Partial<ArtworkSpec> = {}): ArtworkSpec {
  return {
    fileTypes: [...VECTOR, ".zip"],
    formatGuidance: "Vector only — AI, EPS, PDF, SVG or CDR. Raster files must be redrawn first.",
    dpi: "Resolution is irrelevant for vector, but any placed images inside the file must be 300 DPI at actual size.",
    minRasterEdge: 0,
    bleed: "No bleed needed — supply the logo on a transparent artboard with 2mm clear space around it.",
    confirmRequired: true,
    notes: [
      "Convert all fonts to outlines/objects.",
      "Set line weights to 0.5pt minimum so fine detail survives production.",
    ],
    ...overrides,
  };
}

function fullColour(overrides: Partial<ArtworkSpec> = {}): ArtworkSpec {
  return {
    fileTypes: [...VECTOR, ...RASTER, ".zip"],
    formatGuidance: "Vector preferred (AI, EPS, PDF, SVG); high-resolution PNG, TIFF or JPG accepted.",
    dpi: "300 DPI at actual print size (600 DPI for artwork under 30mm wide).",
    minRasterEdge: 1000,
    bleed: "No bleed needed — keep critical detail 3mm inside the print area.",
    confirmRequired: true,
    notes: ["Supply CMYK or Pantone references.", "Flatten transparency effects before sending."],
    ...overrides,
  };
}

const BLEED_3MM =
  "3mm bleed required on every edge, with a 3mm safety margin for text and logos inside the trim.";

const specs: Record<string, ArtworkSpec> = {
  // Stitch
  embroidery: vectorOnly({
    formatGuidance: "Vector for digitising (AI, EPS, PDF, SVG). We create the stitch file from it.",
    dpi: "Not applicable — artwork is digitised into stitches.",
    bleed: "No bleed. Minimum letter height 5mm; avoid detail finer than 1mm.",
    notes: [
      "Small text and thin lines will be simplified to stitch out cleanly.",
      "Give us thread colour references (Pantone or Madeira) if you have them.",
    ],
  }),
  "faux-embroidery": vectorOnly({
    bleed: "No bleed. Minimum stroke 0.8mm so the raised texture reads correctly.",
  }),

  // Engrave / emboss / stamp
  "laser-engraving": vectorOnly({
    dpi: "Vector paths only. Photographic fills cannot be engraved.",
    bleed: "No bleed. Keep artwork 3mm inside the engraving window.",
    notes: ["One tonal colour only — the engraved substrate colour.", "Outline fonts before sending."],
  }),
  "imitation-etch": vectorOnly(),
  debossing: vectorOnly({
    bleed: "No bleed. Allow 4mm clearance from seams, stitching and edges.",
    notes: ["Single depth only — no tonal gradients.", "Minimum stroke 0.75mm."],
  }),
  "thermo-debossing": vectorOnly({
    bleed: "No bleed. Allow 4mm clearance from seams and edges.",
  }),
  "foil-printing": vectorOnly({
    bleed: "No bleed. Keep 3mm clear of trim edges so the foil registers.",
    notes: ["Solid shapes only — foil cannot hold gradients or halftones.", "Minimum stroke 0.5pt."],
  }),
  "hot-stamping": vectorOnly({
    bleed: "No bleed. Keep 3mm clear of trim edges.",
  }),

  // Screen / pad
  "screen-print": vectorOnly({
    formatGuidance: "Vector with each spot colour on its own layer (AI, EPS, PDF, SVG).",
    bleed: "No bleed — separations are built to the print area with 3mm safety margin.",
    notes: ["Name Pantone references per colour.", "Minimum line weight 0.5mm."],
  }),
  "rotary-screen-print": vectorOnly({
    bleed: "Wrap-around print: extend artwork 3mm past the seam so the join is invisible.",
    confirmRequired: true,
  }),
  "pad-print": vectorOnly({
    bleed: "No bleed. Minimum text size 5pt; keep 2mm clear space.",
  }),
  "puff-print": vectorOnly({
    bleed: "No bleed. Minimum stroke 1.5mm — the ink expands during curing.",
  }),
  "resin-coated-finish": vectorOnly({
    bleed: "No bleed. Keep artwork 2mm inside the resin dome edge.",
  }),
  "silicone-digital-print": vectorOnly({
    fileTypes: [...VECTOR, ...RASTER, ".zip"],
    formatGuidance: "Vector preferred; high-resolution raster accepted for tonal areas.",
    dpi: "300 DPI at actual print size.",
    minRasterEdge: 1000,
    bleed: "No bleed. Keep detail 2mm inside the print area.",
  }),

  // Full colour digital
  "colourflex-transfer": fullColour({
    notes: [
      "Metallic and fluorescent colours cannot be reproduced.",
      "Minimum detail 1mm; outline all fonts.",
    ],
  }),
  "digiflex-transfer": fullColour({
    notes: ["Minimum detail 1mm.", "Outline all fonts."],
  }),
  "digital-print": fullColour(),
  "direct-digital": fullColour(),
  "digital-label": fullColour({ bleed: BLEED_3MM }),
  "digital-packaging-print": fullColour({
    bleed: BLEED_3MM,
    notes: ["Supply artwork on our die-line template.", "Keep barcodes at 100% scale, CMYK black."],
  }),
  "prism-digital-print": fullColour({
    bleed: "Wrap-around print: add 3mm bleed and extend the design past the seam.",
  }),
  "rotary-digital-print": fullColour({
    bleed: "Wrap-around print: add 3mm bleed and extend the design past the seam.",
  }),
  "sublimation-print": fullColour({
    bleed: BLEED_3MM,
    notes: [
      "Colours shift slightly on polyester — supply Pantone targets.",
      "White cannot be printed; the substrate provides white.",
    ],
  }),
};

export const defaultArtworkSpec: ArtworkSpec = {
  fileTypes: [...VECTOR, ...RASTER, ".zip"],
  formatGuidance: "Vector artwork (AI, EPS, PDF, SVG) reproduces best; high-resolution PNG or JPG is fine.",
  dpi: "300 DPI at actual print size for raster files.",
  minRasterEdge: 800,
  bleed: "Bleed depends on the method — we'll confirm once we've picked one with you.",
  confirmRequired: false,
  notes: ["Outline fonts and include Pantone references if you have them."],
};

/** Look up a spec by decoration slug or display name. */
export function getArtworkSpec(slugOrName: string | undefined | null): ArtworkSpec {
  if (!slugOrName) return defaultArtworkSpec;
  const key = slugOrName.toLowerCase();
  const match =
    decorations.find((d) => d.slug === key) ??
    decorations.find((d) => d.name.toLowerCase() === key);
  return (match && specs[match.slug]) ?? defaultArtworkSpec;
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

export function isRaster(name: string): boolean {
  return RASTER.includes(fileExtension(name));
}
