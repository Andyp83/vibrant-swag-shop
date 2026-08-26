import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://seeseebloom.com.au";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  { path: "/decoration", changefreq: "monthly", priority: "0.8" },
  { path: "/catalogues", changefreq: "monthly", priority: "0.7" },
  { path: "/procurement", changefreq: "monthly", priority: "0.7" },
  { path: "/quote", changefreq: "monthly", priority: "0.8" },
  { path: "/colour-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/lookbook", changefreq: "monthly", priority: "0.6" },
  { path: "/impact-aware", changefreq: "monthly", priority: "0.6" },
  { path: "/star-performers", changefreq: "monthly", priority: "0.6" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { getPublicSupabase } = await import("@/lib/supabase-public.server");
          const supabase = getPublicSupabase();
          const [categoriesResult, subcategoriesResult] = await Promise.all([
            supabase
              .from("catalog_categories")
              .select("id, slug, sort_order")
              .order("sort_order", { ascending: true }),
            supabase
              .from("catalog_subcategories")
              .select("category_id, slug, sort_order")
              .order("sort_order", { ascending: true }),
          ]);

          const categories = categoriesResult.data ?? [];
          const subcategories = subcategoriesResult.data ?? [];

          for (const category of categories) {
            entries.push({ path: `/products/${category.slug}`, changefreq: "weekly", priority: "0.8" });
            for (const sub of subcategories.filter((s) => s.category_id === category.id)) {
              entries.push({
                path: `/products/${category.slug}/${sub.slug}`,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          }
        } catch (error) {
          console.error("sitemap: could not load catalogue routes", error);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
