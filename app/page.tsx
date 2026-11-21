import Link from "next/link";
import Intro from "@/components/ui/Intro";
import Painterly from "@/components/ui/Painterly";
import ArtworkCard from "@/components/ui/ArtworkCard";
import { getArtworks, getRooms, site } from "@/lib/content";

const ENTRIES = [
  { href: "/gallery/", label: "Enter Gallery", note: "A walkable virtual exhibition in six spaces" },
  { href: "/works/", label: "Selected Works", note: "The catalogue" },
  { href: "/about/", label: "About MINDED", note: "Philosophy and practice" },
  { href: "/archive/", label: "Archive", note: "Process, studies and accidents" },
  { href: "/contact/", label: "Contact", note: "Galleries, commissions, press" },
];

export default function Home() {
  const works = getArtworks().filter((a) => ["lonely", "shades-of", "black-and-gold", "aura-001"].includes(a.slug));
  const rooms = getRooms();
  return (
    <>
      <Intro />
      <section className="relative bg-forest text-titanium overflow-hidden">
        <Painterly />
        <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 pt-24 pb-28 md:pt-36 md:pb-40">
          <p className="eyebrow text-titanium/70">Dammy Ojo</p>
          <h1 className="font-display text-[clamp(4rem,14vw,13rem)] leading-[0.9] tracking-[0.18em] mt-6">MINDED</h1>
          <p className="eyebrow mt-8 text-titanium/85 max-w-xl leading-loose">{site.tagline}</p>
          <div className="mt-14 flex flex-wrap gap-4">
            <Link href="/gallery/" data-testid="enter-gallery" className="bg-titanium text-forest px-8 py-4 eyebrow !tracking-[0.22em] hover:bg-warm transition-colors">Enter Gallery</Link>
            <Link href="/works/" className="border border-titanium/40 px-8 py-4 eyebrow !tracking-[0.22em] hover:border-titanium transition-colors">Selected Works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 md:px-10 py-24 md:py-36 grid md:grid-cols-[1fr_1.3fr] gap-14">
        <p className="eyebrow text-gallery">Philosophy</p>
        <div className="space-y-8">
          <p className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.15]">{site.philosophy[1]}</p>
          <p className="text-lg leading-relaxed text-stone max-w-2xl">{site.philosophy[2]}</p>
        </div>
      </section>

      <nav aria-label="Explore" className="border-y border-charcoal/10">
        <ul className="mx-auto max-w-[1440px] grid md:grid-cols-5">
          {ENTRIES.map((e) => (
            <li key={e.href} className="border-b md:border-b-0 md:border-r border-charcoal/10 last:border-0">
              <Link href={e.href} className="group block px-6 md:px-8 py-10 hover:bg-warm transition-colors h-full" data-testid={`home-link-${e.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <span className="font-display text-3xl block group-hover:text-gallery transition-colors">{e.label}</span>
                <span className="mt-2 block text-sm text-stone">{e.note}</span>
                <span aria-hidden className="mt-6 block text-gallery transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mx-auto max-w-[1440px] px-6 md:px-10 py-24 md:py-32">
        <div className="flex items-end justify-between gap-6 mb-14">
          <div>
            <p className="eyebrow text-gallery">{site.collectionName}</p>
            <h2 className="font-display text-5xl md:text-6xl mt-4">Selected works</h2>
          </div>
          <Link href="/works/" className="link-underline text-sm tracking-[0.14em] uppercase">All works</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {works.map((a) => <ArtworkCard key={a.slug} a={a} />)}
        </div>
      </section>

      <section className="relative bg-charcoal text-titanium overflow-hidden">
        <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 py-24 md:py-32 grid md:grid-cols-2 gap-16">
          <div>
            <p className="eyebrow text-emerald">The virtual gallery</p>
            <h2 className="font-display text-5xl md:text-6xl mt-4 leading-tight">Six spaces, walked slowly.</h2>
            <p className="mt-6 text-titanium/70 max-w-md leading-relaxed">Curved white walls, cove light and a polished floor. Walk freely or follow a guided route through the rooms.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/gallery/" className="bg-titanium text-charcoal px-7 py-4 eyebrow !tracking-[0.22em]">Enter in 3D</Link>
              <Link href="/gallery/?view=2d" className="border border-titanium/30 px-7 py-4 eyebrow !tracking-[0.22em]">2D view</Link>
            </div>
          </div>
          <ol className="divide-y divide-titanium/10 border-y border-titanium/10">
            {rooms.map((r) => (
              <li key={r.id} className="py-5 flex gap-6 items-baseline">
                <span className="eyebrow text-titanium/40 w-16">{r.number ? `Room ${r.number}` : "Hall"}</span>
                <span className="font-display text-2xl">{r.title}</span>
                <span className="ml-auto text-sm text-titanium/50 hidden sm:block">{r.subtitle}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
