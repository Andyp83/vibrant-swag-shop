import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/october-newsletter")({
  head: () => ({
    meta: [
      { title: "October 2026 Merchandise Newsletter | See See Bloom" },
      { name: "description", content: "Read the October 2026 Australian Trends newsletter for branded merchandise inspiration at See See Bloom." },
      { property: "og:title", content: "October 2026 Merchandise Newsletter | See See Bloom" },
      { property: "og:description", content: "The October 2026 Australian Trends newsletter — branded merchandise inspiration from See See Bloom." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/october-newsletter" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/october-newsletter" }],
  }),
  component: OctoberNewsletterPage,
});

function OctoberNewsletterPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <Button asChild variant="link" className="px-0">
        <Link to="/catalogues"><ArrowLeft aria-hidden="true" /> All catalogues</Link>
      </Button>
      <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">Branded merchandise · October 2026</p>
      <h1 className="display-type mt-4 text-4xl sm:text-5xl">October newsletter</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">Branded merchandise inspiration from the Australian Trends newsletter.</p>
      <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="October 2026 Australian Trends newsletter"
          allowFullScreen
          className="block h-[500px] w-full border-none"
          src="https://e.issuu.com/embed.html?d=trends_newsletter_-_october_2026_-_au_unbranded&hideIssuuLogo=true&u=trendscollection"
        />
      </div>
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="display-type text-3xl">Seen something you like?</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">Send us the page or product with your logo and we'll confirm decoration options and pricing.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/quote">Request a quote <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </section>
    </div>
  );
}