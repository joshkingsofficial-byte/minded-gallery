"use client";
import { useEffect, useState } from "react";

export default function ContactForm({ types, works }: { types: string[]; works: { slug: string; title: string }[] }) {
  const [type, setType] = useState(types[types.length - 1]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("work");
    const w = works.find((x) => x.slug === slug);
    if (w) { setType("General correspondence"); setMessage(`Enquiry about: ${w.title}\n\n`); }
  }, [works]);
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-8" aria-describedby="form-status" data-testid="contact-form">
      <div className="grid sm:grid-cols-2 gap-8">
        <label className="block"><span className="eyebrow text-stone">Name</span><input name="name" autoComplete="name" className="mt-3 w-full bg-transparent border-b border-charcoal/30 focus:border-forest outline-none py-3 text-lg" /></label>
        <label className="block"><span className="eyebrow text-stone">Email</span><input name="email" type="email" autoComplete="email" className="mt-3 w-full bg-transparent border-b border-charcoal/30 focus:border-forest outline-none py-3 text-lg" /></label>
      </div>
      <label className="block"><span className="eyebrow text-stone">Enquiry type</span>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} data-testid="enquiry-type" className="mt-3 w-full bg-transparent border-b border-charcoal/30 focus:border-forest outline-none py-3 text-lg">
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block"><span className="eyebrow text-stone">Message</span><textarea name="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} data-testid="message" className="mt-3 w-full bg-transparent border border-charcoal/20 focus:border-forest outline-none p-4 text-lg" /></label>
      {/* Honeypot field for spam protection once the form is live (Phase 3). */}
      <div aria-hidden className="hidden"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div id="form-status" role="status" className="border-l-2 border-gallery bg-warm px-5 py-4 text-sm leading-relaxed" data-testid="form-notice">
        <strong className="font-medium">The contact form goes live in Phase 3.</strong> This preview does not send messages, and nothing you type here is stored or transmitted.
      </div>
      <button type="submit" disabled aria-disabled="true" data-testid="submit" className="bg-charcoal/30 text-titanium px-8 py-4 eyebrow !tracking-[0.22em] cursor-not-allowed">Sending opens in Phase 3</button>
    </form>
  );
}
