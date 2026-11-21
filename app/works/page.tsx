import type { Metadata } from "next";
import ArtworkCard from "@/components/ui/ArtworkCard";
import WorksCatalogue from "@/components/ui/WorksCatalogue";
import { getArtworks, site } from "@/lib/content";

export const metadata: Metadata = { title: "Works", description: "The MINDED artwork catalogue: photography, installation, mixed media, digital art and works in development." };

export default function WorksPage() {
  const works = getArtworks();
  const cards = Object.fromEntries(works.map((a) => [a.slug, <ArtworkCard key={a.slug} a={a} />]));
  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-20 md:py-28">
      <p className="eyebrow text-gallery">Catalogue</p>
      <h1 className="font-display text-6xl md:text-8xl mt-4">Works</h1>
      <p className="mt-6 max-w-2xl text-stone leading-relaxed">Completed works, concepts and works in development. Images marked &ldquo;Visualisation&rdquo; are artist-supplied mockups and will be replaced with photographs as physical works are produced.</p>
      <div className="mt-14">
        <WorksCatalogue filters={site.filters} works={works.map((w) => ({ slug: w.slug, categories: w.categories }))} cards={cards} />
      </div>
    </div>
  );
}
