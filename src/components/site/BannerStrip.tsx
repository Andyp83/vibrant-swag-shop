import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Banner } from "@/lib/banners";

/** Contained, rounded promo banner. Wide artwork, no cropping. */
export function BannerStrip({ banner }: { banner: Banner }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-secondary">
      <img
        src={banner.url}
        alt={banner.alt}
        loading="lazy"
        className="w-full object-contain"
      />
      {banner.to && banner.cta ? (
        <figcaption className="border-t border-border bg-card px-5 py-3">
          <Link
            to={banner.to}
            className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            {banner.cta} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </figcaption>
      ) : null}
    </figure>
  );
}

export function BannerRow({
  banners,
  title,
  className = "",
}: {
  banners: Banner[];
  title?: string;
  className?: string;
}) {
  if (banners.length === 0) return null;
  return (
    <section className={className}>
      {title ? <h2 className="display-type text-2xl sm:text-3xl">{title}</h2> : null}
      <div className={`grid gap-6 ${title ? "mt-8" : ""}`}>
        {banners.map((b) => (
          <BannerStrip key={b.url} banner={b} />
        ))}
      </div>
    </section>
  );
}
