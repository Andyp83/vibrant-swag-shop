import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/keepsake-lookbook")({
  head: () => ({
    meta: [
      { title: "Keepsake Lookbook 2026–27 | See See Bloom" },
      { name: "description", content: "Browse the Australian Keepsake Lookbook 2026–27 for branded merchandise and corporate gift inspiration at See See Bloom." },
      { property: "og:title", content: "Keepsake Lookbook 2026–27 | See See Bloom" },
      { property: "og:description", content: "Explore the Australian Keepsake Lookbook 2026–27 with See See Bloom." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://seeseebloom.com.au/keepsake-lookbook" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seeseebloom.com.au/keepsake-lookbook" }],
  }),
  component: KeepsakeLookbookPage,
});

function KeepsakeLookbookPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <Button asChild variant="link" className="px-0">
        <Link to="/catalogues"><ArrowLeft aria-hidden="true" /> All catalogues</Link>
      </Button>
      <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">Branded merchandise · 2026–27 · Australia</p>
      <h1 className="display-type mt-4 text-4xl sm:text-5xl">Keepsake Lookbook</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">Branded merchandise and corporate gift inspiration from the Australian Keepsake collection.</p>
      <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
        <div className="spectrum-bar h-1.5 w-full" />
        <iframe
          title="Keepsake Lookbook 2026–27 Australia"
          allowFullScreen
          className="block h-[500px] w-full border-none"
          src="https://e.issuu.com/embed.html?d=keepsake_lookbook_2026_2027_au_056d39b39afe9b&hideIssuuLogo=true&u=trendscollection"
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