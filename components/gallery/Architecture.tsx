"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import {
  BENCHES, CEIL_H, DOOR_H, DOOR_W, FEATURE, PART_T, ROOM_GEOMS, TABLE, WALL_H,
  featureArc, partitionPieces, roomTextSpot, sideWall, type V2,
} from "@/lib/gallery/architecture";
import type { Room } from "@/lib/types";
import { canvasTexture, ceilingTexture, coveRamp, fonts, radialShadow, spaced, wrapText } from "./textures";

export const COL = { white: "#f5f5f0", forest: "#103D2C", gallery: "#205C45", emerald: "#398565", floor: "#b1b3ae" };

function ribbon(pts: V2[], y0: number, y1: number): THREE.BufferGeometry {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let acc = 0;
  pts.forEach((p, i) => {
    if (i > 0) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    pos.push(p[0], y0, p[1], p[0], y1, p[1]);
    uv.push(acc, 0, acc, 1);
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function offset(pts: V2[], d: number): V2[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    // outward = away from x=0 centre line for side walls
    let nx = -tz / l, nz = tx / l;
    if (nx * p[0] < 0) { nx = -nx; nz = -nz; }
    return [p[0] + nx * d, p[1] + nz * d] as V2;
  });
}

export function Walls({ ramp }: { ramp: THREE.Texture }) {
  const geoms = useMemo(() => {
    const walls: THREE.BufferGeometry[] = [], slots: THREE.BufferGeometry[] = [], ceilingLips: THREE.BufferGeometry[] = [];
    ROOM_GEOMS.forEach((g) => {
      ([-1, 1] as const).forEach((side) => {
        const pts = sideWall(g, side);
        walls.push(ribbon(pts, 0, WALL_H));
        const out = offset(pts, 0.22);
        slots.push(ribbon(out, WALL_H - 0.02, CEIL_H));
      });
    });
    return { walls, slots, ceilingLips };
  }, []);
  return (
    <group>
      {geoms.walls.map((g, i) => (
        <mesh key={i} geometry={g} onClick={stop}>
          <meshStandardMaterial color={COL.white} roughness={0.95} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={ramp} emissiveIntensity={0.62} />
        </mesh>
      ))}
      {geoms.slots.map((g, i) => (
        <mesh key={`s${i}`} geometry={g}>
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const stop = (e: ThreeEvent<MouseEvent>) => e.stopPropagation();

function Box({ p, s, color, emissive, rough = 0.9 }: { p: [number, number, number]; s: [number, number, number]; color: string; emissive?: string; rough?: number }) {
  return (
    <mesh position={p} onClick={stop}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} roughness={rough} emissive={emissive || "#000"} emissiveIntensity={emissive ? 0.35 : 0} />
    </mesh>
  );
}

export function Partitions() {
  const items = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; c: string; e?: string }[] = [];
    ROOM_GEOMS.forEach((g, i) => {
      const { z, pieces, doorX } = partitionPieces(i);
      pieces.forEach(([x0, x1]) => out.push({ p: [(x0 + x1) / 2, WALL_H / 2, z], s: [x1 - x0, WALL_H, PART_T], c: COL.white, e: "#e8e8e2" }));
      if (doorX !== null) {
        // lintel
        out.push({ p: [doorX, (DOOR_H + WALL_H) / 2, z], s: [DOOR_W, WALL_H - DOOR_H, PART_T], c: COL.white, e: "#e8e8e2" });
        // deep-green door reveals
        const rt = PART_T + 0.04;
        out.push({ p: [doorX - DOOR_W / 2 + 0.04, DOOR_H / 2, z], s: [0.08, DOOR_H, rt], c: COL.forest });
        out.push({ p: [doorX + DOOR_W / 2 - 0.04, DOOR_H / 2, z], s: [0.08, DOOR_H, rt], c: COL.forest });
        out.push({ p: [doorX, DOOR_H - 0.04, z], s: [DOOR_W, 0.08, rt], c: COL.forest });
      }
    });
    // entrance back wall
    out.push({ p: [0, WALL_H / 2, 0.1], s: [ROOM_GEOMS[0].hw * 2 + 1, WALL_H, 0.2], c: COL.white, e: "#e8e8e2" });
    return out;
  }, []);
  return <group>{items.map((b, i) => <Box key={i} p={b.p} s={b.s} color={b.c} emissive={b.e} />)}</group>;
}

export function FloorAndCeiling({ quality }: { quality: "high" | "low" }) {
  const ceil = useMemo(() => { const t = ceilingTexture(); t.repeat.set(30 / 1.8, 100 / 1.8); return t; }, []);
  const spots = useMemo(() => {
    const s: [number, number][] = [];
    ROOM_GEOMS.forEach((g) => { for (let z = g.z0 - 3; z > g.z1 + 1; z -= 4.5) for (const x of [-3.5, 0, 3.5]) s.push([x + ((z * 7) % 2), z]); });
    return s;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -46]} name="floor">
        <planeGeometry args={[30, 100]} />
        {quality === "high" ? (
          <MeshReflectorMaterial blur={[400, 120]} resolution={512} mixBlur={1} mixStrength={1.1} roughness={0.85} depthScale={0.6} minDepthThreshold={0.4} maxDepthThreshold={1.3} color={COL.floor} metalness={0.25} mirror={0.4} />
        ) : (
          <meshStandardMaterial color="#b3b5b0" roughness={0.55} metalness={0.05} />
        )}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_H, -46]}>
        <planeGeometry args={[30, 100]} />
        <meshBasicMaterial map={ceil} color="#e4e4df" />
      </mesh>
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x, CEIL_H - 0.01, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#ffffff", "#9fa39d", 0.75]} />
      {ROOM_GEOMS.map((g) => (
        <pointLight key={g.id} position={[0, 2.8, (g.z0 + g.z1) / 2]} intensity={14} distance={16} decay={1.5} color="#fffaf0" />
      ))}
    </>
  );
}

