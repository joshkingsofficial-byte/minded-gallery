import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArtworkVisual from "@/components/ui/ArtworkVisual";
import Figure, { Placeholder } from "@/components/ui/Figure";
import Label from "@/components/ui/Label";
import { asset } from "@/lib/config";
import { aura, getAllArtworks, getArtwork, getSeries, imagesWithheld } from "@/lib/content";

export function generateStaticParams() {
  return getAllArtworks().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArtwork(slug);
  if (!a) return {};
  const img = !imagesWithheld(a) ? (a.images[0] || (a.series ? getSeries(a)[0]?.images[0] : undefined)) : undefined;
  const description = `${a.title} (${a.year}) by MINDED. ${a.statement} ${a.medium}. Status: ${a.status}.`;
  return {
    title: `${a.title} (${a.year})`,
    description,
    alternates: { canonical: `/works/${a.slug}/` },
    openGraph: { title: `${a.title}: MINDED`, description, type: "article", images: img ? [{ url: asset(img.src), alt: img.alt }] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title: `${a.title}: MINDED`, description },
  };
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArtwork(slug);
  if (!a) notFound();
  const parent = a.parent ? getArtwork(a.parent) : undefined;
  const series = getSeries(a);
  const details = a.images.filter((i, idx) => !(idx === 0 && i.role === "deck"));
  const isAura = a.slug === "aura-001";
  const jsonLd = { "@context": "https://schema.org", "@type": "VisualArtwork", name: a.title, dateCreated: a.year, artMedium: a.medium, creator: { "@type": "Person", name: "Dammy Ojo", alternateName: "MINDED" }, description: a.statement };

  return (
    <article className="mx-auto max-w-[1440px] px-6 md:px-10 py-16 md:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-stone mb-10">
        <Link className="link-underline" href="/works/">Works</Link>
        {parent && <> <span aria-hidden>/</span> <Link className="link-underline" href={`/works/${parent.slug}/`}>{parent.title}</Link></>}
        <span aria-hidden> / </span><span aria-current="page">{a.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-20 items-start">
        <div>{isAura ? <Placeholder dark className="h-[62vh] min-h-[420px] w-full" label="Prototype startup video to be supplied" sub="The AURA 001 startup experience will be shown here once the artist supplies the video." /> : <ArtworkVisual a={a} size="hero" priority />}</div>
        <div className="lg:sticky lg:top-10">
          <Label a={a} />
          <p className="font-display text-3xl leading-snug mt-10 italic">{a.statement}</p>
          <div className="mt-8 space-y-4 text-[1.02rem] leading-relaxed text-charcoal/85">
            {a.description.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {a.mediumNote && <p className="mt-4 text-sm text-stone">{a.mediumNote}</p>}
          {a.credits && <p className="mt-4 text-sm text-stone">{a.credits}</p>}
          {a.presentation && <p className="mt-1 text-sm text-stone">Presentation: {a.presentation}</p>}
          {a.rightsPending && <p className="mt-6 text-sm border-l-2 border-gallery pl-4 text-charcoal/80" data-testid="rights-note">{a.rightsNote}</p>}

          {a.editions.length > 0 && (
            <section className="mt-10 border-t border-charcoal/10 pt-8">
              <h2 className="eyebrow text-gallery">Editions</h2>
              <ul className="mt-4 divide-y divide-charcoal/10">
                {a.editions.map((e, i) => (
                  <li key={i} className="py-3 flex justify-between gap-6 text-sm"><span>{e.type}</span><span className="text-stone text-right">{e.detail}</span></li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-stone">Availability and pricing on enquiry. Nothing is sold through this website.</p>
            </section>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/contact/?work=${a.slug}`} data-testid="enquire" className="bg-forest text-titanium px-7 py-4 eyebrow !tracking-[0.22em] hover:bg-gallery transition-colors">Enquire</Link>
            <Link href={`/gallery/?work=${a.parent || a.slug}`} className="border border-charcoal/25 px-7 py-4 eyebrow !tracking-[0.22em] hover:border-charcoal transition-colors">View in gallery</Link>
          </div>
        </div>
      </div>

      {series.length > 0 && (
        <section className="mt-28" aria-labelledby="series-h">
          <h2 id="series-h" className="font-display text-4xl">The six studies</h2>
          <p className="mt-3 text-stone">Viewed together above; each study individually below.</p>
          <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {series.map((s) => (
              <li key={s.slug}>
                <Link href={`/works/${s.slug}/`} className="group block" data-testid="series-item">
                  <div className="bg-warm h-72 flex items-center justify-center">
                    {s.images[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={asset(s.images[0].src)} alt={s.images[0].alt} loading="lazy" className="h-[85%] w-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]" />}
                  </div>
                  <p className="mt-3 text-sm tracking-[0.1em]">{s.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAura && (
        <section className="mt-28 grid lg:grid-cols-2 gap-16" aria-label="AURA 001 project">
          <div>
            <p className="font-display text-4xl md:text-5xl leading-tight">{aura.line}</p>
            <div className="mt-8 space-y-4 text-charcoal/85 leading-relaxed">{aura.idea.map((p, i) => <p key={i}>{p}</p>)}</div>
            <h2 className="eyebrow text-gallery mt-12">Principles</h2>
            <ul className="mt-4 space-y-2">{aura.principles.map((p) => <li key={p} className="font-display text-2xl">{p}</li>)}</ul>
          </div>
          <div className="space-y-10">
            <div className="grid sm:grid-cols-2 gap-6">
              {aura.states.map((s) => (
                <div key={s.name} className="border border-charcoal/15 p-6">
                  <p className="font-display text-3xl tracking-[0.2em]">{s.name}</p>
                  <p className="eyebrow text-stone mt-1">{s.role}</p>
                  <ul className="mt-4 space-y-2 text-sm text-charcoal/80">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className="text-charcoal/80 leading-relaxed">{aura.transition}</p>
            <div>
              <h2 className="eyebrow text-gallery">What exists today</h2>
              <ul className="mt-4 space-y-2 text-sm text-charcoal/85 list-disc pl-5">{aura.existsToday.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <div>
              <h2 className="eyebrow text-gallery">Still in development</h2>
              <ul className="mt-4 divide-y divide-charcoal/10" data-testid="aura-in-development">{aura.inDevelopment.map((d) => <li key={d.area} className="py-3 grid grid-cols-[9rem_1fr] gap-4 text-sm"><span className="font-medium">{d.area}</span><span className="text-charcoal/80">{d.position}</span></li>)}</ul>
            </div>
            <p className="font-display italic text-2xl">{aura.rule}</p>
          </div>
        </section>
      )}

      {details.length > 0 && (
        <section className="mt-28" aria-labelledby="images-h">
          <h2 id="images-h" className="font-display text-4xl">{isAura ? "Prototype documentation and concept visuals" : "Details"}</h2>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {details.map((i) => <Figure key={i.src} src={i.src} alt={i.alt} caption={i.caption} kind={i.kind} imgClassName="max-h-[520px]" />)}
          </div>
        </section>
      )}

      {a.process && a.process.length > 0 && (
        <section className="mt-28" aria-labelledby="process-h">
          <h2 id="process-h" className="font-display text-4xl">Process</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-10">
            {a.process.map((i) => <Figure key={i.src} src={i.src} alt={i.alt} caption={i.caption} kind={i.kind} />)}
          </div>
        </section>
      )}

      {a.toSupply && a.toSupply.length > 0 && (
        <section className="mt-28 border-t border-charcoal/10 pt-10" aria-labelledby="supply-h">
          <h2 id="supply-h" className="eyebrow text-stone">Documentation to follow</h2>
          <ul className="mt-4 text-sm text-stone space-y-1">{a.toSupply.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}
    </article>
  );
}
