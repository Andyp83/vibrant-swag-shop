import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Printer, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import heroMerch from "@/assets/hero/hero-lineup-1862.png";
import heroMerchSmall from "@/assets/hero/hero-lineup-1400.png";
import heroPrint from "@/assets/hero/hero-print-rainbow.webp";
import heroGifting from "@/assets/hero/hero-gifting-rainbow.webp";

type Slide = {
  id: string;
  /** Background + text treatment for this slide's colour world. */
  world: string;
  /** Decorative backdrop layer classes. */
  backdrop: string;
  icon: LucideIcon;
  eyebrow: string;
  badge: string;
  words: string[];
  body: string;
  bodyClass: string;
  primary: { to: string; label: string; className: string };
  secondary: { to: string; label: string; className: string };
  image: { src: string; srcSet?: string; sizes: string; width: number; height: number; alt: string };
  imageClass: string;
  accent: string;
};

const slides: Slide[] = [
  {
    id: "merch",
    world: "hero-world-merch text-primary-foreground",
    backdrop: "",
    icon: Sparkles,
    eyebrow: "Branded merchandise · Promotional product",
    badge: "border-white/25",
    words: ["Merch", "worth", "keeping"],
    body: "See See Bloom sources, decorates and delivers promotional product in every colour of the spectrum. Branded merchandise for brands worth remembering.",
    bodyClass: "text-primary-foreground/75",
    primary: {
      to: "/products",
      label: "Browse products",
      className: "bg-primary-foreground text-ink",
    },
    secondary: {
      to: "/quote",
      label: "Get a quote",
      className: "border border-white/30 hover:bg-white/10",
    },
    image: {
      src: heroMerch,
      srcSet: `${heroMerchSmall} 1400w, ${heroMerch} 1862w`,
      sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1024px",
      width: 1862,
      height: 683,
      alt: "Bright branded merchandise including drink bottles, caps, bags, notebooks and gift sets",
    },
    imageClass: "hero-lineup",
    accent: "spectrum-bar",
  },
  {
    id: "print",
    world: "hero-world-print text-ink",
    backdrop:
      "hero-ink-splash absolute left-1/2 top-1/2 aspect-square w-[130vw] -translate-x-1/2 -translate-y-1/2 opacity-70 blur-2xl",
    icon: Printer,
    eyebrow: "Design services · Print",
    badge: "border-ink/20",
    words: ["Design", "it", "with", "us"],
    body: "Upload your template or start from scratch — our studio builds the artwork, sets the colours and prints it. Brochures, packaging, signage and everything between.",
    bodyClass: "text-ink/70",
    primary: {
      to: "/decoration",
      label: "Explore print & decoration",
      className: "bg-ink text-primary-foreground",
    },
    secondary: {
      to: "/quote",
      label: "Upload your artwork",
      className: "border border-ink/25 hover:bg-ink/5",
    },
    image: {
      src: heroPrint,
      sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1024px",
      width: 1335,
      height: 626,
      alt: "Printed business cards, flyers, posters, trifold brochures, presentation folders, vinyl banners and pull-up banners printed in bright cyan, magenta and yellow on white stock",
    },
    imageClass: "hero-lineup-light",
    accent: "hero-accent-print",
  },
  {
    id: "gifting",
    world: "hero-world-gift text-primary-foreground",
    backdrop:
      "hero-gold-glow absolute left-1/2 top-1/2 aspect-square w-[120vw] -translate-x-1/2 -translate-y-1/2 opacity-80 blur-3xl",
    icon: Gift,
    eyebrow: "Hampers · Client & staff gifting",
    badge: "border-white/20",
    words: ["Gifts", "they", "remember"],
    body: "Curated hampers, welcome packs and Christmas gifting — kitted by hand and drop-shipped to staff, clients or event doors across Australia.",
    bodyClass: "text-primary-foreground/70",
    primary: {
      to: "/products/$category",
      label: "See gifting options",
      className: "bg-primary-foreground text-ink",
    },
    secondary: {
      to: "/quote",
      label: "Plan a gifting project",
      className: "border border-white/25 hover:bg-white/10",
    },
    image: {
      src: heroGifting,
      sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1024px",
      width: 1536,
      height: 576,
      alt: "Corporate gift hampers, wine bag, candle, chocolates, keepsake box and leather notebook",
    },
    imageClass: "hero-lineup-warm",
    accent: "hero-accent-gift",
  },
];

const INTERVAL = 7000;

/**
 * Head links for the homepage: preload the first (LCP) hero image at high
 * priority and warm the other two slides so the rotation never fetches mid-tick.
 */
