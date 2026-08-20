import { queryOptions } from "@tanstack/react-query";

import { listBanners, type SiteBanner } from "./banners.functions";

export type Banner = {
  url: string;
  alt: string;
  to?: string;
  cta?: string;
};

/** Placement slots a banner can be assigned to in the back office. */
export const bannerPlacements = [
  { value: "home", label: "Home page" },
  { value: "decoration", label: "Decoration options" },
  { value: "lookbook", label: "Brands Lookbook" },
  { value: "impact-aware", label: "Impact Aware" },
] as const;

/** Placement value for a product category page. */
export function categoryPlacement(slug: string) {
  return `category:${slug}`;
}

export const bannersQueryOptions = () =>
  queryOptions({
    queryKey: ["site-banners"],
    queryFn: () => listBanners(),
    staleTime: 5 * 60 * 1000,
  });

function toBanner(row: SiteBanner): Banner {
  return {
    url: row.image_url,
    alt: row.alt,
    ...(row.link_to ? { to: row.link_to } : {}),
    ...(row.cta ? { cta: row.cta } : {}),
  };
}

/** Active banners assigned to a placement, in display order. */
export function bannersFor(rows: SiteBanner[] | undefined, placement: string): Banner[] {
  return (rows ?? [])
    .filter((row) => row.is_active && row.placements.includes(placement))
    .map(toBanner);
}
