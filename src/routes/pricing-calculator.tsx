import { createFileRoute } from "@tanstack/react-router";

import { PricingCalculator } from "@/components/site/PricingCalculator";

const TITLE = "Merchandise Pricing Calculator | See See Bloom";
const DESCRIPTION = "Choose a branded merchandise item, quantity and decoration method to see an indicative price before adding it to your quote shortlist.";

export const Route = createFileRoute("/pricing-calculator")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/pricing-calculator" }],
  }),
  component: PricingCalculatorPage,
});

function PricingCalculatorPage() {
  return (
    <main>
      <section className="border-b border-border bg-spectrum-amber-soft">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-18">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Branded merchandise</p>
          <h1 className="display-type mt-4 max-w-3xl text-4xl sm:text-5xl">Price an item before you shortlist it</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">Search our catalogue, choose a quantity and decoration method, and see an indicative cost using the same pricing rules as your final shortlist.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <PricingCalculator />
      </section>
    </main>
  );
}