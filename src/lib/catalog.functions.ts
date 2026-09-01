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
  impact_aware?: boolean | null;
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

/** The trimmed shape returned by the full-catalogue list query. */
type CmsProductListRow = Omit<
  CmsProductRaw,
  | "description"
  | "features"
  | "specifications"
  | "dimensions"
  | "materials"
  | "branding_options"
  | "packaging"
  | "carton_details"
  | "source_url"
>;

/** Long-text fields fetched on demand for the product detail page. */
export type CmsProductDetail = {
  description: string;
  features: string;
  specifications: string;
  dimensions: string;
  materials: string;
  branding_options: string;
  packaging: string;
  carton_details: string;
  source_url: string | null;
};


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

/**
 * Keyset pagination by primary key. OFFSET-style `.range()` makes Postgres
 * re-scan and re-sort every earlier row on each page, which trips the
 * statement timeout on the larger catalogue tables. Paging with `id > cursor`
 * keeps each page an index range scan. Falls back to smaller pages when a
 * page still times out.
 */
async function fetchAllRows<T extends { id: string }>(
  label: string,
  queryPage: (cursor: string | null, limit: number) => PromiseLike<PagedResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null = null;
  let pageSize = 500;

  for (;;) {
    const { data, error } = await queryPage(cursor, pageSize);

    if (error) {
      const timedOut = /timeout|canceling statement/i.test(error.message);
      if (timedOut && pageSize > 100) {
        pageSize = Math.floor(pageSize / 2);
        continue;
      }
      throw new Error(`${label}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
    cursor = page[page.length - 1]!.id;
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

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("id, slug, name, tagline, description, colour, image_url, hero_image_url, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("catalog_subcategories")
        .select("id, category_id, slug, name, description, image_url, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    // Run the big table scans sequentially: three concurrent full-table reads
    // competed for the same connection pool and tripped the statement timeout.
    // Heavy long-text columns (features, specifications, branding_options,
    // packaging, carton_details, materials, dimensions, source_url) are NOT
    // selected here — they multiplied the payload by ~10x for a full-catalogue
    // read and are only needed on the product detail page, which fetches them
    // on demand via getProductDetail().
    const productsData = await fetchAllRows<CmsProductListRow>("catalog_products", (cursor, limit) => {
      let query = supabase
        .from("catalog_products")
        .select(
          "id, category_id, subcategory_id, slug, plu, name, blurb, service, colours, material_group, moq, methods, image_url, colour_images, variant_group, variant_label, impact_aware, sort_order",
        )
        .order("id", { ascending: true })
        .limit(limit);
      if (cursor) query = query.gt("id", cursor);
      return query;
    });

    const images = await fetchAllRows<CmsProductImage>("catalog_product_images", (cursor, limit) => {
      let query = supabase
        .from("catalog_product_images")
        .select("id, product_id, image_code, image_url, source_filename, colour_label, shot_type, sort_order")
        .order("id", { ascending: true })
        .limit(limit);
      if (cursor) query = query.gt("id", cursor);
      return query;
    });

    const colours = await fetchAllRows<CmsProductColour>("catalog_product_colours", (cursor, limit) => {
      let query = supabase
        .from("catalog_product_colours")
        .select("id, product_id, colour_code, colour_name, sort_order")
        .order("id", { ascending: true })
        .limit(limit);
      if (cursor) query = query.gt("id", cursor);
      return query;
    });



    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (subcategoriesResult.error) throw new Error(subcategoriesResult.error.message);

    const imagesByProduct = groupByProductId(images);
    const coloursByProduct = groupByProductId(colours);
    const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;
    const products: CmsProduct[] = productsData
      .map((product) => ({
        ...product,
        impact_aware: product.impact_aware ?? false,
        description: "",
        features: "",
        specifications: "",
        dimensions: "",
        materials: "",
        branding_options: "",
        packaging: "",
        carton_details: "",
        source_url: null,
        colour_images: (Array.isArray(product.colour_images) ? product.colour_images : []) as CmsColourImage[],
        images: (imagesByProduct.get(product.id) ?? []).sort(bySortOrder),
        colour_options: (coloursByProduct.get(product.id) ?? []).sort(bySortOrder),
      }))
      .sort(bySortOrder);


    const subcategories = subcategoriesResult.data ?? [];

    return (categoriesResult.data ?? []).map((category) => ({
      ...category,
      products: products.filter((p) => p.category_id === category.id),
      subcategories: subcategories.filter((s) => s.category_id === category.id),
    }));
  },

);

/** Public: categories + subcategories only (no products) — for nav and the homepage. */
export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CmsCategory[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("id, slug, name, tagline, description, colour, image_url, hero_image_url, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("catalog_subcategories")
        .select("id, category_id, slug, name, description, image_url, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (subcategoriesResult.error) throw new Error(subcategoriesResult.error.message);

    const subcategories = subcategoriesResult.data ?? [];
    return (categoriesResult.data ?? []).map((category) => ({
      ...category,
      products: [],
      subcategories: subcategories.filter((s) => s.category_id === category.id),
    }));
  },
);

/** Public: the long-text detail fields for a single product. */
export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<CmsProductDetail> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();

    const { data: row, error } = await supabase
      .from("catalog_products")
      .select(
        "description, features, specifications, dimensions, materials, branding_options, packaging, carton_details, source_url",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return {
      description: row?.description ?? "",
      features: row?.features ?? "",
      specifications: row?.specifications ?? "",
      dimensions: row?.dimensions ?? "",
      materials: row?.materials ?? "",
      branding_options: row?.branding_options ?? "",
      packaging: row?.packaging ?? "",
      carton_details: row?.carton_details ?? "",
      source_url: row?.source_url ?? null,
    };
  });



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
