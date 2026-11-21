"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { asset } from "@/lib/config";
import { getArtwork, getSeries, imagesWithheld } from "@/lib/content";
import type { Hang } from "@/lib/gallery/architecture";
import { useUI } from "@/lib/gallery/store";
import type { Artwork } from "@/lib/types";
import { canvasTexture, fonts, labelTexture, placeholderTexture, spaced, wrapText } from "./textures";

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

export function useTex(src?: string | null): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(() => (src && cache.get(src)) || null);
  useEffect(() => {
    if (!src) return;
    if (cache.has(src)) { setTex(cache.get(src)!); return; }
    let live = true;
    loader.load(asset(src), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
      cache.set(src, t); if (live) setTex(t);
    });
    return () => { live = false; };
  }, [src]);
  return tex;
}

function deckShape(w: number, h: number) {
  const r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, -h / 2 + r);
  s.lineTo(-r, h / 2 - r);
  s.absarc(0, h / 2 - r, r, Math.PI, 0, true);
  s.lineTo(r, -h / 2 + r);
  s.absarc(0, -h / 2 + r, r, 0, Math.PI, true);
  return s;
}

function deckGeoms(w: number, h: number, inset = 0.035) {
  const shape = deckShape(w, h);
  const face = new THREE.ShapeGeometry(shape, 24);
  const pos = face.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + w / 2) / w, v = (pos.getY(i) + h / 2) / h;
    uv[i * 2] = inset + (1 - 2 * inset) * u;
    uv[i * 2 + 1] = inset * 0.5 + (1 - inset) * v;
  }
  face.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false, curveSegments: 24 });
  return { face, body };
}

export function Deck({ w = 0.26, h = 1.0, tex, onClick, name }: { w?: number; h?: number; tex: THREE.Texture | null; onClick?: (e: ThreeEvent<MouseEvent>) => void; name?: string }) {
  const g = useMemo(() => deckGeoms(w, h), [w, h]);
  return (
    <group onClick={onClick} name={name}>
      <mesh geometry={g.body} position={[0, 0, -0.016]}>
        <meshStandardMaterial color="#d4b48a" roughness={0.7} />
      </mesh>
      <mesh geometry={g.face} position={[0, 0, 0.0005]}>
        {tex ? <meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} /> : <meshStandardMaterial color="#dcdad3" roughness={0.9} />}
      </mesh>
    </group>
  );
}

/** Black shadowbox frame with warm-white backing (after the artist's collection wall). */
export function ShadowBox({ w, h, depth = 0.12, border = 0.05, backing = "#e4e2da" }: { w: number; h: number; depth?: number; border?: number; backing?: string }) {
  const black = <meshStandardMaterial color="#121413" roughness={0.55} />;
  return (
    <group>
      <mesh position={[0, 0, -depth / 2 + 0.005]}><planeGeometry args={[w, h]} /><meshBasicMaterial color={backing} /></mesh>
      <mesh position={[0, h / 2 - border / 2, 0]}><boxGeometry args={[w + border, border, depth]} />{black}</mesh>
      <mesh position={[0, -h / 2 + border / 2, 0]}><boxGeometry args={[w + border, border, depth]} />{black}</mesh>
      <mesh position={[-w / 2, 0, 0]}><boxGeometry args={[border, h, depth]} />{black}</mesh>
      <mesh position={[w / 2, 0, 0]}><boxGeometry args={[border, h, depth]} />{black}</mesh>
    </group>
  );
}

function LabelPlane({ a, x, y = 1.25, note }: { a: Artwork; x: number; y?: number; note?: string }) {
  const tex = useMemo(() => labelTexture({ title: a.title, year: a.year, medium: a.medium, dimensions: a.dimensions, status: a.status, note }), [a, note]);
  return (
    <mesh position={[x, y - 1.6, 0.005]}>
      <planeGeometry args={[0.36, 0.456]} />
      <meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} />
    </mesh>
  );
}

