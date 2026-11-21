"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/config";
import { getArchive, getArtwork, getSeries, imagesWithheld } from "@/lib/content";
import type { Selection } from "@/lib/gallery/store";
import { KIND_LABEL } from "@/components/ui/Figure";
import type { ArtworkImage } from "@/lib/types";

export default function DetailPanel({ sel, onClose }: { sel: NonNullable<Selection>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ArtworkImage | null>(null);
  const [idx, setIdx] = useState(sel.type === "artwork" ? sel.image ?? 0 : 0);
  useEffect(() => { ref.current?.focus(); }, [sel]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { if (zoom) setZoom(null); else onClose(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [zoom, onClose]);

  let content: React.ReactNode;
  if (sel.type === "archive") {
    const sec = getArchive().sections[sel.section];
    const e = sec.entries[sel.entry];
    const rel = e.related ? getArtwork(e.related) : undefined;
    content = (
      <>
        <p className="eyebrow text-gallery">Archive · {sec.title}</p>
        <h2 className="font-display text-4xl mt-3">{e.title}</h2>
        {e.src ? (
          <button className="block mt-6 w-full bg-warm" onClick={() => setZoom({ src: e.src!, alt: e.alt || e.title, caption: e.caption, kind: e.kind })} aria-label="View enlarged">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(e.src)} alt={e.alt || e.title} className="w-full max-h-[46vh] object-contain" />
          </button>
        ) : <div className="mt-6 h-48 bg-warm border border-dashed border-charcoal/20 flex items-center justify-center eyebrow text-stone">To be supplied</div>}
        <p className="mt-3 eyebrow !text-[0.6rem] text-stone">{KIND_LABEL[e.kind]}</p>
        <p className="mt-4 text-charcoal/85 leading-relaxed">{e.caption}</p>
        {rel && <Link href={`/works/${rel.slug}/`} className="mt-6 inline-block link-underline eyebrow">Related work: {rel.title}</Link>}
      </>
    );
  } else {
    const a = getArtwork(sel.slug)!;
    const parent = a.parent ? getArtwork(a.parent) : undefined;
    const withheld = imagesWithheld(a);
    const series = getSeries(a);
    const imgs = withheld ? [] : series.length ? series.map((s) => s.images[0]).filter(Boolean) : a.images;
    const cur = imgs[Math.min(idx, imgs.length - 1)];
    content = (
      <>
        <p className="eyebrow text-gallery">MINDED{parent ? ` · ${parent.title}` : ""}</p>
        <h2 className="font-display text-4xl mt-3 leading-tight" id="detail-title">{a.title}</h2>
        <dl className="mt-3 text-sm text-stone space-y-0.5">
          <div><dt className="sr-only">Year</dt><dd>{a.year}</dd></div>
          <div><dt className="sr-only">Medium</dt><dd>{a.medium}</dd></div>
          <div><dt className="sr-only">Dimensions</dt><dd>Dimensions: {a.dimensions}</dd></div>
          <div><dt className="sr-only">Status</dt><dd className="pt-1"><span className="inline-block border border-charcoal/25 px-2 py-0.5 text-[0.68rem] tracking-[0.12em] uppercase text-charcoal">{a.status}</span></dd></div>
        </dl>
        {withheld ? (
          <div className="mt-6 bg-warm border border-dashed border-charcoal/25 p-6 text-sm" data-testid="detail-withheld"><p className="eyebrow">Image withheld</p><p className="mt-2 text-stone">{a.rightsNote}</p></div>
        ) : cur ? (
          <div className="mt-6">
            <button className="block w-full bg-warm group relative" onClick={() => setZoom(cur)} aria-label={`View enlarged: ${cur.alt}`} data-testid="detail-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(cur.src)} alt={cur.alt} className="w-full h-[40vh] object-contain p-4" />
              <span className="absolute right-3 bottom-3 eyebrow !text-[0.6rem] bg-titanium/90 px-2 py-1">Enlarge</span>
            </button>
            <p className="mt-2 eyebrow !text-[0.6rem] text-stone">{KIND_LABEL[cur.kind]}</p>
            <p className="mt-1 text-xs text-stone">{cur.caption}</p>
            {imgs.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Images">
                {imgs.map((im, i) => (
                  <button key={im.src} onClick={() => setIdx(i)} aria-pressed={i === idx} className={`shrink-0 w-14 h-14 bg-warm border ${i === idx ? "border-forest" : "border-transparent"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset(im.src)} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <p className="font-display italic text-2xl mt-6 leading-snug">{a.statement}</p>
        <div className="mt-4 space-y-3 text-[0.95rem] text-charcoal/85 leading-relaxed">{a.description.map((p, i) => <p key={i}>{p}</p>)}</div>
        {a.slug === "aura-001" && <p className="mt-4 text-sm border-l-2 border-gallery pl-3">The object in Room 04 is a SIMULATION of AURA&rsquo;s ART and MIRROR states, not the physical installation. Voice is not finished; music recognition is designed but not built.</p>}
        {a.editions.length > 0 && (
          <div className="mt-6"><p className="eyebrow text-gallery">Editions</p>
            <ul className="mt-2 text-sm divide-y divide-charcoal/10">{a.editions.map((e, i) => <li key={i} className="py-2 flex justify-between gap-4"><span>{e.type}</span><span className="text-stone text-right">{e.detail}</span></li>)}</ul>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/works/${a.slug}/`} className="bg-forest text-titanium px-5 py-3 eyebrow !tracking-[0.2em]" data-testid="detail-page-link">Artwork page</Link>
          <Link href={`/contact/?work=${a.slug}`} className="border border-charcoal/25 px-5 py-3 eyebrow !tracking-[0.2em]">Enquire</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-charcoal/20 md:bg-transparent" onClick={onClose} aria-hidden />
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Artwork details" data-testid="detail-panel"
        className="fixed z-[61] bg-titanium text-charcoal shadow-2xl overflow-y-auto outline-none inset-x-0 bottom-0 max-h-[82vh] md:inset-y-0 md:right-0 md:left-auto md:w-[460px] md:max-h-none p-7 md:p-9 page-in">
        <button onClick={onClose} className="float-right eyebrow border border-charcoal/20 px-3 py-2 hover:border-charcoal" data-testid="detail-close">Close</button>
        {content}
      </aside>
      {zoom && (
        <div className="fixed inset-0 z-[70] bg-charcoal/95 flex flex-col items-center justify-center p-6" role="dialog" aria-label="Enlarged image" data-testid="lightbox" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(zoom.src)} alt={zoom.alt} className="max-w-full max-h-[80vh] object-contain" />
          <p className="mt-4 text-titanium/80 text-sm text-center max-w-2xl"><span className="eyebrow !text-[0.6rem] mr-2">{KIND_LABEL[zoom.kind]}</span>{zoom.caption}</p>
          <button className="mt-4 eyebrow text-titanium border border-titanium/30 px-4 py-2" onClick={() => setZoom(null)}>Close</button>
        </div>
      )}
    </>
  );
}
