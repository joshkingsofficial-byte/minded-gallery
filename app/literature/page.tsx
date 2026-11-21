import type { Metadata } from "next";
import { literature } from "@/lib/content";

export const metadata: Metadata = { title: "Literature", description: "Writing by Dammy Ojo. To Fly, Not Fall: a psychological literary-fiction novel, manuscript in development." };

export default function Literature() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-20 md:py-28">
      <p className="eyebrow text-gallery">Literature / Writing</p>
      <h1 className="font-display text-6xl md:text-7xl mt-4">Literature</h1>
      <p className="mt-6 max-w-2xl text-stone leading-relaxed">Writing sits alongside the visual practice as its own line of work, not as an exhibition.</p>
      {literature.works.map((w) => (
        <article key={w.slug} className="mt-20 grid md:grid-cols-[1fr_1.2fr] gap-14 items-start" data-testid="literature-work">
          <div className="aspect-[2/3] bg-forest text-titanium relative overflow-hidden flex flex-col justify-between p-10">
            <div className="painterly" aria-hidden><span style={{ background: "#205C45", width: "120%", height: "70%", left: "-30%", top: "-20%" }} /></div>
            <p className="relative eyebrow text-titanium/70">{w.author}</p>
            <p className="relative font-display text-5xl leading-tight italic">{w.title}</p>
            <p className="relative eyebrow text-titanium/60">Manuscript</p>
          </div>
          <div>
            <h2 className="font-display text-5xl italic">{w.title}</h2>
            <p className="mt-3 text-stone">{w.form}</p>
            <p className="mt-6"><span className="inline-block border border-charcoal/25 px-3 py-1 text-[0.72rem] tracking-[0.14em] uppercase" data-testid="lit-status">{w.status}: not published</span></p>
            <div className="mt-8 space-y-4 text-lg leading-relaxed text-charcoal/85">{w.description.map((p, i) => <p key={i}>{p}</p>)}</div>
            <p className="mt-10 text-sm text-stone">Excerpts or news of publication will appear here only when the author chooses to share them.</p>
          </div>
        </article>
      ))}
    </div>
  );
}
