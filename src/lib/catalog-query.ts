import { queryOptions } from "@tanstack/react-query";

import { listCatalog, type CmsCategory } from "./catalog.functions";

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: () => listCatalog(),
    staleTime: 60_000,
  });

export type { CmsCategory };
