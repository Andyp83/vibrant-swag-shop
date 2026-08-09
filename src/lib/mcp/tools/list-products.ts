import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "List catalogue products",
  description:
    "List merchandise products with blurb, colours, minimum order quantity (MOQ) and decoration methods. Optionally filter by category slug.",
  inputSchema: {
    category_slug: z
      .string()
      .trim()
      .optional()
      .describe("Category slug to filter by, e.g. 'drinkware'. Omit for all products."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_slug }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);

    let categoryId: string | undefined;
    if (category_slug) {
      const { data: category, error: categoryError } = await supabase
        .from("catalog_categories")
        .select("id")
        .eq("slug", category_slug)
        .maybeSingle();
      if (categoryError)
        return { content: [{ type: "text", text: categoryError.message }], isError: true };
      if (!category)
        return {
          content: [{ type: "text", text: `No category with slug '${category_slug}'.` }],
          isError: true,
        };
      categoryId = category.id as string;
    }

    let query = supabase
      .from("catalog_products")
      .select("id, category_id, name, blurb, colours, moq, methods, sort_order")
      .order("sort_order", { ascending: true });
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
