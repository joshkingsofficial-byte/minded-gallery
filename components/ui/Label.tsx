import type { Artwork } from "@/lib/types";

/** Gallery wall-label format: MINDED / TITLE / Year / Medium / Dimensions / Status */
export default function Label({ a, className = "" }: { a: Artwork; className?: string }) {
  return (
    <dl className={`text-sm leading-relaxed ${className}`} data-testid="artwork-label">
      <dt className="sr-only">Artist</dt><dd className="eyebrow text-gallery">MINDED</dd>
      <dt className="sr-only">Title</dt><dd className="font-display text-2xl mt-2 leading-tight">{a.title}</dd>
      <dt className="sr-only">Year</dt><dd className="mt-2">{a.year || "TBC"}</dd>
      <dt className="sr-only">Medium</dt><dd className="text-stone">{a.medium}</dd>
      <dt className="sr-only">Dimensions</dt><dd className="text-stone">Dimensions: {a.dimensions || "TBC"}</dd>
      <dt className="sr-only">Status</dt><dd className="mt-2"><span className={`inline-block px-2 py-0.5 text-[0.7rem] tracking-[0.12em] uppercase ${a.statusType === "produced" ? "bg-forest text-titanium" : "border border-charcoal/25"}`}>{a.status}</span></dd>
    </dl>
  );
}
