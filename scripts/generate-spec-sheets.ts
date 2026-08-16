/**
 * Generates a one-page decoration spec sheet PDF for every method in the
 * catalog, written to public/spec-sheets/<slug>.pdf.
 *
 * Run with the dev server up (it serves the decoration imagery):
 *   bun run scripts/generate-spec-sheets.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { decorations } from "../src/lib/catalog";
import { decorationImages } from "../src/lib/decoration-images";

const ORIGIN = process.env["SPEC_SHEET_ORIGIN"] ?? "http://localhost:8080";
const OUT_DIR = "public/spec-sheets";

const HEX: Record<string, string> = {
  red: "#E60B1D",
  orange: "#F3680F",
  amber: "#F6B900",
  lime: "#9CDC17",
  green: "#33B544",
  teal: "#0FB89A",
  cyan: "#00B9DB",
  blue: "#0077EC",
  indigo: "#2046B4",
  violet: "#8151DB",
  magenta: "#D33CCC",
  pink: "#F780BC",
  chalk: "#CFD1D4",
  onyx: "#222428",
  sand: "#C7A475",
};

const CATEGORY_LABELS: Record<string, string> = {
  drinkware: "Drinkware",
  promotional: "Promotional Items",
  headwear: "Headwear",
  "business-items": "Business Items",
  "outdoor-leisure": "Outdoor & Leisure",
  "gift-packs": "Gift Packs",
  bags: "Bags & Totes",
  apparel: "Apparel",
  packaging: "Packaging",
  "personal-products": "Personal Products",
  tech: "Tech & Power",
};

const PAGE = { w: 595.28, h: 841.89 };
const M = 46;
const INK = rgb(0.09, 0.1, 0.11);
const MUTED = rgb(0.42, 0.44, 0.47);
const LINE = rgb(0.85, 0.86, 0.88);

function hex(value: string) {
  const h = HEX[value] ?? HEX["red"]!;
  return rgb(
    parseInt(h.slice(1, 3), 16) / 255,
    parseInt(h.slice(3, 5), 16) / 255,
    parseInt(h.slice(5, 7), 16) / 255,
  );
}

/** Replace characters the standard PDF fonts cannot encode. */
function ascii(text: string) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type Ctx = { page: PDFPage; regular: PDFFont; bold: PDFFont };

function paragraph(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  width: number,
  size = 9.5,
  colour = INK,
) {
  const lines = wrap(text, ctx.regular, size, width);
  const lh = size * 1.38;
  lines.forEach((line, i) => {
    ctx.page.drawText(line, { x, y: y - i * lh, size, font: ctx.regular, color: colour });
  });
  return lines.length * lh;
}

function label(ctx: Ctx, text: string, x: number, y: number) {
  ctx.page.drawText(ascii(text).toUpperCase(), {
    x,
    y,
    size: 7.5,
    font: ctx.bold,
    color: MUTED,
    characterSpacing: 1.1,
  });
}

