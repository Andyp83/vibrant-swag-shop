import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { priceQuote, type PricedQuote, type PricingProduct } from "@/lib/pricing/engine";

const lineSchema = z.object({
  productId: z.string().uuid().nullable().default(null),
  name: z.string().trim().min(1).max(200),
  decoration: z.string().trim().max(120).default(""),
  quantity: z.coerce.number().int().min(1).max(1_000_000).default(1),
  notes: z.string().trim().max(500).default(""),
});

const priceInputSchema = z.object({
  items: z.array(lineSchema).min(1).max(30),
});

const submitSchema = priceInputSchema.extend({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  deadline: z.string().trim().max(20).default(""),
  budget: z.string().trim().max(60).default(""),
  notes: z.string().trim().max(2000).default(""),
  summary: z.string().trim().max(4000).default(""),
});

type Line = z.infer<typeof lineSchema>;

const productSearchSchema = z.object({
  query: z.string().trim().min(2).max(80),
});

export type PricingSearchProduct = {
  id: string;
  name: string;
  plu: string | null;
  categoryName: string;
  categorySlug: string;
  methods: string[];
  moq: string;
};

/** Lightweight public product search for the standalone calculator. */
export const searchPricingProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => productSearchSchema.parse(input))
  .handler(async ({ data }): Promise<PricingSearchProduct[]> => {
    const { getPublicSupabase } = await import("@/lib/supabase-public.server");
    const supabase = getPublicSupabase();
    const escaped = data.query.replace(/[\\%_]/g, (character) => `\\${character}`);

    const { data: rows, error } = await supabase
      .from("catalog_products")
      .select("id, name, plu, category_id, methods, moq")
      .ilike("name", `%${escaped}%`)
      .eq("publish_status", "published")
      .order("name", { ascending: true })
      .limit(20);
    if (error) throw new Error(error.message);

    const categoryIds = [...new Set((rows ?? []).map((row) => row.category_id))];
    if (!categoryIds.length) return [];
    const { data: categories, error: categoryError } = await supabase
      .from("catalog_categories")
      .select("id, name, slug")
      .in("id", categoryIds)
      .eq("is_hidden", false);
    if (categoryError) throw new Error(categoryError.message);

    const categoryById = new Map((categories ?? []).map((category) => [category.id, category]));
    const excluded = new Set(["print", "hampers-gifting", "gift-packs"]);

    return (rows ?? []).flatMap((row) => {
      const category = categoryById.get(row.category_id);
      if (!category || excluded.has(category.slug)) return [];
      return [{
        id: row.id,
        name: row.name,
        plu: row.plu,
        categoryName: category.name,
        categorySlug: category.slug,
        methods: Array.isArray(row.methods) ? row.methods : [],
        moq: row.moq ?? "",
      }];
    });
  });

async function loadProducts(ids: string[]) {
  const map = new Map<string, PricingProduct>();
  if (!ids.length) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("catalog_products")
    .select("id, name, plu, methods, carton_details, moq_min")
    .in("id", ids)
    .neq("publish_status", "archived");
  for (const row of (data ?? []) as PricingProduct[]) map.set(row.id, row);
  return map;
}

async function price(items: Line[]): Promise<PricedQuote> {
  const ids = items.map((item) => item.productId).filter((id): id is string => Boolean(id));
  return priceQuote(items, await loadProducts(ids));
}

/** Live estimate for a shortlist — cost per item at the customer's quantity and decoration. */
export const priceShortlist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => priceInputSchema.parse(input))
  .handler(async ({ data }): Promise<PricedQuote> => price(data.items));

export type ShortlistQuoteResult = {
  requestId: string;
  quoteNumber: string;
  pricing: PricedQuote;
};

/**
 * Prices a submitted shortlist and saves it as a draft quote against the customer
 * record, so it waits in the back office for a human to check and send.
 */
export const submitShortlistQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }): Promise<ShortlistQuoteResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pricing = await price(data.items);
    const email = data.email.toLowerCase();

    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const body = [
      `Shortlist quote request — ${data.items.length} item${data.items.length === 1 ? "" : "s"}:`,
      data.summary,
      data.notes ? `Additional information:\n${data.notes}` : null,
      pricing.unpricedCount
        ? `${pricing.unpricedCount} item(s) have no supplier cost table — price on application.`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data: request, error: requestError } = await supabaseAdmin
      .from("quote_requests")
      .insert({
        name: data.fullName,
        email,
        company: data.company || null,
        phone: data.phone || null,
        product_interest: data.items
          .map((item) => item.name)
          .join(", ")
          .slice(0, 200),
        quantity: totalQuantity > 0 ? totalQuantity : null,
        decoration: data.items.find((item) => item.decoration)?.decoration ?? null,
        required_by: data.deadline || null,
        budget: data.budget || null,
        notes: body,
        file_paths: [],
        status: "in_progress",
      })
      .select("id")
      .single();
    if (requestError || !request) throw new Error(requestError?.message ?? "Could not save request");

    // Reuse the customer record for this email, or create one.
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .ilike("email", email)
      .order("created_at", { ascending: true })
      .limit(1);

    let customerId = existing?.[0]?.id as string | undefined;
    if (!customerId) {
      const { data: created, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          name: data.fullName,
          company: data.company || null,
          email,
          phone: data.phone || null,
          notes: "Created automatically from a shortlist submission.",
        })
        .select("id")
        .single();
      if (customerError || !created) {
        throw new Error(customerError?.message ?? "Could not save customer");
      }
      customerId = created.id;
    }

    const validUntil = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert({
        customer_id: customerId,
        request_id: request.id,
        status: "draft",
        currency: "AUD",
        discount_cents: 0,
        freight_cents: pricing.freightCents,
        setup_cents: pricing.setupCents,
        tax_rate: pricing.taxRate,
        subtotal_cents: pricing.linesSubtotalCents + pricing.setupCents + pricing.freightCents,
        tax_cents: pricing.taxCents,
        total_cents: pricing.totalCents,
        valid_until: validUntil,
        terms: "Prices in AUD and include GST. Freight is charged per delivery address.",
        notes: [
          "Priced automatically from the customer's shortlist (supplier cost tables + house markup).",
          data.notes ? `Customer notes: ${data.notes}` : null,
          pricing.unpricedCount
            ? `${pricing.unpricedCount} line(s) need a manual price before sending.`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .select("id, number")
      .single();
    if (quoteError || !quote) throw new Error(quoteError?.message ?? "Could not save quote");

    const { error: lineError } = await supabaseAdmin.from("quote_line_items").insert(
      pricing.lines.map((line, index) => ({
        quote_id: quote.id,
        description: [line.name, line.notes].filter(Boolean).join(" — ").slice(0, 300),
        product: line.name.slice(0, 160),
        decoration: line.decoration.slice(0, 160),
        quantity: line.quantity,
        unit_price_cents: line.unitPriceCents,
        amount_cents: line.amountCents,
        sort_order: index,
      })),
    );
    if (lineError) throw new Error(lineError.message);

    try {
      const { sendQuoteRequestConfirmation } = await import(
        "@/lib/backoffice/quote-confirm.server"
      );
      await sendQuoteRequestConfirmation(request.id);
    } catch (error) {
      console.error("Shortlist confirmation email failed", error);
    }

    return { requestId: request.id, quoteNumber: quote.number as string, pricing };
  });
