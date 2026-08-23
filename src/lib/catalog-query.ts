import { queryOptions } from "@tanstack/react-query";

import { listCatalog, type CmsCategory, type CmsSubcategory } from "./catalog.functions";

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: () => listCatalog(),
    staleTime: 60_000,
    // Transient network/dev-server hiccups shouldn't blank the page
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });


export type { CmsCategory, CmsSubcategory };
