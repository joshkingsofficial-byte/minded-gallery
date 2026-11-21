"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { getArchive, getExhibition, getRooms, site } from "@/lib/content";
import {
  EYE, PART_T, ROOM_GEOMS, buildHangs, roomIndexAt, sideWallAt, type Hang,
} from "@/lib/gallery/architecture";
import { nav, setWalkTarget, stepNav } from "@/lib/gallery/nav";
import { useUI } from "@/lib/gallery/store";
import { Benches, FeatureWall, FloorAndCeiling, Lights, Partitions, RoomTexts, Signage, Walls, WallText, useCoveRamp } from "./Architecture";
import { HangDisplay, ImagePanel } from "./Artworks";
import { canvasTexture, fonts, placeholderTexture, spaced } from "./textures";

export interface SceneApi {
  onSelectHang: (h: Hang, child?: string) => void;
  onSelectArchive: (section: number, entry: number) => void;
  goToRoom: (i: number) => void;
}

function Rig() {
  const { camera, gl } = useThree();
  const marker = useRef<THREE.Mesh>(null);
  const hangs = useMemo(() => buildHangs(getRooms()), []);
  const lastNear = useRef<string | null>(null);
  const lastRoom = useRef(-1);
  useEffect(() => {
    const el = gl.domElement;
    let drag: { id: number; x: number; y: number } | null = null;
    const down = (e: PointerEvent) => { if (e.button !== 0 && e.pointerType === "mouse") return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; };
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (nav.glide) return;
      const k = e.pointerType === "touch" ? 0.005 : 0.0032;
      nav.yaw += dx * k;
      nav.pitch = Math.max(-0.7, Math.min(0.6, nav.pitch + dy * k));
    };
    const up = (e: PointerEvent) => { if (drag?.id === e.pointerId) drag = null; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [gl]);

  useFrame((_, dt) => {
    stepNav(dt);
    camera.position.set(nav.x, EYE, nav.z);
    camera.rotation.set(nav.pitch, nav.yaw, 0, "YXZ");
    if (marker.current) {
      const t = nav.path[nav.path.length - 1];
      marker.current.visible = !!t;
      if (t) marker.current.position.set(t[0], 0.01, t[1]);
    }
    // room + proximity
    const ri = roomIndexAt(nav.z);
    const ui = useUI.getState();
    if (ri !== lastRoom.current) { lastRoom.current = ri; if (ui.roomIndex !== ri) ui.set({ roomIndex: ri }); }
    let best: Hang | null = null, bestD = 3.4;
    const fx = -Math.sin(nav.yaw), fz = -Math.cos(nav.yaw);
    for (const h of hangs) {
      const dx = h.pos[0] - nav.x, dz = h.pos[2] - nav.z;
      const d = Math.hypot(dx, dz);
      if (d < bestD && (dx * fx + dz * fz) / d > 0.35) { best = h; bestD = d; }
    }
    const id = best?.id ?? null;
    if (id !== lastNear.current) {
      lastNear.current = id;
      ui.set({ near: best ? { hangId: best.id, label: best.placement.artwork } : null });
    }
  });

  return (
    <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.18, 0.24, 40]} />
      <meshBasicMaterial color="#205C45" transparent opacity={0.8} toneMapped={false} />
    </mesh>
  );
}

function EntranceExtras({ goToRoom }: { goToRoom: (i: number) => void }) {
  const g = ROOM_GEOMS[0];
  const rooms = getRooms();
  const ex = getExhibition();
  const L = sideWallAt(g, -1, 0.42), R = sideWallAt(g, 1, 0.42);
  const rotL = Math.atan2(L.n[0], L.n[1]), rotR = Math.atan2(R.n[0], R.n[1]);
  return (
    <group>
      <WallText pos={[L.p[0] + L.n[0] * 0.1, 1.8, L.p[1] + L.n[1] * 0.1]} rotY={rotL} eyebrow="Artist statement" title="MINDED" body={`${ex.statement} ${site.philosophy[2]}`} width={2.6} />
      <group position={[R.p[0] + R.n[0] * 0.1, 0, R.p[1] + R.n[1] * 0.1]} rotation={[0, rotR, 0]}>
        <DirectoryHeader />
        {rooms.slice(1).map((r, i) => (
          <DirectoryRow key={r.id} y={2.35 - i * 0.34} label={`${r.number}   ${r.title}`} sub={r.subtitle} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); goToRoom(i + 1); }} />
        ))}
      </group>
    </group>
  );
}