function deckTex(a: Artwork) {
  return a.images.find((i) => i.role === "deck")?.src ?? a.images[0]?.src ?? null;
}

const rightsPendingTex = () => placeholderTexture("Image rights pending", "Underlying photograph by Andre Pfeifer. Shown once rights are confirmed.", 400, 1500);

export function HangDisplay({ hang, onSelect }: { hang: Hang; onSelect: (h: Hang, child?: string) => void }) {
  const p = hang.placement;
  const a = getArtwork(p.artwork)!;
  const withheld = imagesWithheld(a);
  const click = (child?: string) => (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); onSelect(hang, child); };
  const over = () => (document.body.style.cursor = "pointer");
  const out = () => (document.body.style.cursor = "");
  const visualSrc = !withheld ? deckTex(a) : null;
  const tex = useTex(p.display === "deck-frame" ? visualSrc : p.display === "image-frame" ? a.images[0]?.src : p.display === "doc" ? a.images[p.image ?? 0]?.src : p.display === "deck-grid-3x3" && !withheld ? a.images[1]?.src : null);
  const pending = useMemo(() => (withheld ? rightsPendingTex() : null), [withheld]);
  const pendingWide = useMemo(() => (withheld && p.display === "deck-grid-3x3" ? placeholderTexture("Image rights pending", "JUSTICE: nine-deck installation (3 × 3). The image will appear once rights are confirmed.", 900, 350) : null), [withheld, p.display]);
  let body: React.ReactNode = null;
  let labelX = 0.74;
  let note: string | undefined = withheld ? "Image withheld pending rights" : a.images[0]?.kind === "visualisation" ? "Visualisation: artist-supplied mockup" : undefined;

  if (p.display === "deck-frame") {
    body = (<group><ShadowBox w={0.62} h={1.34} /><group position={[0, 0, -0.03]}><Deck tex={tex || pending} onClick={click()} /></group></group>);
  } else if (p.display === "deck-set") {
    const kids = getSeries(a);
    body = (
      <group>
        <ShadowBox w={3.2} h={1.42} />
        {kids.map((k, i) => <SetDeck key={k.slug} k={k} x={(i - 2.5) * 0.5} onClick={click(k.slug)} />)}
      </group>
    );
    labelX = 1.95;
  } else if (p.display === "deck-grid-3x3") {
    body = withheld ? (
      <group onClick={click()}>
        <ShadowBox w={1.06} h={2.16} />
        {Array.from({ length: 9 }).map((_, i) => (
          <group key={i} position={[((i % 3) - 1) * 0.31, (1 - Math.floor(i / 3)) * 0.68, -0.03]}><Deck w={0.26} h={0.64} tex={null} /></group>
        ))}
        <mesh position={[0, 0, 0.02]}><planeGeometry args={[0.92, 0.36]} /><meshBasicMaterial map={pendingWide} toneMapped={false} /></mesh>
      </group>
    ) : (
      <group onClick={click()}><ShadowBox w={1.2} h={1.77} /><mesh position={[0, 0, -0.03]}><planeGeometry args={[1.12, 1.66]} /><meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} /></mesh></group>
    );
    labelX = 0.85;
  } else if (p.display === "image-frame") {
    const img = a.images[0];
    const asp = tex ? (tex.image as HTMLImageElement).width / (tex.image as HTMLImageElement).height : 0.92;
    const h = 1.25, w = h * asp;
    body = (<group onClick={click()}><mesh position={[0, 0, -0.02]}><boxGeometry args={[w + 0.06, h + 0.06, 0.02]} /><meshStandardMaterial color="#121413" /></mesh><mesh><planeGeometry args={[w, h]} /><meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} /></mesh></group>);
    labelX = w / 2 + 0.3;
    note = img?.kind === "visualisation" ? "Visualisation: artist-supplied mockup" : undefined;
  } else if (p.display === "doc") {
    const img = a.images[p.image ?? 0];
    const asp = tex ? (tex.image as HTMLImageElement).width / (tex.image as HTMLImageElement).height : 1.5;
    const w = 1.5, h = w / asp;
    body = (
      <group onClick={click()}>
        <mesh position={[0, 0, -0.01]}><planeGeometry args={[w + 0.16, h + 0.16]} /><meshStandardMaterial color="#fbfbf8" /></mesh>
        <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} /></mesh>
        <Caption y={-h / 2 - 0.22} text={img?.caption || ""} kind={img?.kind === "documentation" ? "PROTOTYPE DOCUMENTATION" : "CONCEPT VISUAL"} />
      </group>
    );
    return (
      <group position={hang.pos} rotation={[0, hang.rotY, 0]} onPointerOver={over} onPointerOut={out} name={`hang-${hang.id}`}>{body}</group>
    );
  } else if (p.display === "aura-simulation") {
    return (
      <group position={hang.pos} rotation={[0, hang.rotY, 0]} name={`hang-${hang.id}`}>
        <AuraSimulation onToggle={(e) => { if (e.delta > 6) return; e.stopPropagation(); const ui = useUI.getState(); ui.set({ auraMirror: !ui.auraMirror }); }} onOver={over} onOut={out} />
        <group onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onSelect(hang); }} onPointerOver={over} onPointerOut={out}>
          <LabelPlane a={a} x={1.05} note="The object shown is a SIMULATION." />
        </group>
      </group>
    );
  }

  return (
    <group position={hang.pos} rotation={[0, hang.rotY, 0]} onPointerOver={over} onPointerOut={out} name={`hang-${hang.id}`}>
      {body}
      <group onClick={click()}><LabelPlane a={a} x={labelX} note={note} /></group>
    </group>
  );
}

