"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getArtwork, getRooms } from "@/lib/content";
import { roomEntry, type Hang } from "@/lib/gallery/architecture";
import { nav, startGlide, teleport } from "@/lib/gallery/nav";
import { useUI, type Selection } from "@/lib/gallery/store";
import { buildTour, hangsById } from "@/lib/gallery/tour";
import DetailPanel from "./DetailPanel";
import Gallery2D from "./Gallery2D";
import { loadFonts } from "./textures";
import { setAmbient } from "./sound";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export default function GalleryApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="fixed inset-0 bg-titanium" />;
  return createPortal(<GalleryInner />, document.body);
}

function GalleryInner() {
  const ui = useUI();
  const [view, setView] = useState<"3d" | "2d" | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  const [touch, setTouch] = useState(false);
  const [hint, setHint] = useState(true);
  const rooms = getRooms();
  const tour = useMemo(() => buildTour(), []);
  const hangs = useMemo(() => hangsById(), []);
  const pendingWork = useRef<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const gl = hasWebGL();
    setWebgl(gl);
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    nav.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pendingWork.current = q.get("work");
    setView(!gl || q.get("view") === "2d" ? "2d" : "3d");
    loadFonts().then(() => setFontsReady(true));
    teleport(roomEntry(0));
    return () => { setAmbient(false); useUI.getState().set({ started: false, ready: false, selection: null, mode: "free", sound: false, auraMirror: false }); };
  }, []);

  const fadeTo = useCallback((fn: () => void) => {
    if (nav.reduceMotion) { fn(); return; }
    useUI.getState().set({ fading: true });
    window.setTimeout(() => { fn(); window.setTimeout(() => useUI.getState().set({ fading: false }), 60); }, 380);
  }, []);

  const goStop = useCallback((i: number) => {
    const s = tour[(i + tour.length) % tour.length];
    const idx = (i + tour.length) % tour.length;
    useUI.getState().set({ tourIndex: idx, selection: null });
    if (s.room === useUI.getState().roomIndex) startGlide(s, 2.2);
    else fadeTo(() => teleport(s));
  }, [tour, fadeTo]);

  const goToRoom = useCallback((i: number) => {
    useUI.getState().set({ roomsOpen: false, selection: null });
    const first = tour.findIndex((s) => s.room === i);
    if (useUI.getState().mode === "guided" && first >= 0) { goStop(first); return; }
    fadeTo(() => teleport(roomEntry(i)));
  }, [tour, goStop, fadeTo]);

  const openHang = useCallback((h: Hang, child?: string) => {
    const sel: Selection = { type: "artwork", slug: child || h.placement.artwork, image: h.placement.display === "doc" ? h.placement.image : undefined, hangId: h.id };
    const d = Math.hypot(h.view.x - nav.x, h.view.z - nav.z);
    if (d > 1.2 && h.roomId === rooms[useUI.getState().roomIndex]?.id) startGlide(h.view, Math.min(2.2, 0.8 + d * 0.25), () => useUI.getState().set({ selection: sel }));
    else if (h.roomId !== rooms[useUI.getState().roomIndex]?.id) fadeTo(() => { teleport(h.view); useUI.getState().set({ selection: sel }); });
    else useUI.getState().set({ selection: sel });
  }, [rooms, fadeTo]);

  const api = useMemo(() => ({
    onSelectHang: openHang,
    onSelectArchive: (section: number, entry: number) => useUI.getState().set({ selection: { type: "archive", section, entry } }),
    goToRoom,
  }), [openHang, goToRoom]);

  // keyboard
  useEffect(() => {
    if (view !== "3d" || !ui.started) return;
    const typing = (e: KeyboardEvent) => (e.target as HTMLElement)?.closest?.("input,textarea,select");
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const k = e.key.toLowerCase();
      const st = useUI.getState();
      if (st.selection) return;
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) {
        if (st.mode === "guided") { if (k === "arrowright" || k === "d") goStop(st.tourIndex + 1); if (k === "arrowleft" || k === "a") goStop(st.tourIndex - 1); e.preventDefault(); return; }
        nav.keys.add(k); setHint(false); e.preventDefault();
      }
      if ((k === "e" || k === "enter") && st.near && !(e.target as HTMLElement)?.closest?.("button,a")) { const h = hangs.get(st.near.hangId); if (h) openHang(h); }
    };
    const up = (e: KeyboardEvent) => nav.keys.delete(e.key.toLowerCase());
    const blur = () => nav.keys.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [view, ui.started, hangs, openHang, goStop]);

  useEffect(() => { nav.enabled = !ui.selection && ui.mode === "free"; }, [ui.selection, ui.mode]);
  useEffect(() => { if (!hint) return; const t = setTimeout(() => setHint(false), 12000); return () => clearTimeout(t); }, [hint, ui.started]);

  // expose for automated tests
  useEffect(() => {
    (window as unknown as { __minded: unknown }).__minded = { nav, ui: useUI, tour, hangs: [...hangs.values()].map((h) => ({ id: h.id, view: h.view, roomId: h.roomId })), goToRoom, goStop, openHang: (id: string) => { const h = hangs.get(id); if (h) openHang(h); } };
  }, [tour, hangs, goToRoom, goStop, openHang]);

  const start = (mode: "free" | "guided") => {
    useUI.getState().set({ started: true, mode });
    if (mode === "guided") goStop(0);
    const w = pendingWork.current;
    if (w) {
      pendingWork.current = null;
      const h = [...hangs.values()].find((x) => x.placement.artwork === w && x.placement.display !== "doc");
      if (h) setTimeout(() => openHang(h), 100);
    }
  };

  const toggleMode = () => {
    const m = ui.mode === "free" ? "guided" : "free";
    useUI.getState().set({ mode: m });
    if (m === "guided") {
      // nearest stop in current room
      let best = tour.findIndex((s) => s.room === ui.roomIndex);
      let bd = Infinity;
      tour.forEach((s, i) => { const d = Math.hypot(s.x - nav.x, s.z - nav.z); if (s.room === ui.roomIndex && d < bd) { bd = d; best = i; } });
      goStop(Math.max(0, best));
    }
  };

  const toggleSound = () => { const on = !ui.sound; setAmbient(on); useUI.getState().set({ sound: on }); };
  const nearArt = ui.near ? getArtwork(ui.near.label) : null;
  const nearHang = ui.near ? hangs.get(ui.near.hangId) : null;
  const stop = tour[ui.tourIndex];
  const room = rooms[ui.roomIndex];

  if (view === null) return <div className="fixed inset-0 bg-titanium" />;

  const topBar = (
    <div className="absolute top-0 inset-x-0 z-40 flex items-start justify-between p-3 md:p-5 pointer-events-none">
      <div className="pointer-events-auto bg-titanium/85 backdrop-blur px-4 py-3">
        <Link href="/" className="font-display tracking-[0.3em] text-lg">MINDED</Link>
        {view === "3d" && <p className="eyebrow !text-[0.6rem] text-stone mt-1" data-testid="room-name" aria-live="polite">{room?.number ? `Room ${room.number} · ${room.title}` : room?.title}</p>}
      </div>
      <nav aria-label="Gallery controls" className="pointer-events-auto flex flex-wrap justify-end gap-2 max-w-[70%]">
        {view === "3d" && ui.started && (
          <>
            <button onClick={() => useUI.getState().set({ roomsOpen: !ui.roomsOpen })} aria-expanded={ui.roomsOpen} className="hud-btn" data-testid="rooms-btn">Rooms</button>
            <button onClick={toggleMode} aria-pressed={ui.mode === "guided"} className="hud-btn" data-testid="mode-btn">{ui.mode === "guided" ? "Free mode" : "Guided tour"}</button>
            <button onClick={toggleSound} aria-pressed={ui.sound} className="hud-btn" data-testid="sound-btn">{ui.sound ? "Sound on" : "Sound off"}</button>
          </>
        )}
        {webgl && <button onClick={() => { useUI.getState().set({ selection: null }); setView(view === "3d" ? "2d" : "3d"); }} className="hud-btn" data-testid="view-toggle">{view === "3d" ? "2D view" : "3D view"}</button>}
        <Link href="/" className="hud-btn" data-testid="return-home">Return home</Link>
      </nav>
    </div>
  );

  if (view === "2d") {
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-titanium">
        <style>{hudCss}</style>
        {topBar}
        <Gallery2D onSelect={(s) => useUI.getState().set({ selection: s })} notice={!webgl ? "Your browser or device doesn't support 3D graphics (WebGL), so the gallery is shown in 2D." : undefined} />
        {ui.selection && <DetailPanel sel={ui.selection} onClose={() => useUI.getState().set({ selection: null })} />}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#e9e9e4] select-none" data-testid="gallery-3d">
      <style>{hudCss}</style>
      {fontsReady && <Scene api={api} quality={touch ? "low" : "high"} onReady={() => useUI.getState().set({ ready: true })} />}
      <div className={`absolute inset-0 z-30 bg-titanium pointer-events-none transition-opacity duration-300 ${ui.fading ? "opacity-100" : "opacity-0"}`} aria-hidden />
      {topBar}

      {ui.roomsOpen && (
        <div className="absolute right-3 md:right-5 top-20 z-50 bg-titanium shadow-xl w-72" role="menu" data-testid="rooms-menu">
          {rooms.map((r, i) => (
            <button key={r.id} role="menuitem" onClick={() => goToRoom(i)} className={`block w-full text-left px-5 py-3 border-b border-charcoal/10 hover:bg-warm ${i === ui.roomIndex ? "bg-warm" : ""}`} data-testid={`room-item-${i}`}>
              <span className="eyebrow !text-[0.6rem] text-stone">{r.number ? `Room ${r.number}` : "Entrance"}</span>
              <span className="block font-display text-xl">{r.title}</span>
            </button>
          ))}
        </div>
      )}

      {!ui.started && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-titanium/70 backdrop-blur-sm p-6" data-testid="start-overlay">
          <div className="bg-titanium max-w-lg w-full p-8 md:p-10 shadow-2xl">
            <p className="eyebrow text-gallery">Virtual gallery</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3">MINDED: First Rooms</h1>
            <p className="mt-4 text-stone text-sm leading-relaxed">An Entrance Hall and five rooms. Walk freely or follow a guided route. Images marked as visualisations are artist-supplied mockups.</p>
            <ul className="mt-6 text-sm space-y-1.5 text-charcoal/80">
              {touch ? (<><li>Left thumb: joystick to walk</li><li>Drag anywhere else to look around</li><li>Tap the floor to walk there; tap a work to view it</li></>) : (<><li><b className="font-medium">W A S D</b> or arrow keys to walk · Shift to walk faster</li><li>Drag to look around</li><li>Click the floor to walk there; click a work to view it</li><li><b className="font-medium">E</b> to view the nearest work · Esc to close</li></>)}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button disabled={!ui.ready} onClick={() => start(touch ? "guided" : "free")} className="bg-forest text-titanium px-6 py-4 eyebrow !tracking-[0.2em] disabled:opacity-40" data-testid={touch ? "start-guided" : "start-free"}>{ui.ready ? (touch ? "Begin guided tour" : "Explore freely") : "Preparing the gallery…"}</button>
              <button disabled={!ui.ready} onClick={() => start(touch ? "free" : "guided")} className="border border-charcoal/25 px-6 py-4 eyebrow !tracking-[0.2em] disabled:opacity-40" data-testid={touch ? "start-free" : "start-guided"}>{touch ? "Explore freely" : "Guided tour"}</button>
            </div>
            {!ui.ready && <div className="mt-6 h-px bg-charcoal/10 overflow-hidden"><div className="h-full w-1/3 bg-gallery animate-[loading_1.2s_ease-in-out_infinite]" /></div>}
            <button onClick={() => setView("2d")} className="mt-6 text-sm link-underline text-stone">Prefer not to use 3D? Open the 2D view</button>
          </div>
        </div>
      )}

      {ui.started && ui.mode === "free" && hint && !touch && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-charcoal/75 text-titanium text-xs tracking-wide px-4 py-2 pointer-events-none">WASD / arrows to walk · drag to look · click the floor to walk · click a work to view</p>
      )}

      {ui.started && ui.mode === "free" && nearHang && !ui.selection && (
        <div className="absolute bottom-6 md:bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-titanium/95 shadow-lg pl-4 pr-1 py-1" data-testid="near-prompt">
          <span className="text-sm"><span className="font-display text-lg">{nearHang.placement.display === "aura-simulation" ? "AURA 001 · SIMULATION" : nearArt?.title}</span></span>
          {nearHang.placement.display === "aura-simulation" && (
            <button className="hud-btn !shadow-none" onClick={() => useUI.getState().set({ auraMirror: !ui.auraMirror })} data-testid="aura-toggle">{ui.auraMirror ? "Return to ART" : "Invite MIRROR"}</button>
          )}
          <button className="hud-btn !shadow-none !bg-forest !text-titanium" onClick={() => openHang(nearHang)} data-testid="near-view">View{touch ? "" : " (E)"}</button>
        </div>
      )}

      {ui.started && ui.mode === "guided" && stop && !ui.selection && (
        <div className="absolute bottom-0 inset-x-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:inset-x-auto md:w-[640px] z-40 bg-titanium/95 shadow-xl p-4 md:p-5" data-testid="tour-bar">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow !text-[0.6rem] text-stone">Guided tour · {ui.tourIndex + 1} / {tour.length}</p>
            <button className="eyebrow !text-[0.6rem] link-underline" onClick={toggleMode}>Exit tour</button>
          </div>
          <p className="font-display text-2xl mt-1" data-testid="tour-title">{stop.title}</p>
          <p className="text-sm text-stone mt-1 line-clamp-2">{stop.caption}</p>
          <div className="mt-3 flex gap-2">
            <button className="hud-btn" onClick={() => goStop(ui.tourIndex - 1)} data-testid="tour-prev">Previous</button>
            {stop.hangId && <button className="hud-btn !bg-forest !text-titanium" onClick={() => { const h = hangs.get(stop.hangId!); if (h) useUI.getState().set({ selection: { type: "artwork", slug: h.placement.artwork, image: h.placement.display === "doc" ? h.placement.image : undefined } }); }} data-testid="tour-view">View work</button>}
            {stop.hangId?.includes("aura-001:0") && <button className="hud-btn" onClick={() => useUI.getState().set({ auraMirror: !ui.auraMirror })}>{ui.auraMirror ? "Return to ART" : "Invite MIRROR"}</button>}
            <button className="hud-btn ml-auto" onClick={() => goStop(ui.tourIndex + 1)} data-testid="tour-next">Next</button>
          </div>
        </div>
      )}

      {ui.started && touch && ui.mode === "free" && <Joystick />}

      {ui.selection && <DetailPanel sel={ui.selection} onClose={() => useUI.getState().set({ selection: null })} />}
    </div>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const id = useRef<number | null>(null);
  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    nav.joy.x = x; nav.joy.y = y; setKnob({ x, y });
  };
  const end = () => { id.current = null; nav.joy.x = 0; nav.joy.y = 0; setKnob({ x: 0, y: 0 }); };
  return (
    <div ref={base} data-testid="joystick" aria-label="Movement joystick" role="application"
      className="absolute left-6 bottom-8 z-40 w-32 h-32 rounded-full bg-titanium/60 border border-charcoal/20 backdrop-blur touch-none"
      onPointerDown={(e) => { id.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); update(e); e.stopPropagation(); }}
      onPointerMove={(e) => { if (id.current === e.pointerId) update(e); }}
      onPointerUp={end} onPointerCancel={end}>
      <div className="absolute w-12 h-12 rounded-full bg-forest/85 left-1/2 top-1/2 pointer-events-none" style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${knob.y * 40}px))` }} />
    </div>
  );
}

const hudCss = `.hud-btn{background:rgba(247,247,242,.92);color:#171B19;padding:.6rem .9rem;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 2px 10px rgba(0,0,0,.06);border:1px solid rgba(23,27,25,.08);transition:background .3s}.hud-btn:hover{background:#F0EEE6}@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`;