function DirectoryHeader() {
  const tex = useMemo(() => canvasTexture(1200, 260, (ctx, w, h) => {
    ctx.fillStyle = "#f5f5f0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#205C45"; ctx.font = `600 36px ${fonts.sans}`; spaced(ctx, "THE ROOMS", 20, 90, 10);
    ctx.fillStyle = "#171B19"; ctx.font = `400 92px ${fonts.serif}`; ctx.fillText("Directory", 20, 210);
  }), []);
  return <mesh position={[0, 2.95, 0]}><planeGeometry args={[2.4, 0.52]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
}

function DirectoryRow({ y, label, sub, onClick }: { y: number; label: string; sub: string; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const tex = useMemo(() => canvasTexture(1200, 150, (ctx, w, h) => {
    ctx.fillStyle = "#f5f5f0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(23,27,25,0.15)"; ctx.fillRect(20, h - 3, w - 40, 2);
    ctx.fillStyle = "#171B19"; ctx.font = `400 58px ${fonts.serif}`; ctx.fillText(label, 20, 85);
    ctx.fillStyle = "#205C45"; ctx.font = `500 26px ${fonts.sans}`; spaced(ctx, `${sub.toUpperCase()}  →`, 20, 128, 4);
  }), [label, sub]);
  return (
    <mesh position={[0, y, 0]} onClick={onClick} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      <planeGeometry args={[2.4, 0.3]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function AuraRoomExtras() {
  const g = ROOM_GEOMS[4];
  const V = sideWallAt(g, -1, 0.5);
  const video = useMemo(() => placeholderTexture("Prototype startup video", "The AURA 001 startup video will play here once supplied by the artist. Prototype documentation is distinguished from final installation photography.", 960, 540, true), []);
  return (
    <group>
      <mesh position={[V.p[0] + V.n[0] * 0.08, 1.6, V.p[1] + V.n[1] * 0.05]} rotation={[0, Math.atan2(V.n[0], V.n[1]), 0]}>
        <planeGeometry args={[1.5, 0.84]} />
        <meshBasicMaterial map={video} toneMapped={false} />
      </mesh>
      <WallText pos={[-5.1, 1.9, g.z1 + PART_T / 2 + 0.04]} eyebrow="AURA 001" title="Technology is the medium. Emotion is the outcome." body="ART is home. MIRROR is invited utility. The movement between the two states is part of the artwork." width={2.4} dark />
    </group>
  );
}

function ArchiveRoom({ onSelect }: { onSelect: (s: number, e: number) => void }) {
  const g = ROOM_GEOMS[5];
  const { sections } = getArchive();
  const entries = sections.flatMap((s, si) => s.entries.map((e, ei) => ({ ...e, si, ei, section: s.title })));
  const slots: { side: -1 | 1; t: number }[] = [
    { side: -1, t: 0.18 }, { side: -1, t: 0.39 }, { side: -1, t: 0.61 }, { side: -1, t: 0.82 },
    { side: 1, t: 0.18 }, { side: 1, t: 0.39 }, { side: 1, t: 0.61 }, { side: 1, t: 0.82 },
  ];
  return (
    <group>
      {entries.slice(0, slots.length + 1).map((e, i) => {
        let pos: [number, number, number], rot: number;
        if (i < slots.length) {
          const w = sideWallAt(g, slots[i].side, slots[i].t);
          pos = [w.p[0] + w.n[0] * 0.08, 1.65, w.p[1] + w.n[1] * 0.08]; rot = Math.atan2(w.n[0], w.n[1]);
        } else { pos = [3.6, 1.65, g.z1 + PART_T / 2 + 0.04]; rot = 0; }
        return (
          <group key={i} position={pos} rotation={[0, rot, 0]} name={`archive-${e.si}-${e.ei}`}>
            <ImagePanel src={e.src} title={e.title} caption={e.caption} kind={e.src ? `${e.section} · ${e.kind}` : e.section} placeholder="To be supplied"
              onClick={(ev) => { if (ev.delta > 6) return; ev.stopPropagation(); onSelect(e.si, e.ei); }} />
          </group>
        );
      })}
    </group>
  );
}

function Floor({ onWalk }: { onWalk: (x: number, z: number) => void }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -46]} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onWalk(e.point.x, e.point.z); }} name="walk-surface">
      <planeGeometry args={[30, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export default function Scene({ api, quality: initial, onReady }: { api: SceneApi; quality: "high" | "low"; onReady: () => void }) {
  const rooms = getRooms();
  const [quality, setQuality] = useState(initial);
  const hangs = useMemo(() => buildHangs(rooms), [rooms]);
  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ fov: 62, near: 0.05, far: 120, position: [nav.x, EYE, nav.z] }}
      gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.12; requestAnimationFrame(onReady); }}
      style={{ touchAction: "none" }}
      data-testid="gallery-canvas"
    >
      <color attach="background" args={["#e9e9e4"]} />
      <fog attach="fog" args={["#ecece7", 18, 60]} />
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <Lights />
      <SceneBody api={api} quality={quality} hangs={hangs} />
      <Rig />
    </Canvas>
  );
}

function SceneBody({ api, quality, hangs }: { api: SceneApi; quality: "high" | "low"; hangs: Hang[] }) {
  const ramp = useCoveRamp();
  const rooms = getRooms();
  return (
    <group>
      <Walls ramp={ramp} />
      <Partitions />
      <FloorAndCeiling quality={quality} />
      <Floor onWalk={(x, z) => { if (useUI.getState().mode === "free") setWalkTarget(x, z); }} />
      <Benches />
      <FeatureWall tagline={site.tagline} />
      <Signage rooms={rooms} />
      <RoomTexts rooms={rooms} />
      <EntranceExtras goToRoom={api.goToRoom} />
      <AuraRoomExtras />
      <ArchiveRoom onSelect={api.onSelectArchive} />
      {hangs.map((h) => <HangDisplay key={h.id} hang={h} onSelect={api.onSelectHang} />)}
    </group>
  );
}
