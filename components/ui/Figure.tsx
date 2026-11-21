import { asset } from "@/lib/config";
import type { ImageKind } from "@/lib/types";

export const KIND_LABEL: Record<ImageKind, string> = {
  visualisation: "Visualisation: artist-supplied mockup",
  photograph: "Photograph",
  documentation: "Prototype documentation",
  concept: "Concept visual: not a fabrication drawing",
  placeholder: "To be supplied",
};

export function KindBadge({ kind, className = "" }: { kind: ImageKind; className?: string }) {
  return (
    <span className={`inline-block eyebrow !text-[0.6rem] !tracking-[0.18em] px-2 py-1 ${kind === "photograph" ? "bg-forest text-titanium" : "bg-titanium/90 text-charcoal border border-charcoal/15"} ${className}`}>
      {KIND_LABEL[kind]}
    </span>
  );
}

export function Placeholder({ label, sub, className = "", dark = false }: { label: string; sub?: string; className?: string; dark?: boolean }) {
  return (
    <div role="img" aria-label={`${label}${sub ? `: ${sub}` : ""}`} className={`flex flex-col items-center justify-center text-center p-6 ${dark ? "bg-charcoal text-titanium/70" : "bg-warm text-stone"} border border-dashed ${dark ? "border-titanium/20" : "border-charcoal/20"} ${className}`}>
      <span className="eyebrow">{label}</span>
      {sub && <span className="mt-3 text-sm max-w-[28ch] leading-relaxed">{sub}</span>}
    </div>
  );
}

export default function Figure({ src, alt, caption, kind, className = "", imgClassName = "", contain = true, priority = false }: { src: string; alt: string; caption?: string; kind: ImageKind; className?: string; imgClassName?: string; contain?: boolean; priority?: boolean }) {
  return (
    <figure className={className}>
      <div className="relative bg-warm overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(src)} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={`w-full h-full ${contain ? "object-contain" : "object-cover"} ${imgClassName}`} />
        <KindBadge kind={kind} className="absolute left-3 top-3" />
      </div>
      {caption && <figcaption className="mt-3 text-sm text-stone leading-relaxed">{caption}</figcaption>}
    </figure>
  );
}
