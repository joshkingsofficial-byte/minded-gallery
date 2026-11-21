"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Cinematic opening: deep-green painterly field, MINDED, then the tagline.
 * ~3.8s total, skippable, shown once per session, shortened for reduced motion.
 */
export default function Intro() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const finish = () => {
    try { sessionStorage.setItem("minded-intro-seen", "1"); } catch {}
    setLeaving(true);
    window.setTimeout(() => setGone(true), 900);
  };

  useEffect(() => {
    if (document.documentElement.dataset.introSeen === "1") { setGone(true); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(finish, reduce ? 1600 : 3800);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") finish(); };
    window.addEventListener("keydown", onKey);
    skipRef.current?.focus({ preventScroll: true });
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div id="minded-intro" data-testid="intro" role="dialog" aria-label="MINDED introduction" className={`fixed inset-0 z-[90] bg-forest text-titanium flex items-center justify-center overflow-hidden ${leaving ? "intro-out" : ""}`}>
      <div className="painterly" aria-hidden="true">
        <span style={{ background: "#205C45", width: "70vmax", height: "70vmax", left: "-20vmax", top: "-30vmax" }} />
        <span style={{ background: "#398565", width: "40vmax", height: "34vmax", right: "-10vmax", top: "30%", opacity: 0.35 }} />
        <span style={{ background: "#0a271c", width: "80vmax", height: "50vmax", left: "10%", bottom: "-30vmax" }} />
      </div>
      <div className="relative text-center px-6">
        <h1 className="intro-word font-display text-[clamp(3.5rem,13vw,11rem)] leading-none tracking-[0.32em] pl-[0.32em]">MINDED</h1>
        <p className="intro-tag eyebrow mt-8 text-titanium/80 !tracking-[0.34em] text-[0.62rem] md:text-xs">The Saboteur and Curator of Accidental Errors</p>
      </div>
      <button ref={skipRef} onClick={finish} data-testid="skip-intro" className="absolute bottom-8 right-8 eyebrow text-titanium/80 hover:text-titanium border border-titanium/30 hover:border-titanium/70 px-5 py-3 transition-colors">Skip intro</button>
    </div>
  );
}
