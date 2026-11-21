import type { Metadata } from "next";
import Link from "next/link";
import Painterly from "@/components/ui/Painterly";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "About", description: "MINDED is the contemporary artistic identity of Dammy Ojo. The Saboteur and Curator of Accidental Errors." };

export default function About() {
  return (
    <>
      <section className="relative bg-forest text-titanium overflow-hidden">
        <Painterly />
        <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 py-24 md:py-36">
          <p className="eyebrow text-titanium/70">About</p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] leading-[1.02] mt-6 max-w-5xl">The Saboteur and Curator of Accidental Errors</h1>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 py-24 grid md:grid-cols-[1fr_1.4fr] gap-14">
        <div>
          <p className="eyebrow text-gallery">The artist</p>
          <p className="font-display text-4xl mt-4">Dammy Ojo</p>
          <p className="mt-2 text-stone">working as MINDED</p>
        </div>
        <div className="space-y-8 text-lg leading-relaxed text-charcoal/85 max-w-2xl">
          {site.philosophy.map((p, i) => <p key={i} className={i === 0 ? "font-display text-3xl leading-snug text-charcoal" : ""}>{p}</p>)}
        </div>
      </section>
      <section className="border-t border-charcoal/10">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-24 grid md:grid-cols-[1fr_1.4fr] gap-14">
          <p className="eyebrow text-gallery">Practice</p>
          <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-4 font-display text-3xl">
            {["Photography", "Mixed media", "Sculptural objects", "Interactive technology", "Digital experiences", "Literary expression"].map((d) => <li key={d} className="border-b border-charcoal/10 pb-4">{d}</li>)}
          </ul>
        </div>
      </section>
      <section className="border-t border-charcoal/10 bg-warm">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-24 grid md:grid-cols-[1fr_1.4fr] gap-14">
          <p className="eyebrow text-gallery">Long-term vision</p>
          <div className="max-w-2xl">
            <p className="text-lg leading-relaxed text-charcoal/85">{site.vision}</p>
            <p className="mt-10 text-sm text-stone">A fuller biography, in the artist&rsquo;s own words, will be added here.</p>
            <div className="mt-10 flex gap-4"><Link href="/works/" className="link-underline eyebrow">See the works</Link><Link href="/contact/" className="link-underline eyebrow">Get in touch</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
