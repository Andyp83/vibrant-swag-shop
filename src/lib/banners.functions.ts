import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteBanner = {
  id: string;
  key: string;
  image_url: string;
  alt: string;
  link_to: string | null;
  cta: string | null;
  placements: string[];
  is_active: boolean;
  sort_order: number;
};

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(80)
    .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers and dashes only"),
  image_url: z.string().trim().min(1, "Image is required").max(2000),
  alt: z.string().trim().max(300).default(""),
  link_to: z.string().trim().max(500).nullable().default(null),
  cta: z.string().trim().max(120).nullable().default(null),
  placements: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  is_active: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(999).default(0),
});

const idSchema = z.object({ id: z.string().uuid() });

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const { assertAdmin: guard } = await import("./backoffice/guard");
  await guard(context);
}

const columns = "id, key, image_url, alt, link_to, cta, placements, is_active, sort_order";

/** Public: every banner in the library (the site filters by placement + active). */
export const listBanners = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteBanner[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const { data, error } = await getPublicSupabase()
      .from("site_banners")
      .select(columns)
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SiteBanner[];
  },
);

export const saveBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bannerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;

    if (id) {
      const { error } = await context.supabase.from("site_banners").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: inserted, error } = await context.supabase
      .from("site_banners")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("site_banners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