async function fetchImage(url: string) {
  try {
    const res = await fetch(url.startsWith("http") ? url : `${ORIGIN}${url}`);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildSheet(method: (typeof decorations)[number]) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE.w, PAGE.h]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { page, regular, bold };
  const accent = hex(method.colour);
  const contentW = PAGE.w - M * 2;

  doc.setTitle(`${ascii(method.name)} — Decoration Spec Sheet | Brand Bento`);
  doc.setAuthor("Brand Bento");
  doc.setSubject("Decoration method specification");

  // Spectrum bar + header
  page.drawRectangle({ x: 0, y: PAGE.h - 10, width: PAGE.w, height: 10, color: accent });
  page.drawText("BRAND BENTO", {
    x: M,
    y: PAGE.h - 42,
    size: 11,
    font: bold,
    color: INK,
    characterSpacing: 2,
  });
  page.drawText("DECORATION SPEC SHEET", {
    x: M,
    y: PAGE.h - 58,
    size: 7.5,
    font: bold,
    color: MUTED,
    characterSpacing: 1.6,
  });

  let y = PAGE.h - 96;
  page.drawText(ascii(method.name), { x: M, y, size: 26, font: bold, color: accent });
  y -= 26;

  y -= paragraph(ctx, method.what, M, y, contentW, 10, INK) + 12;

  // Hero image
  const asset = decorationImages[method.slug];
  if (asset?.url) {
    const bytes = await fetchImage(asset.url);
    if (bytes) {
      try {
        const img = asset.url.endsWith(".png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const panelH = 200;
        const pad = 12;
        page.drawRectangle({
          x: M,
          y: y - panelH,
          width: contentW,
          height: panelH,
          color: rgb(0.965, 0.96, 0.95),
        });
        const scale = Math.min(
          (contentW - pad * 2) / img.width,
          (panelH - pad * 2) / img.height,
        );
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, {
          x: M + (contentW - w) / 2,
          y: y - panelH + (panelH - h) / 2,
          width: w,
          height: h,
        });
        y -= panelH + 20;
      } catch {
        /* unsupported image format — skip */
      }
    }
  }

  // Spec grid
  const colW = (contentW - 22) / 2;
  const specs: Array<[string, string]> = [
    ["Best for", method.bestFor],
    ["Colours", method.colourLimit],
    ["Lead time", method.leadTime],
    ["Artwork needed", method.artwork],
  ];
  for (let i = 0; i < specs.length; i += 2) {
    let rowHeight = 0;
    for (let c = 0; c < 2; c++) {
      const spec = specs[i + c];
      if (!spec) continue;
      const x = M + c * (colW + 22);
      label(ctx, spec[0], x, y);
      rowHeight = Math.max(rowHeight, paragraph(ctx, spec[1], x, y - 14, colW) + 14);
    }
    y -= rowHeight + 14;
  }

  // Suited products
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: PAGE.w - M, y: y + 6 }, color: LINE });
  y -= 10;
  label(ctx, "Available for", M, y);
  y -= 14;
  y -=
    paragraph(
      ctx,
      method.categories.map((s) => CATEGORY_LABELS[s] ?? s).join("   /   "),
      M,
      y,
      contentW,
    ) + 16;

  // Advantages / limitations
  const bulletCols: Array<[string, string[]]> = [];
  if (method.advantages?.length) bulletCols.push(["Advantages", method.advantages]);
  if (method.limitations?.length) bulletCols.push(["Limitations", method.limitations]);
  if (bulletCols.length) {
    const startY = y;
    let lowest = y;
    bulletCols.forEach(([heading, items], c) => {
      const x = M + c * (colW + 22);
      let cy = startY;
      label(ctx, heading, x, cy);
      cy -= 15;
      for (const item of items) {
        page.drawCircle({ x: x + 2.5, y: cy + 3, size: 1.6, color: accent });
        cy -= paragraph(ctx, item, x + 10, cy, colW - 10, 9) + 4;
      }
      lowest = Math.min(lowest, cy);
    });
    y = lowest - 6;
  }

  // Footer
  page.drawLine({ start: { x: M, y: M + 26 }, end: { x: PAGE.w - M, y: M + 26 }, color: LINE });
  page.drawText("Upload your artwork and request a quote at brandbento.com/quote", {
    x: M,
    y: M + 12,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  page.drawRectangle({ x: 0, y: 0, width: PAGE.w, height: 6, color: accent });

  return doc.save();
}

await mkdir(OUT_DIR, { recursive: true });
for (const method of decorations) {
  const bytes = await buildSheet(method);
  await writeFile(`${OUT_DIR}/${method.slug}.pdf`, bytes);
  console.log(`wrote ${OUT_DIR}/${method.slug}.pdf (${(bytes.length / 1024).toFixed(0)}kb)`);
}
