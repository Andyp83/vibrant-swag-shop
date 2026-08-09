import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_quote_requests",
  title: "List quote requests",
  description:
    "List incoming customer quote requests, newest first, including contact details, product interest, quantity, decoration and deadline. Admin access required.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("quote_requests")
      .select(
        "id, created_at, name, company, email, phone, product_interest, quantity, decoration, budget, required_by, notes",
      )
      .order("created_at", { ascending: false })
      .limit(take);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { quote_requests: data ?? [] },
    };
  },
});
