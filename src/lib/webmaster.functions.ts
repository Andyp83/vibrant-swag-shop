import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Webmaster removal of catalogue items and taxonomy, straight from the live site.
 *
 * Two outcomes, both password-confirmed:
 *  - "hide": the entry stays in the back office but leaves the public site, so
 *    nobody can browse or quote on it. Products move to publish_status
 *    'archived'; categories and sub-ranges get is_hidden = true.
 *  - "erase": the row is deleted for good. Categories and sub-ranges are only
 *    erased when nothing still references them.
 */
export const removalSchema = z.object({
  kind: z.enum(["product", "category", "subcategory"]),
  id: z.string().uuid(),
  mode: z.enum(["hide", "erase"]),
  password: z.string().min(1).max(200),
});

export type RemovalInput = z.infer<typeof removalSchema>;

type AuthContext = {
  userId: string;
  claims?: { email?: string };
};


/** Re-checks the signed-in admin's own password before a destructive action. */
async function verifyPassword(email: string, password: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error("That password didn't match. Nothing was changed.");
}

/** The single account allowed to remove catalogue items from the live site. */
const WEBMASTER_EMAIL = "andy@seeseebloom.com.au";

/** Throws unless the caller is an admin AND the webmaster account. */
async function assertWebmaster(context: unknown): Promise<string> {
  const ctx = context as unknown as AuthContext;
  const { assertAdmin } = await import("./backoffice/guard");
  await assertAdmin(context);
  const email = (ctx.claims?.email ?? "").trim().toLowerCase();
  if (email !== WEBMASTER_EMAIL) throw new Error("Forbidden: webmaster access required");
  return email;
}

/** True only for the signed-in webmaster account (drives the live-site controls). */
export const checkIsWebmaster = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertWebmaster(context);
      return { isWebmaster: true as const };
    } catch {
      return { isWebmaster: false as const };
    }
  });

export const removeCatalogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => removalSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const email = await assertWebmaster(context);
    await verifyPassword(email, data.password);


    const supabase = context.supabase;
    const table =
      data.kind === "product"
        ? ("catalog_products" as const)
        : data.kind === "category"
          ? ("catalog_categories" as const)
          : ("catalog_subcategories" as const);

    const { data: existing, error: readError } = await supabase
      .from(table)
      .select("id, name")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!existing) throw new Error("That item no longer exists.");

    if (data.mode === "hide") {
      const patch =
        data.kind === "product" ? { publish_status: "archived" } : { is_hidden: true };
      const { error } = await supabase
        .from(table)
        // Column sets differ per table; the patch is narrowed by kind above.
        .update(patch as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      if (data.kind === "category") {
        const [{ count: productCount }, { count: subCount }] = await Promise.all([
          supabase
            .from("catalog_products")
            .select("id", { count: "exact", head: true })
            .eq("category_id", data.id),
          supabase
            .from("catalog_subcategories")
            .select("id", { count: "exact", head: true })
            .eq("category_id", data.id),
        ]);
        if ((productCount ?? 0) > 0 || (subCount ?? 0) > 0) {
          throw new Error(
            "This category still holds products or sub-ranges. Remove those first, or hide the category instead.",
          );
        }
      }
      if (data.kind === "subcategory") {
        const { count } = await supabase
          .from("catalog_products")
          .select("id", { count: "exact", head: true })
          .eq("subcategory_id", data.id);
        if ((count ?? 0) > 0) {
          throw new Error(
            "This sub-range still holds products. Remove those first, or hide the sub-range instead.",
          );
        }
      }
      if (data.kind === "product") {
        await supabase.from("catalog_product_images").delete().eq("product_id", data.id);
        await supabase.from("catalog_product_colours").delete().eq("product_id", data.id);
      }
      const { error } = await supabase.from(table).delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    const { recordAuditEvent } = await import("./backoffice/audit.server");
    await recordAuditEvent({
      action: data.mode === "hide" ? "catalog_entry_hidden" : "catalog_entry_erased",
      entityType: data.kind,
      entityId: data.id,
      entityLabel: (existing as { name?: string }).name ?? null,
      actorUserId: ctx.userId,
      actorEmail: email,
      details: { mode: data.mode, source: "live-site webmaster controls" },
    });

    return { ok: true as const, mode: data.mode };
  });

/** Puts a hidden product, category or sub-range back on the public site. */
export const restoreCatalogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ kind: z.enum(["product", "category", "subcategory"]), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertWebmaster(context);


    if (data.kind === "product") {
      const { error } = await context.supabase
        .from("catalog_products")
        .update({ publish_status: "published" })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const table = data.kind === "category" ? "catalog_categories" : "catalog_subcategories";
      const { error } = await context.supabase
        .from(table)
        .update({ is_hidden: false })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
