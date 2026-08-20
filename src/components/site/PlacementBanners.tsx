import { useQuery } from "@tanstack/react-query";

import { BannerRow } from "@/components/site/BannerStrip";
import { bannersFor, bannersQueryOptions } from "@/lib/banners";

/** Renders whichever banners the back office has switched on for this placement. */
export function PlacementBanners({
  placement,
  title,
  className = "",
}: {
  placement: string;
  title?: string;
  className?: string;
}) {
  const { data } = useQuery(bannersQueryOptions());
  const banners = bannersFor(data, placement);
  if (banners.length === 0) return null;
  return <BannerRow banners={banners} {...(title ? { title } : {})} className={className} />;
}
