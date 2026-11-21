import type { Metadata } from "next";
import ContactForm from "@/components/ui/ContactForm";
import { getAllArtworks, site } from "@/lib/content";

export const metadata: Metadata = { title: "Contact", description: "Gallery enquiries, exhibition opportunities, commissions, collaborations, press and general correspondence for MINDED." };

export default function Contact() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-20 md:py-28 grid lg:grid-cols-[1fr_1.3fr] gap-16">
      <div>
        <p className="eyebrow text-gallery">Contact</p>
        <h1 className="font-display text-6xl md:text-7xl mt-4">Correspondence</h1>
        <p className="mt-6 text-stone leading-relaxed max-w-md">For gallery enquiries, exhibition opportunities, commissions, collaborations, press and general correspondence.</p>
        <ul className="mt-10 space-y-2 font-display text-2xl text-charcoal/80">{site.enquiryTypes.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <ContactForm types={site.enquiryTypes} works={getAllArtworks().map((a) => ({ slug: a.slug, title: a.title }))} />
    </div>
  );
}
