import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, HeartHandshake, PartyPopper, Trophy } from "lucide-react";
import { categoriesQueryOptions } from "@/lib/catalog-query";
import { Reveal } from "@/components/site/Reveal";
import { GIFT_CATEGORY_SLUGS } from "@/lib/worlds";
import heroGifting from "@/assets/hero/hero-gifting-rainbow.webp";

const TITLE = "Gift Packs & Corporate Hampers | See See Bloom";
const DESCRIPTION =
  "Curated corporate gift packs, hampers and welcome kits — assembled, branded, packed and delivered Australia-wide. Quoted within one business day.";

export const Route = createFileRoute("/gifts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/gifts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/gifts" }],
  }),
  component: GiftsPage,
});

const packs = [
  {
    icon: Boxes,
    title: "Onboarding kits",
    body: "Welcome packs that land on day one: drinkware, notebook, tech and a branded box.",
  },
  {
    icon: HeartHandshake,
    title: "Client hampers",
    body: "Considered thank-you hampers with a card, ribbon and your branding done tastefully.",
  },
  {
    icon: PartyPopper,
    title: "Event gifts",
    body: "Conference and trade-show packs, kitted per attendee and delivered to the venue.",
  },
  {
    icon: Trophy,
    title: "Milestone gifts",
    body: "Anniversaries, promotions and farewells — a keepsake worth holding onto.",
  },
];

function GiftsPage() {
  const { data: allCategories } = useSuspenseQuery(categoriesQueryOptions());
  const giftCategories = allCategories.filter((c) => GIFT_CATEGORY_SLUGS.includes(c.slug));

  return (
    <div>
      <section className="hero-world-gift relative overflow-hidden text-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
              Gift packs · Hampers · Kits
            </p>
            <h1 className="display-type mt-5 text-5xl leading-[0.95] sm:text-6xl">
              Gifts that get remembered
            </h1>
            <p className="mt-6 max-w-xl text-ink/70">
              Onboarding kits, client hampers, event gifts and milestone packs — curated, branded,
              assembled and delivered anywhere in Australia.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/products"
                search={{ world: "gifts" }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-primary-foreground"
              >
                Browse gift packs
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/corporate-gifts"
                className="inline-flex items-center rounded-full border border-ink/25 px-7 py-3.5 text-sm font-semibold hover:bg-ink/5"
              >
                Gift enquiry
              </Link>
            </div>
          </div>
          <img
            src={heroGifting}
            alt="Curated corporate gift packs and hampers with ribbon and branded packaging"
            width={1400}
            height={900}
            className="w-full"
          />
        </div>
        <div className="spectrum-bar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
      </section>

      {giftCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="display-type text-4xl sm:text-5xl">Shop the gifting range</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {giftCategories.map((c, i) => (
              <Reveal key={c.slug} delay={i * 80} variant="scale">
                <Link
                  to="/products/$category"
                  params={{ category: c.slug }}
                  className="lift group block overflow-hidden rounded-xl border-2 border-border bg-card"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={c.image_url}
                      alt={`${c.name} corporate gifts`}
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      width={1200}
                      height={900}
                      className="size-full object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <p className="display-type text-lg">{c.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-border bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="display-type text-4xl sm:text-5xl">Pack types</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {packs.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} variant="up">
                <p.icon className="size-7" aria-hidden="true" />
                <p className="mt-5 text-lg font-semibold">{p.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Reveal>
          <h2 className="display-type text-4xl sm:text-5xl">Tell us about the gift</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Who it's for, how many, and your budget per pack. We'll come back with two or three
            curated options.
          </p>
          <Link
            to="/corporate-gifts"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Start a gift enquiry
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
