import { queryOptions } from "@tanstack/react-query";

import {
  getProductDetail,
  listCatalog,
  listCategories,
  type CmsCategory,
  type CmsProduct,
  type CmsProductColour,
  type CmsProductImage,
  type CmsSubcategory,
} from "./catalog.functions";

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: () => listCatalog(),
    staleTime: 60_000,
    // Transient network/dev-server hiccups shouldn't blank the page
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });


export type { CmsCategory, CmsProduct, CmsProductColour, CmsProductImage, CmsSubcategory };

export const productDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["catalog", "product-detail", id],
    queryFn: () => getProductDetail({ data: { id } }),
    staleTime: 5 * 60_000,
  });

/** Lightweight: categories + subcategories, without the full product payload. */
export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog", "categories"],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
    retry: 2,
  });
