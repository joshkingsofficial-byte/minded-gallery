import { asset } from "@/lib/config";
import { getSeries, imagesWithheld } from "@/lib/content";
import type { Artwork } from "@/lib/types";
import { KindBadge, Placeholder } from "./Figure";

/** The primary visual for an artwork: deck image, series strip, or an honest placeholder. */
export default function ArtworkVisual({ a, size = "card", priority = false }: { a: Artwork; size?: "card" | "hero"; priority?: boolean }) {
  const h = size === "hero" ? "h-[62vh] min-h-[420px]" : "h-[380px]";
  if (imagesWithheld(a)) {
    return <Placeholder className={`${h} w-full`} label="Image withheld" sub="Pending confirmation of image rights for the underlying photograph." />;
  }
  if (a.series?.length) {
    const kids = getSeries(a);
    return (
      <div className={`relative ${h} w-full bg-warm flex items-center justify-center gap-[2%] px-[6%]`}>
        {kids.map((k) => k.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={k.slug} src={asset(k.images[0].src)} alt={k.images[0].alt} loading={priority ? "eager" : "lazy"} className="h-[78%] w-auto object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.18)]" />
        ))}
        <KindBadge kind="visualisation" className="absolute left-3 top-3" />
      </div>
    );
  }
  const img = a.images.find((i) => i.role === "deck") || a.images[0];
  if (!img) return <Placeholder className={`${h} w-full`} label="Image to be supplied" sub="Original artwork image to be supplied by the artist." />;
  const isDeck = img.role === "deck" && img.src.includes("deck-");
  return (
    <div className={`relative ${h} w-full bg-warm flex items-center justify-center overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(img.src)} alt={img.alt} loading={priority ? "eager" : "lazy"} className={isDeck ? "h-[84%] w-auto object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.2)]" : "h-full w-full object-contain"} />
      <KindBadge kind={img.kind} className="absolute left-3 top-3" />
    </div>
  );
}
