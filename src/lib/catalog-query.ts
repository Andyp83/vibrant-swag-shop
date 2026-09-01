import { queryOptions } from "@tanstack/react-query";

import {
  getProductDetail,
  getProductPage,
  listCatalog,
  listCategories,
  listDecorationMethods,
  listProductFamilies,
  type CmsCategory,
  type CmsFamilyQuery,
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

/** One page of variant-grouped products, filtered and counted in the database. */
export const productFamiliesQueryOptions = (query: CmsFamilyQuery) =>
  queryOptions({
    queryKey: ["catalog", "families", query],
    queryFn: () => listProductFamilies({ data: query }),
    staleTime: 60_000,
    retry: 1,
  });

/** Decoration methods offered anywhere in the catalogue (filter dropdown). */
export const decorationMethodsQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog", "decoration-methods"],
    queryFn: () => listDecorationMethods(),
    staleTime: 30 * 60_000,
  });

/** A single product page (category, sub-range, product with long text). */
export const productPageQueryOptions = (params: {
  category: string;
  subcategory: string;
  product: string;
}) =>
  queryOptions({
    queryKey: ["catalog", "product-page", params],
    queryFn: () => getProductPage({ data: params }),
    staleTime: 5 * 60_000,
  });
