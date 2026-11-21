"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/works/", label: "Works" },
  { href: "/gallery/", label: "Virtual Gallery" },
  { href: "/archive/", label: "Archive" },
  { href: "/literature/", label: "Literature" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

export default function Header() {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const dark = path === "/";
  return (
    <header className={`relative z-30 ${dark ? "bg-forest text-titanium" : "bg-titanium text-charcoal border-b border-charcoal/10"}`}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-[0.32em] pl-[0.32em]" aria-label="MINDED, home">MINDED</Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-8 text-[0.8rem] tracking-[0.14em] uppercase">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={`link-underline pb-1 ${path.startsWith(n.href) ? "opacity-100 border-b border-current" : "opacity-75 hover:opacity-100"}`} aria-current={path.startsWith(n.href) ? "page" : undefined}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <button className="md:hidden eyebrow py-2" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)} data-testid="menu-toggle">{open ? "Close" : "Menu"}</button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className={`md:hidden px-6 pb-8 ${dark ? "bg-forest" : "bg-titanium"}`}>
          <ul className="flex flex-col gap-5 font-display text-3xl">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} onClick={() => setOpen(false)}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
