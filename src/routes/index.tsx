import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gift, Printer, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { worlds, type WorldSlug } from "@/lib/worlds";
import heroMerch from "@/assets/hero/hero-lineup-1400.png";
import heroPrint from "@/assets/hero/hero-print-rainbow.webp";
import heroGifting from "@/assets/hero/hero-gifting-rainbow.webp";

const TITLE = "See See Bloom — Branded Merchandise for Brands Worth Remembering";
const DESCRIPTION =
  "Three ways to work with us: promotional merchandise, design and print, and curated gift packs. Decorated in-house and quoted within one business day.";
const OG_IMAGE =
  "https://seeseebloom.com.au/__l5e/assets-v1/ea04488e-4e56-49b9-961f-b0142641e600/hero-lineup-1400.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/" }],
  }),
  component: Chooser,
});

const panels: Record<
  WorldSlug,
  { icon: LucideIcon; image: string; alt: string; surface: string; text: string; button: string }
> = {
  merchandise: {
    icon: Sparkles,
    image: heroMerch,
    alt: "Bright branded merchandise including drink bottles, caps, bags and notebooks",
    surface: "hero-world-merch",
    text: "text-primary-foreground",
    button: "bg-primary-foreground text-ink",
  },
  print: {
    icon: Printer,
    image: heroPrint,
    alt: "Printed business cards, signage, labels and stickers in bright colours",
    surface: "hero-world-print",
    text: "text-ink",
    button: "bg-ink text-primary-foreground",
  },
  gifts: {
    icon: Gift,
    image: heroGifting,
    alt: "Curated corporate gift packs and hampers with ribbon and branded packaging",
    surface: "hero-world-gift",
    text: "text-ink",
    button: "bg-ink text-primary-foreground",
  },
};

function Chooser() {
  return (
    <div className="min-h-[calc(100vh-5.5rem)]">
      <h1 className="sr-only">
        See See Bloom — branded merchandise, design and print, and corporate gift packs
      </h1>

      <div className="grid min-h-[calc(100vh-5.5rem)] lg:grid-cols-3">
        {worlds.map((world, i) => {
          const panel = panels[world.slug];
          const Icon = panel.icon;
          return (
            <Link
              key={world.slug}
              to={world.path}
              className={`group relative flex w-full flex-col justify-end overflow-hidden ${panel.surface} ${panel.text}`}
            >
              <img
                src={panel.image}
                alt={panel.alt}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="pointer-events-none absolute inset-x-0 top-[12%] mx-auto w-[115%] max-w-none opacity-95 transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div className="relative p-8 pt-52 sm:p-10 sm:pt-64">
                <Icon className="size-7" aria-hidden="true" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] opacity-70">
                  {world.tagline}
                </p>
                <p className="display-type mt-3 text-4xl leading-[0.95] sm:text-5xl">
                  {world.label}
                </p>
                <p className="mt-4 max-w-sm text-sm opacity-80">{world.blurb}</p>
                <span
                  className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${panel.button}`}
                >
                  Enter
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <div className="spectrum-bar h-1.5 w-full" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
