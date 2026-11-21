import type { Metadata } from "next";
import Link from "next/link";
import Figure, { Placeholder } from "@/components/ui/Figure";
import { getArchive, getArtwork } from "@/lib/content";

export const metadata: Metadata = { title: "Archive / Process", description: "Sketches, material tests, photographic studies, prototype development, unfinished ideas and reflections on creative accidents." };

export default function Archive() {
  const { intro, sections } = getArchive();
  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-20 md:py-28">
      <p className="eyebrow text-gallery">Archive / Process</p>
      <h1 className="font-display text-6xl md:text-8xl mt-4">The Archive</h1>
      <p className="mt-6 max-w-2xl text-lg text-stone leading-relaxed">{intro}</p>
      <nav aria-label="Archive sections" className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="link-underline">{s.title}</a>)}
      </nav>
      <div className="mt-20 space-y-24">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="grid md:grid-cols-[16rem_1fr] gap-10 border-t border-charcoal/10 pt-10 scroll-mt-10">
            <h2 id={`${s.id}-h`} className="font-display text-3xl">{s.title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {s.entries.map((e, i) => {
                const rel = e.related ? getArtwork(e.related) : undefined;
                return (
                  <div key={i}>
                    {e.src ? <Figure src={e.src} alt={e.alt || e.title} kind={e.kind} imgClassName="h-72" /> : <Placeholder className="h-72" label="To be supplied" sub={e.caption} />}
                    <p className="mt-4 font-display text-xl">{e.title}</p>
                    {e.src && <p className="text-sm text-stone mt-1">{e.caption}</p>}
                    {rel && <Link href={`/works/${rel.slug}/`} className="link-underline text-xs tracking-[0.14em] uppercase mt-3 inline-block">Related: {rel.title}</Link>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
