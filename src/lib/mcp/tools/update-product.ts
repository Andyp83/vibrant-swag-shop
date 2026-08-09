import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_product",
  title: "Update a catalogue product",
  description:
    "Update an existing product's blurb, colours, minimum order quantity or decoration methods. Admin access required.",
  inputSchema: {
    id: z.string().describe("Product id from list_products."),
    blurb: z.string().trim().optional(),
    colours: z.string().trim().optional(),
    moq: z.string().trim().optional().describe("Minimum order quantity, e.g. '50 units'."),
    methods: z
      .array(z.string().trim())
      .optional()
      .describe("Decoration method tags, e.g. ['Screen print','Laser engraving']."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(patch).length === 0) throw new ToolError("Provide at least one field to update.");

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("catalog_products")
      .update(patch)
      .eq("id", id)
      .select("id, name, blurb, colours, moq, methods");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0)
      return {
        content: [{ type: "text", text: "No product updated — check the id and your admin access." }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { product: data[0] },
    };
  },
});
