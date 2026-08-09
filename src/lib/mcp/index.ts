import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listCategoriesTool from "./tools/list-categories";
import listProductsTool from "./tools/list-products";
import listQuoteRequestsTool from "./tools/list-quote-requests";
import updateProductTool from "./tools/update-product";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged, and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "bright-brand-gifts",
  title: "Bright Brand Gifts",
  version: "0.1.0",
  instructions:
    "Tools for the Brand Bento branded merchandise catalogue. Use `list_categories` and `list_products` to browse categories, MOQs and decoration methods, `update_product` to edit product details (admin only), and `list_quote_requests` to review incoming customer quote requests (admin only).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategoriesTool, listProductsTool, updateProductTool, listQuoteRequestsTool],
});
