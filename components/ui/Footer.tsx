import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-titanium/80 mt-auto">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl tracking-[0.3em] text-titanium">MINDED</p>
          <p className="eyebrow mt-3 text-titanium/60">The Saboteur and Curator of Accidental Errors</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-titanium/60">The artistic identity of Dammy Ojo. Images marked &ldquo;Visualisation&rdquo; are artist-supplied mockups, not photographs of finished physical works.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2 text-sm">
            <li><Link className="link-underline" href="/works/">Works</Link></li>
            <li><Link className="link-underline" href="/gallery/">Virtual Gallery</Link></li>
            <li><Link className="link-underline" href="/gallery/?view=2d">Gallery (2D view)</Link></li>
            <li><Link className="link-underline" href="/archive/">Archive / Process</Link></li>
            <li><Link className="link-underline" href="/literature/">Literature</Link></li>
          </ul>
        </nav>
        <div className="text-sm space-y-2">
          <p><Link className="link-underline" href="/about/">About MINDED</Link></p>
          <p><Link className="link-underline" href="/contact/">Contact</Link></p>
          <p className="pt-4 text-titanium/45 text-xs leading-relaxed">Preview build: Phases 1–2 (visual foundation and virtual gallery). Content management arrives in Phase 3.</p>
        </div>
      </div>
      <div className="border-t border-titanium/10 py-5 text-center text-xs text-titanium/40">© 2026 Dammy Ojo / MINDED. All artworks and images are the property of their respective rights holders.</div>
    </footer>
  );
}