export const heroPreloadLinks = [
  {
    rel: "preload",
    as: "image",
    href: heroMerch,
    imageSrcSet: slides[0]!.image.srcSet,
    imageSizes: slides[0]!.image.sizes,
    fetchPriority: "high",
  },
  { rel: "preload", as: "image", href: heroPrint, fetchPriority: "low" },
  { rel: "preload", as: "image", href: heroGifting, fetchPriority: "low" },
] as const;


export function HeroCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced]);

  const active = slides[index]!;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="See See Bloom services"
      data-world={slides[index]!.id}
      className="hero-carousel relative isolate overflow-hidden border-b border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        if (Math.abs(end - start) > 50) go(index + (end < start ? 1 : -1));
        touchStart.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      {slides.map((slide, i) => {
        const isActive = i === index;
        const Icon = slide.icon;
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={!isActive}
            inert={!isActive}
            className={`hero-slide ${slide.world} ${
              isActive ? "hero-slide-active" : "hero-slide-idle"
            }`}
          >
            {/* Rays are mounted on every slide from first paint, so the spin is
                continuous and in sync as the hero ticks between worlds. */}
            <div
              className="hero-rays-layer spectrum-rays spectrum-rays-spin -z-10"
              aria-hidden="true"
            />
            {slide.backdrop ? (
              <div className={`-z-10 ${slide.backdrop}`} aria-hidden="true" />
            ) : null}

            <div className="relative z-[3] mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-20 pt-24 text-center sm:pt-32 lg:pb-24 lg:pt-32">
              <p className="hero-rise">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] ${slide.badge}`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {slide.eyebrow}
                </span>
              </p>

              <h1 className="display-type mx-auto mt-8 max-w-4xl text-6xl leading-[0.88] sm:text-8xl">
                {slide.words.map((w, wi) => (
                  <span
                    key={w}
                    className="hero-word mr-[0.25em]"
                    style={{ animationDelay: `${140 + wi * 120}ms` }}
                  >
                    {w}
                  </span>
                ))}
              </h1>

              <p
                className={`hero-rise mx-auto mt-7 max-w-xl text-lg ${slide.bodyClass}`}
                style={{ animationDelay: "520ms" }}
              >
                {slide.body}
              </p>

              <div
                className="hero-rise mt-10 flex flex-wrap items-center justify-center gap-3"
                style={{ animationDelay: "640ms" }}
              >
                {slide.id === "gifting" ? (
                  <Link
                    to="/products/$category"
                    params={{ category: "hampers-gifting" }}
                    className={`sweep group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-transform duration-300 hover:scale-[1.04] ${slide.primary.className}`}
                  >
                    {slide.primary.label}
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                ) : (
                  <Link
                    to={slide.primary.to}
                    className={`sweep group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-transform duration-300 hover:scale-[1.04] ${slide.primary.className}`}
                  >
                    {slide.primary.label}
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                )}
                <Link
                  to={slide.secondary.to}
                  className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-colors duration-300 ${slide.secondary.className}`}
                >
                  {slide.secondary.label}
                </Link>
              </div>

              <div
                className="hero-rise relative -mx-3 mt-10 w-[calc(100%+1.5rem)] max-w-none sm:mx-auto sm:mt-12 sm:w-full sm:max-w-5xl sm:px-6"
                style={{ animationDelay: "760ms" }}
              >
                {slide.id !== "print" && (
                  <div
                    className="hero-lineup-glow pointer-events-none absolute inset-0"
                    aria-hidden="true"
                  />
                )}
                <img
                  src={slide.image.src}
                  srcSet={slide.image.srcSet}
                  sizes={slide.image.sizes}
                  alt={slide.image.alt}
                  // All three slides load up front (3 images, one of which is the
                  // LCP) so ticking worlds never waits on a lazy fetch.
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                  width={slide.image.width}
                  height={slide.image.height}
                  className={`relative h-auto w-full max-w-full object-contain ${slide.imageClass}`}
                />

              </div>
            </div>
          </div>
        );
      })}

      {/* ---------- Controls ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className={`pointer-events-auto inline-flex size-9 items-center justify-center rounded-full border transition-colors ${active.badge} ${
            active.id === "print" ? "text-ink hover:bg-ink/5" : "text-primary-foreground hover:bg-white/10"
          }`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${slide.words.join(" ")}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === index ? "w-8" : "w-2 opacity-50"
              } ${active.id === "print" ? "bg-ink" : "bg-primary-foreground"}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className={`pointer-events-auto inline-flex size-9 items-center justify-center rounded-full border transition-colors ${active.badge} ${
            active.id === "print" ? "text-ink hover:bg-ink/5" : "text-primary-foreground hover:bg-white/10"
          }`}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className={`absolute inset-x-0 bottom-0 z-20 h-2 w-full ${active.accent}`} aria-hidden="true" />
    </section>
  );
}
