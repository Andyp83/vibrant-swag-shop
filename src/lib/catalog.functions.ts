import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CmsColourImage = { label: string; url: string };

export type CmsProduct = {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  slug: string;
  plu: string | null;
  name: string;
  blurb: string;
  description: string;
  features: string;
  service: string;
  specifications: string;
  colours: string;
  dimensions: string;
  materials: string;
  material_group: string;
  branding_options: string;
  packaging: string;
  carton_details: string;
  source_url: string | null;
  moq: string;
  methods: string[];
  image_url: string | null;
  colour_images: CmsColourImage[];
  variant_group: string | null;
  variant_label: string | null;
  sort_order: number;
  images: CmsProductImage[];
  colour_options: CmsProductColour[];
};

export type CmsProductImage = {
  id: string;
  product_id: string;
  image_code: string;
  image_url: string;
  source_filename: string;
  colour_label: string | null;
  shot_type: string;
  sort_order: number;
};

export type CmsProductColour = {
  id: string;
  product_id: string;
  colour_code: string;
  colour_name: string;
  sort_order: number;
};

type CmsProductRow = Omit<CmsProduct, "images" | "colour_options">;
type CmsProductRaw = Omit<CmsProductRow, "colour_images"> & { colour_images: unknown };

export type CmsSubcategory = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
};

export type CmsCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  colour: string;
  image_url: string;
  hero_image_url: string | null;
  sort_order: number;
  products: CmsProduct[];
  subcategories: CmsSubcategory[];
};

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(1, "Name is required"),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(1000).default(""),
  colour: z.string().trim().min(1),
  image_url: z.string().trim().max(2000).default(""),
  hero_image_url: z.string().trim().max(2000).nullable().default(null),
  sort_order: z.number().int().min(0).max(9999),
});

const subcategorySchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().max(1000).default(""),
  image_url: z.string().trim().max(2000).nullable().default(null),
  sort_order: z.number().int().min(0).max(9999),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().nullable().default(null),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes only")
    .default(""),
  plu: z.string().trim().max(40).nullable().default(null),
  name: z.string().trim().min(1, "Name is required"),
  blurb: z.string().trim().max(600).default(""),
  description: z.string().trim().max(4000).default(""),
  features: z.string().trim().max(4000).default(""),
  service: z.string().trim().max(120).default(""),
  specifications: z.string().trim().max(8000).default(""),
  colours: z.string().trim().max(200).default(""),
  dimensions: z.string().trim().max(1000).default(""),
  materials: z.string().trim().max(2000).default(""),
  material_group: z.string().trim().max(120).default("General"),
  branding_options: z.string().trim().max(4000).default(""),
  packaging: z.string().trim().max(2000).default(""),
  carton_details: z.string().trim().max(2000).default(""),
  source_url: z.string().trim().max(2000).nullable().default(null),
  moq: z.string().trim().max(80).default(""),
  methods: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  image_url: z.string().trim().max(2000).nullable().default(null),
  colour_images: z
    .array(
      z.object({
        label: z.string().trim().max(120).default(""),
        url: z.string().trim().min(1).max(2000),
      }),
    )
    .max(40)
    .default([]),
  sort_order: z.number().int().min(0).max(9999),
});

const idSchema = z.object({ id: z.string().uuid() });


async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const { assertAdmin: guard } = await import("./backoffice/guard");
  await guard(context);
}

type PagedResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function fetchAllRows<T>(
  label: string,
  queryPage: (from: number, to: number) => PromiseLike<PagedResult<T>>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryPage(from, from + pageSize - 1);
    if (error) throw new Error(`${label}: ${error.message}`);

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

function groupByProductId<T extends { product_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const group = grouped.get(row.product_id);
    if (group) {
      group.push(row);
    } else {
      grouped.set(row.product_id, [row]);
    }
  }
  return grouped;
}

/** Public: the whole catalogue, for the marketing site. */
export const listCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CmsCategory[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();

    const [categoriesResult, productsData, subcategoriesResult, images, colours] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("id, slug, name, tagline, description, colour, image_url, hero_image_url, sort_order")
        .order("sort_order", { ascending: true }),
      fetchAllRows<CmsProductRaw>("catalog_products", (from, to) =>
        supabase
          .from("catalog_products")
          .select(
            "id, category_id, subcategory_id, slug, plu, name, blurb, description, features, service, specifications, colours, dimensions, materials, material_group, branding_options, packaging, carton_details, source_url, moq, methods, image_url, colour_images, variant_group, variant_label, sort_order",
          )
          .order("sort_order", { ascending: true })
          .range(from, to),
      ),
      supabase
        .from("catalog_subcategories")
        .select("id, category_id, slug, name, description, image_url, sort_order")
        .order("sort_order", { ascending: true }),
      fetchAllRows<CmsProductImage>("catalog_product_images", (from, to) =>
        supabase
          .from("catalog_product_images")
          .select("id, product_id, image_code, image_url, source_filename, colour_label, shot_type, sort_order")
          .order("product_id", { ascending: true })
          .order("sort_order", { ascending: true })
          .range(from, to),
      ),
      fetchAllRows<CmsProductColour>("catalog_product_colours", (from, to) =>
        supabase
          .from("catalog_product_colours")
          .select("id, product_id, colour_code, colour_name, sort_order")
          .order("product_id", { ascending: true })
          .order("sort_order", { ascending: true })
          .range(from, to),
      ),
    ]);


    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (subcategoriesResult.error) throw new Error(subcategoriesResult.error.message);

    const imagesByProduct = groupByProductId(images);
    const coloursByProduct = groupByProductId(colours);
    const products = productsData.map((product) => ({
      ...product,
      colour_images: (Array.isArray(product.colour_images) ? product.colour_images : []) as CmsColourImage[],
      images: imagesByProduct.get(product.id) ?? [],
      colour_options: coloursByProduct.get(product.id) ?? [],
    }));

    const subcategories = subcategoriesResult.data ?? [];

    return (categoriesResult.data ?? []).map((category) => ({
      ...category,
      products: products.filter((p) => p.category_id === category.id),
      subcategories: subcategories.filter((s) => s.category_id === category.id),
    }));
  },

);

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdminContext } = await import("./backoffice/guard");
    return { isAdmin: await isAdminContext(context), userId: context.userId };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categorySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;

    if (id) {
      const { error } = await context.supabase
        .from("catalog_categories")
        .update(values)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: inserted, error } = await context.supabase
      .from("catalog_categories")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("catalog_categories")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;

    if (id) {
      const { error } = await context.supabase.from("catalog_products").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: inserted, error } = await context.supabase
      .from("catalog_products")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("catalog_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSubcategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subcategorySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;

    if (id) {
      const { error } = await context.supabase
        .from("catalog_subcategories")
        .update(values)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: inserted, error } = await context.supabase
      .from("catalog_subcategories")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteSubcategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("catalog_subcategories")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
