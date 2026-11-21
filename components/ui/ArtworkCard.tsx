import Link from "next/link";
import type { Artwork } from "@/lib/types";
import ArtworkVisual from "./ArtworkVisual";

export default function ArtworkCard({ a }: { a: Artwork }) {
  return (
    <Link href={`/works/${a.slug}/`} className="group block" data-testid="artwork-card">
      <div className="transition-transform duration-700 ease-[var(--ease-gallery)] group-hover:-translate-y-1">
        <ArtworkVisual a={a} />
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl">{a.title}</h3>
        <span className="text-sm text-stone">{a.year}</span>
      </div>
      <p className="mt-1 text-sm text-stone">{a.status}</p>
    </Link>
  );
}
