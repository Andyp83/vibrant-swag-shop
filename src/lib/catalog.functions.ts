import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CmsProduct = {
  id: string;
  category_id: string;
  name: string;
  blurb: string;
  colours: string;
  moq: string;
  methods: string[];
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
  sort_order: z.number().int().min(0).max(999),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  blurb: z.string().trim().max(600).default(""),
  colours: z.string().trim().max(200).default(""),
  moq: z.string().trim().max(80).default(""),
  methods: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  image_url: z.string().trim().max(2000).nullable().default(null),
  sort_order: z.number().int().min(0).max(999),
});

const idSchema = z.object({ id: z.string().uuid() });

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden: admin access required");
}

/** Public: the whole catalogue, for the marketing site. */
export const listCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CmsCategory[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();

    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("id, slug, name, tagline, description, colour, image_url, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("catalog_products")
        .select("id, category_id, name, blurb, colours, moq, methods, image_url, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (productsResult.error) throw new Error(productsResult.error.message);

    const products = productsResult.data ?? [];

    return (categoriesResult.data ?? []).map((category) => ({
      ...category,
      products: products.filter((p) => p.category_id === category.id),
    }));
  },
);

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data), userId: context.userId };
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