function SetDeck({ k, x, onClick }: { k: Artwork; x: number; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const tex = useTex(deckTex(k));
  return <group position={[x, 0, -0.03]}><Deck tex={tex} onClick={onClick} /></group>;
}

function Caption({ y, text, kind }: { y: number; text: string; kind: string }) {
  const tex = useMemo(() => canvasTexture(1200, 200, (ctx, w, h) => {
    ctx.fillStyle = "#f5f5f0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#205C45"; ctx.font = `600 26px ${fonts.sans}`; spaced(ctx, kind, 10, 40, 6);
    ctx.fillStyle = "#3d423f"; ctx.font = `400 28px ${fonts.sans}`;
    let yy = 86; for (const l of wrapText(ctx, text, w - 20).slice(0, 3)) { ctx.fillText(l, 10, yy); yy += 38; }
  }), [text, kind]);
  return <mesh position={[0, y, 0]}><planeGeometry args={[1.5, 0.25]} /><meshBasicMaterial key={tex ? tex.uuid : "none"} map={tex} toneMapped={false} /></mesh>;
}

/* ---------------- AURA 001: web SIMULATION of ART and MIRROR states ---------------- */

const auraVert = `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const auraFrag = `
uniform float uTime; uniform float uMix; uniform float uTrace; uniform float uAspect;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
void main(){
  vec2 uv=vUv; vec2 p=vec2(uv.x*uAspect, uv.y);
  float t=uTime*0.03;
  float n=fbm(p*1.6+vec2(t, -t*0.6)); float n2=fbm(p*2.4-vec2(t*0.7, t*0.2)+n);
  vec3 deep=vec3(0.05,0.09,0.16), mid=vec3(0.13,0.26,0.36), warm=vec3(0.78,0.52,0.30);
  vec3 art=mix(deep, mid, smoothstep(0.25,0.75,n2));
  art=mix(art, warm, smoothstep(0.62,0.9,n2)*smoothstep(0.75,0.2,uv.y)*0.8);
  // MIRROR: dark two-way glass with a soft sheen
  vec3 glass=vec3(0.045,0.05,0.05)+vec3(0.06)*smoothstep(0.0,1.0,uv.y);
  float sheen=smoothstep(0.02,0.0,abs(uv.x*0.8+uv.y*0.5-0.75))*0.06;
  glass+=sheen;
  // Reveal: the reflection briefly shows through the artwork
  float reveal=smoothstep(0.0,1.0,uMix);
  vec3 col=mix(art, glass, reveal);
  // Perimeter Trace (gold), generated around the edge
  vec2 d=min(uv, 1.0-uv); float edge=min(d.x*uAspect, d.y);
  float inset=0.035; float line=smoothstep(0.004,0.0,abs(edge-inset));
  // perimeter parameter starting from top centre, clockwise
  vec2 c=uv-0.5; float ang=atan(c.x, c.y)/(6.2831853)+0.5; ang=fract(ang+0.5);
  float drawn=step(abs(ang-0.5)*2.0, uTrace);
  col+=vec3(0.75,0.6,0.35)*line*drawn*0.9;
  gl_FragColor=vec4(col,1.0);
  #include <colorspace_fragment>
}`;

function AuraSimulation({ onToggle, onOver, onOut }: { onToggle: (e: ThreeEvent<MouseEvent>) => void; onOver: () => void; onOut: () => void }) {
  const W = 1.1, H = W * (9 / 16);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: auraVert, fragmentShader: auraFrag, uniforms: { uTime: { value: 0 }, uMix: { value: 0 }, uTrace: { value: 0 }, uAspect: { value: 16 / 9 } } }), []);
  const word = useRef<THREE.MeshBasicMaterial>(null);
  const info = useRef<THREE.MeshBasicMaterial>(null);
  const state = useRef({ m: 0, word: 0, trace: 0, info: 0, still: 0 });
  const wordTex = useMemo(() => canvasTexture(512, 96, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#c9a56a"; ctx.font = `400 64px ${fonts.serif}`; spaced(ctx, "AURA", w / 2, 72, 18, "center"); }), []);
  const timeCanvas = useMemo(() => { const c = document.createElement("canvas"); c.width = 512; c.height = 160; return c; }, []);
  const timeTex = useMemo(() => { const t = new THREE.CanvasTexture(timeCanvas); t.colorSpace = THREE.SRGBColorSpace; return t; }, [timeCanvas]);
  const lastMin = useRef(-1);
  const crocTex = useMemo(() => {
    const t = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#1a1a19"; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 22) for (let x = (y / 22) % 2 ? 0 : 14; x < w; x += 28) { ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.04})`; ctx.beginPath(); ctx.roundRect(x, y, 24, 18, 6); ctx.fill(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
  }, []);
  const simTex = useMemo(() => canvasTexture(1400, 330, (ctx, w, h) => {
    ctx.fillStyle = "#171B19"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F7F7F2"; ctx.font = `600 64px ${fonts.sans}`; spaced(ctx, "SIMULATION", 40, 100, 22);
    ctx.fillStyle = "rgba(247,247,242,0.8)"; ctx.font = `400 34px ${fonts.sans}`;
    let y = 170; for (const l of wrapText(ctx, "A web approximation of AURA 001's two states, ART and MIRROR. This is not the physical installation and is not to scale. Click the surface to invite MIRROR.", w - 80)) { ctx.fillText(l, 40, y); y += 46; }
  }), []);

  useFrame((_, dt) => {
    const want = useUI.getState().auraMirror;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 100 : 1;
    const s = state.current;
    const toward = (v: number, target: number, rate: number) => (v < target ? Math.min(target, v + rate * dt * k) : Math.max(target, v - rate * dt * k));
    if (want) {
      s.m = toward(s.m, 1, 0.5);
      if (s.m >= 1) s.still += dt * k;
      if (s.still > 0.8) s.word = toward(s.word, 1, 1.2);
      if (s.word >= 1) s.trace = toward(s.trace, 1, 0.6);
      if (s.trace >= 1) s.info = toward(s.info, 1, 1.0);
    } else {
      s.still = 0;
      s.info = toward(s.info, 0, 1.5);
      if (s.info <= 0) s.trace = toward(s.trace, 0, 0.9);
      if (s.trace <= 0) s.word = toward(s.word, 0, 1.5);
      if (s.word <= 0) s.m = toward(s.m, 0, 0.45);
    }
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uMix.value = s.m;
    mat.uniforms.uTrace.value = s.trace;
    if (word.current) word.current.opacity = s.word;
    if (info.current) info.current.opacity = s.info;
    const now = new Date();
    if (s.info > 0 && now.getMinutes() !== lastMin.current) {
      lastMin.current = now.getMinutes();
      const ctx = timeCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, 512, 160);
      ctx.fillStyle = "#f2f2ee"; ctx.font = `300 84px ${fonts.sans}`;
      ctx.fillText(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), 10, 90);
      ctx.fillStyle = "#a08a63"; ctx.font = `500 22px ${fonts.sans}`;
      spaced(ctx, now.toLocaleDateString("en-GB", { day: "numeric", month: "long" }).toUpperCase(), 12, 136, 5);
      timeTex.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* sculptural body (3B direction: deep, dark, crocodile grain) */}
      <mesh position={[0, 0, -0.08]} onClick={onToggle} onPointerOver={onOver} onPointerOut={onOut}>
        <boxGeometry args={[W + 0.22, H + 0.22, 0.16]} />
        <meshStandardMaterial color="#222220" roughness={0.55} map={crocTex} />
      </mesh>
      <mesh position={[0, 0, 0.002]} material={mat} onClick={onToggle} onPointerOver={onOver} onPointerOut={onOut} name="aura-screen">
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[0, H / 2 - 0.05, 0.004]}><planeGeometry args={[0.2, 0.0375]} /><meshBasicMaterial ref={word} map={wordTex} transparent opacity={0} toneMapped={false} /></mesh>
      <mesh position={[-W / 2 + 0.14, H / 2 - 0.08, 0.004]}><planeGeometry args={[0.22, 0.069]} /><meshBasicMaterial ref={info} map={timeTex} transparent opacity={0} toneMapped={false} /></mesh>
      <mesh position={[0, H / 2 + 0.42, 0]}><planeGeometry args={[1.4, 0.33]} /><meshBasicMaterial map={simTex} toneMapped={false} /></mesh>
    </group>
  );
}