export function Benches() {
  const shadow = useMemo(() => radialShadow(), []);
  return (
    <group>
      {BENCHES.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          <Box p={[0, 0.43, 0]} s={[b.w, 0.08, b.d]} color="#fafaf6" emissive="#e6e6e0" rough={0.7} />
          <Box p={[-b.w / 2 + 0.12, 0.2, 0]} s={[0.12, 0.4, b.d - 0.04]} color="#efefe9" />
          <Box p={[b.w / 2 - 0.12, 0.2, 0]} s={[0.12, 0.4, b.d - 0.04]} color="#efefe9" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <planeGeometry args={[b.w + 0.9, b.d + 0.9]} />
            <meshBasicMaterial map={shadow} transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
      <group position={[TABLE.x, 0, TABLE.z]}>
        <Box p={[0, TABLE.h, 0]} s={[TABLE.w, 0.06, TABLE.d]} color={COL.forest} rough={0.6} />
        <Box p={[0, TABLE.h / 2, -TABLE.d / 2 + 0.3]} s={[TABLE.w - 0.2, TABLE.h, 0.08]} color={COL.gallery} />
        <Box p={[0, TABLE.h / 2, TABLE.d / 2 - 0.3]} s={[TABLE.w - 0.2, TABLE.h, 0.08]} color={COL.gallery} />
      </group>
    </group>
  );
}

/** Entrance: deep-green curved feature wall with the MINDED wordmark. */
export function FeatureWall({ tagline }: { tagline: string }) {
  const { front, back, cap0, cap1, wordTex, arcLen } = useMemo(() => {
    const pts = featureArc(24);
    const front = ribbon(pts.map(([x, z]) => { const a = Math.atan2(x - FEATURE.cx, -(z - FEATURE.cz)); return [x - Math.sin(a) * (FEATURE.t / 2), z + Math.cos(a) * (FEATURE.t / 2)] as V2; }), 0, FEATURE.h);
    const back = ribbon(pts.map(([x, z]) => { const a = Math.atan2(x - FEATURE.cx, -(z - FEATURE.cz)); return [x + Math.sin(a) * (FEATURE.t / 2), z - Math.cos(a) * (FEATURE.t / 2)] as V2; }), 0, FEATURE.h);
    const arcLen = FEATURE.r * (FEATURE.a1 - FEATURE.a0);
    const wordTex = canvasTexture(2048, 1024, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#164a36"); g.addColorStop(0.5, "#103D2C"); g.addColorStop(1, "#0c3122");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // painterly organic forms
      for (const [x, y, r, c, a] of [[300, 200, 520, "#205C45", 0.55], [1700, 860, 600, "#398565", 0.22], [1200, 120, 360, "#0a2a1e", 0.6]] as const) {
        const rg = ctx.createRadialGradient(x, y, 10, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, "rgba(16,61,44,0)");
        ctx.globalAlpha = a; ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#F7F7F2"; ctx.font = `400 300px ${fonts.serif}`; ctx.textBaseline = "alphabetic";
      spaced(ctx, "MINDED", w / 2 + 40, 560, 90, "center");
      ctx.font = `500 40px ${fonts.sans}`; ctx.fillStyle = "rgba(247,247,242,0.85)";
      spaced(ctx, tagline, w / 2, 700, 12, "center");
    });
    wordTex.repeat.set(1 / arcLen, 1);
    return { front, back, cap0: pts[0], cap1: pts[pts.length - 1], wordTex, arcLen };
  }, [tagline]);
  return (
    <group>
      <mesh geometry={front} onClick={stop}>
        <meshLambertMaterial map={wordTex} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={wordTex} emissiveIntensity={0.3} />
      </mesh>
      <mesh geometry={back} onClick={stop}>
        <meshLambertMaterial color={COL.forest} side={THREE.DoubleSide} />
      </mesh>
      {[cap0, cap1].map((c, i) => (
        <mesh key={i} position={[c[0], FEATURE.h / 2, c[1]]} rotation={[0, -(i ? FEATURE.a1 : FEATURE.a0), 0]}>
          <boxGeometry args={[0.04, FEATURE.h, FEATURE.t + 0.02]} />
          <meshStandardMaterial color={COL.gallery} />
        </mesh>
      ))}
      <mesh position={[0, FEATURE.h + 0.01, FEATURE.cz - FEATURE.r]} visible={false}><boxGeometry args={[arcLen, 0.01, 0.01]} /></mesh>
    </group>
  );
}

/** Wall text panel with title + paragraph, printed straight on the wall. */
export function WallText({ pos, rotY = 0, eyebrow, title, body, width = 2.6, onClick, dark = false }: { pos: [number, number, number]; rotY?: number; eyebrow: string; title: string; body: string; width?: number; onClick?: (e: ThreeEvent<MouseEvent>) => void; dark?: boolean }) {
  const tex = useMemo(() => canvasTexture(1300, 1000, (ctx, w, h) => {
    if (dark) { ctx.fillStyle = COL.forest; ctx.fillRect(0, 0, w, h); } else ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dark ? "#9cc7b2" : COL.gallery; ctx.font = `600 34px ${fonts.sans}`; spaced(ctx, eyebrow.toUpperCase(), 40, 90, 9);
    ctx.fillStyle = dark ? "#f7f7f2" : "#171B19"; ctx.font = `400 104px ${fonts.serif}`;
    let y = 220; for (const l of wrapText(ctx, title, w - 80)) { ctx.fillText(l, 40, y); y += 108; }
    ctx.font = `400 40px ${fonts.sans}`; ctx.fillStyle = dark ? "rgba(247,247,242,0.82)" : "#3d423f"; y += 20;
    for (const l of wrapText(ctx, body, w - 80)) { ctx.fillText(l, 40, y); y += 58; }
  }), [eyebrow, title, body, dark]);
  return (
    <mesh position={pos} rotation={[0, rotY, 0]} onClick={onClick}>
      <planeGeometry args={[width, width * (1000 / 1300)]} />
      <meshBasicMaterial map={tex} toneMapped={false} transparent={!dark} depthWrite={dark} />
    </mesh>
  );
}

/** Room signage above each doorway, facing visitors arriving from the previous room. */
export function Signage({ rooms }: { rooms: Room[] }) {
  return (
    <group>
      {ROOM_GEOMS.slice(0, -1).map((g, i) => {
        const next = rooms[i + 1];
        if (!next) return null;
        return <Sign key={g.id} x={g.doorX ?? 0} z={g.z1 + PART_T / 2 + 0.02} text={`ROOM ${next.number}`} sub={next.title.toUpperCase()} />;
      })}
    </group>
  );
}

function Sign({ x, z, text, sub }: { x: number; z: number; text: string; sub: string }) {
  const tex = useMemo(() => canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = COL.forest; ctx.font = `600 54px ${fonts.sans}`; spaced(ctx, text, w / 2, 100, 16, "center");
    ctx.fillStyle = "#3d423f"; ctx.font = `500 34px ${fonts.sans}`; spaced(ctx, sub, w / 2, 180, 8, "center");
  }), [text, sub]);
  return (
    <mesh position={[x, DOOR_H + 0.62, z]}>
      <planeGeometry args={[2.8, 0.7]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

export function RoomTexts({ rooms }: { rooms: Room[] }) {
  return (
    <group>
      {rooms.map((r, i) => {
        if (i === 0) return null;
        const s = roomTextSpot(i);
        return <WallText key={r.id} pos={[s.x, 1.75, s.z + 0.01]} eyebrow={`Room ${r.number}`} title={r.title} body={r.intro} width={2.3} />;
      })}
    </group>
  );
}

export function useCoveRamp() {
  return useMemo(() => coveRamp(), []);
}
