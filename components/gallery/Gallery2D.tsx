"use client";
import { asset } from "@/lib/config";
import { getArchive, getArtwork, getRooms, getSeries, imagesWithheld } from "@/lib/content";
import type { Selection } from "@/lib/gallery/store";

export default function Gallery2D({ onSelect, notice }: { onSelect: (s: NonNullable<Selection>) => void; notice?: string }) {
  const rooms = getRooms();
  const archive = getArchive();
  return (
    <div className="bg-titanium min-h-full" data-testid="gallery-2d">
      <div className="mx-auto max-w-[1300px] px-6 md:px-10 pt-28 pb-24">
        {notice && <p className="mb-10 border-l-2 border-gallery bg-warm px-5 py-4 text-sm" data-testid="webgl-notice">{notice}</p>}
        <p className="eyebrow text-gallery">Virtual gallery · 2D view</p>
        <h1 className="font-display text-5xl md:text-7xl mt-3">MINDED: First Rooms</h1>
        <p className="mt-4 text-stone max-w-2xl">The same exhibition as the 3D gallery, room by room, without 3D graphics.</p>
        <div className="mt-16 space-y-24">
          {rooms.map((r) => {
            const seen = new Set<string>();
            const works = r.placements.filter((p) => p.display !== "doc" && !seen.has(p.artwork) && seen.add(p.artwork)).map((p) => getArtwork(p.artwork)!);
            return (
              <section key={r.id} aria-labelledby={`r-${r.id}`} className="border-t border-charcoal/10 pt-10">
                <p className="eyebrow text-stone">{r.number ? `Room ${r.number}` : "Entrance"}</p>
                <h2 id={`r-${r.id}`} className="font-display text-4xl mt-2">{r.title}</h2>
                <p className="mt-3 text-stone max-w-2xl">{r.intro}</p>
                {r.id === "room-04" && <p className="mt-3 text-sm border-l-2 border-gallery pl-3 max-w-2xl">The 3D room contains a SIMULATION of AURA&rsquo;s two states. It is not the physical installation.</p>}
                <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {works.map((a) => {
                    const withheld = imagesWithheld(a);
                    const imgs = a.series ? getSeries(a).map((s) => s.images[0]) : a.images.slice(0, 1);
                    return (
                      <li key={a.slug}>
                        <button className="group text-left w-full" onClick={() => onSelect({ type: "artwork", slug: a.slug })} data-testid="room2d-work">
                          <div className="h-64 bg-warm flex items-center justify-center gap-2 px-4">
                            {withheld ? <span className="eyebrow text-stone text-center">Image withheld<br />pending rights</span> :
                              imgs.map((im) => im && /* eslint-disable-next-line @next/next/no-img-element */ <img key={im.src} src={asset(im.src)} alt={im.alt} loading="lazy" className="max-h-[85%] w-auto object-contain" />)}
                          </div>
                          <p className="mt-3 font-display text-2xl group-hover:text-gallery">{a.title}</p>
                          <p className="text-sm text-stone">{a.status}</p>
                        </button>
                      </li>
                    );
                  })}
                  {r.id === "room-05" && archive.sections.flatMap((s, si) => s.entries.map((e, ei) => (
                    <li key={`${si}-${ei}`}>
                      <button className="group text-left w-full" onClick={() => onSelect({ type: "archive", section: si, entry: ei })}>
                        <div className="h-48 bg-warm flex items-center justify-center">
                          {e.src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={asset(e.src)} alt={e.alt || e.title} loading="lazy" className="max-h-full w-auto object-contain" /> : <span className="eyebrow text-stone">To be supplied</span>}
                        </div>
                        <p className="mt-3 font-display text-xl">{e.title}</p>
                        <p className="text-sm text-stone">{s.title}</p>
                      </button>
                    </li>
                  )))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
