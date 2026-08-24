import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type DocLine = {
  description: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
};

export type QuoteDocInput = {
  kind: "Quote" | "Invoice";
  number: string;
  currency: string;
  issuedOn: string;
  dueLabel?: string;
  dueOn?: string | null;
  customer: { name: string; company?: string | null; email: string };
  lines: DocLine[];
  setup_cents?: number;
  freight_cents?: number;
  discount_cents?: number;
  tax_rate?: number;
  tax_cents?: number;
  total_cents: number;
  terms?: string;
  notes?: string;
};

function money(cents: number, currency: string) {
  return `${currency} ${((cents || 0) / 100).toFixed(2)}`;
}

/** Renders a branded quote or invoice PDF and returns it base64-encoded. */
export async function renderQuoteDocument(input: QuoteDocInput): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.11, 0.11, 0.1);
  const muted = rgb(0.48, 0.46, 0.43);

  const spectrum = [
    rgb(0.89, 0.2, 0.18),
    rgb(0.96, 0.6, 0.25),
    rgb(1, 0.93, 0.29),
    rgb(0.22, 0.76, 0.45),
    rgb(0.3, 0.75, 0.71),
    rgb(0.2, 0.56, 0.86),
    rgb(0.4, 0.45, 0.8),
    rgb(0.58, 0.38, 0.89),
    rgb(0.96, 0.43, 0.61),
  ];
  const barWidth = 595 / spectrum.length;
  spectrum.forEach((colour, index) => {
    page.drawRectangle({
      x: index * barWidth,
      y: 832,
      width: barWidth,
      height: 10,
      color: colour,
    });
  });

  let y = 790;
  page.drawText("SEE SEE BLOOM", { x: 48, y, size: 12, font: bold, color: ink });
  page.drawText(input.kind.toUpperCase(), { x: 460, y, size: 12, font: bold, color: muted });
  y -= 18;
  page.drawText("Branded merchandise for brands worth remembering.", {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });
  page.drawText(input.number, { x: 460, y, size: 10, font, color: ink });

  y -= 46;
  page.drawText("Prepared for", { x: 48, y, size: 9, font: bold, color: muted });
  page.drawText(`Issued ${input.issuedOn}`, { x: 400, y, size: 9, font: bold, color: muted });
  y -= 16;
  page.drawText(input.customer.company || input.customer.name, {
    x: 48,
    y,
    size: 13,
    font: bold,
    color: ink,
  });
  if (input.dueOn) {
    page.drawText(`${input.dueLabel ?? "Due"} ${input.dueOn}`, {
      x: 400,
      y,
      size: 10,
      font,
      color: ink,
    });
  }
  y -= 14;
  page.drawText(`${input.customer.name} · ${input.customer.email}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: muted,
  });

  y -= 34;
  page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 22, color: rgb(0.96, 0.95, 0.93) });
  page.drawText("Description", { x: 56, y, size: 9, font: bold, color: ink });
  page.drawText("Qty", { x: 350, y, size: 9, font: bold, color: ink });
  page.drawText("Unit", { x: 405, y, size: 9, font: bold, color: ink });
  page.drawText("Amount", { x: 484, y, size: 9, font: bold, color: ink });
  y -= 26;

  for (const line of input.lines) {
    const text = line.description.length > 58 ? `${line.description.slice(0, 55)}…` : line.description;
    page.drawText(text, { x: 56, y, size: 10, font, color: ink });
    page.drawText(String(line.quantity), { x: 350, y, size: 10, font, color: ink });
    page.drawText(money(line.unit_price_cents, input.currency), {
      x: 405,
      y,
      size: 10,
      font,
      color: ink,
    });
    page.drawText(money(line.amount_cents, input.currency), {
      x: 484,
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 18;
    if (y < 200) break;
  }

  y -= 12;
  const totals: [string, number][] = [];
  if (input.setup_cents) totals.push(["Setup", input.setup_cents]);
  if (input.freight_cents) totals.push(["Freight", input.freight_cents]);
  if (input.discount_cents) totals.push(["Discount", -input.discount_cents]);
  if (input.tax_cents) totals.push([`Tax (${input.tax_rate ?? 0}%)`, input.tax_cents]);
  for (const [label, amount] of totals) {
    page.drawText(label, { x: 380, y, size: 10, font, color: muted });
    page.drawText(money(amount, input.currency), { x: 484, y, size: 10, font, color: ink });
    y -= 16;
  }
  page.drawText("Total", { x: 380, y, size: 12, font: bold, color: ink });
  page.drawText(money(input.total_cents, input.currency), {
    x: 484,
    y,
    size: 12,
    font: bold,
    color: ink,
  });

  y -= 46;
  if (input.notes) {
    page.drawText("Notes", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 14;
    for (const chunk of wrap(input.notes, 96).slice(0, 6)) {
      page.drawText(chunk, { x: 48, y, size: 9, font, color: ink });
      y -= 12;
    }
    y -= 10;
  }
  if (input.terms) {
    page.drawText("Terms", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 14;
    for (const chunk of wrap(input.terms, 96).slice(0, 8)) {
      page.drawText(chunk, { x: 48, y, size: 9, font, color: ink });
      y -= 12;
    }
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes).toString("base64");
}

export type ProofCertificateInput = {
  jobNumber: string;
  jobTitle: string;
  version: number;
  status: string;
  notes?: string;
  responseNote?: string;
  signedName?: string;
  signedAt?: string | null;
  customer: { name: string; company?: string | null; email: string };
  artwork?: { bytes: Uint8Array; contentType: string } | null;
};

/** Renders a signed-proof certificate PDF (artwork + signature record), base64-encoded. */
export async function renderProofCertificate(input: ProofCertificateInput): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.11, 0.11, 0.1);
  const muted = rgb(0.48, 0.46, 0.43);

  const spectrum = [
    rgb(0.89, 0.2, 0.18),
    rgb(0.96, 0.6, 0.25),
    rgb(1, 0.93, 0.29),
    rgb(0.22, 0.76, 0.45),
    rgb(0.3, 0.75, 0.71),
    rgb(0.2, 0.56, 0.86),
    rgb(0.4, 0.45, 0.8),
    rgb(0.58, 0.38, 0.89),
    rgb(0.96, 0.43, 0.61),
  ];
  const barWidth = 595 / spectrum.length;
  spectrum.forEach((colour, index) => {
    page.drawRectangle({ x: index * barWidth, y: 832, width: barWidth, height: 10, color: colour });
  });

  let y = 790;
  page.drawText("SEE SEE BLOOM", { x: 48, y, size: 12, font: bold, color: ink });
  page.drawText("PROOF APPROVAL", { x: 440, y, size: 12, font: bold, color: muted });
  y -= 18;
  page.drawText("Branded merchandise for brands worth remembering.", {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });
  page.drawText(`${input.jobNumber} · v${input.version}`, { x: 440, y, size: 10, font, color: ink });

  y -= 40;
  page.drawText(input.jobTitle, { x: 48, y, size: 15, font: bold, color: ink });
  y -= 16;
  page.drawText(
    `${input.customer.company || input.customer.name} · ${input.customer.email}`,
    { x: 48, y, size: 10, font, color: muted },
  );

  y -= 30;
  if (input.artwork) {
    try {
      const image = input.artwork.contentType.includes("png")
        ? await pdf.embedPng(input.artwork.bytes)
        : await pdf.embedJpg(input.artwork.bytes);
      const maxWidth = 499;
      const maxHeight = 380;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, { x: 48, y: y - height, width, height });
      y -= height + 24;
    } catch {
      /* unsupported artwork format — the record below still stands on its own */
    }
  }

  page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 22, color: rgb(0.96, 0.95, 0.93) });
  page.drawText("Approval record", { x: 56, y, size: 9, font: bold, color: ink });
  y -= 30;

  const rows: [string, string][] = [
    ["Status", input.status === "approved" ? "Approved and signed" : input.status],
    ["Signed by", input.signedName || "—"],
    ["Signed at", input.signedAt ? new Date(input.signedAt).toLocaleString("en-AU") : "—"],
    ["Proof version", `v${input.version}`],
    ["Job", input.jobNumber],
  ];
  for (const [label, value] of rows) {
    page.drawText(label, { x: 48, y, size: 9, font: bold, color: muted });
    page.drawText(value, { x: 170, y, size: 10, font, color: ink });
    y -= 16;
  }

  for (const [label, text] of [
    ["Proof notes", input.notes],
    ["Customer note", input.responseNote],
  ] as [string, string | undefined][]) {
    if (!text) continue;
    y -= 12;
    page.drawText(label, { x: 48, y, size: 9, font: bold, color: muted });
    y -= 14;
    for (const chunk of wrap(text, 96).slice(0, 6)) {
      page.drawText(chunk, { x: 48, y, size: 9, font, color: ink });
      y -= 12;
    }
  }

  y -= 20;
  for (const chunk of wrap(
    "This document records the customer's typed signature approval of the artwork proof shown above. Production is based on this approved artwork.",
    100,
  )) {
    page.drawText(chunk, { x: 48, y, size: 8, font, color: muted });
    y -= 11;
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes).toString("base64");
}


function wrap(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > width) {
      lines.push(current.trim());
      current = "";
    }
    current += `${word} `;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