/* ---------------- Simple wall panels (archive cards, placeholders) ---------------- */

export function ImagePanel({ src, title, caption, kind, w = 0.95, onClick, placeholder }: { src?: string; title: string; caption: string; kind: string; w?: number; onClick?: (e: ThreeEvent<MouseEvent>) => void; placeholder?: string }) {
  const tex = useTex(src || null);
  const ph = useMemo(() => (src ? null : placeholderTexture(placeholder || "To be supplied", caption, 800, 600)), [src, placeholder, caption]);
  const t = tex || ph;
  const asp = tex ? (tex.image as HTMLImageElement).width / (tex.image as HTMLImageElement).height : 4 / 3;
  const h = Math.min(w / asp, 1.15);
  const ww = h * asp;
  return (
    <group onClick={onClick} onPointerOver={() => onClick && (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      <mesh position={[0, 0, -0.01]}><planeGeometry args={[ww + 0.1, h + 0.1]} /><meshStandardMaterial color="#fbfbf8" /></mesh>
      <mesh><planeGeometry args={[ww, h]} /><meshBasicMaterial key={t ? t.uuid : "none"} map={t} toneMapped={false} /></mesh>
      <Caption y={-h / 2 - 0.2} text={`${title}. ${src ? caption : ""}`} kind={kind.toUpperCase()} />
    </group>
  );
}
