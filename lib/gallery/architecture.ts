/**
 * Gallery architecture: room footprints, walls, collision segments, hanging
 * positions and tour stops. Pure data + maths (no React), so it can be tested
 * and later driven by CMS-managed layouts.
 *
 * Coordinates: metres. x = left/right, z = depth (visitors walk towards -z),
 * y = up. Rooms are laid out as an enfilade from the Entrance Hall.
 */
import type { Placement, Room } from "../types";

export const WALL_H = 4.4;
export const CEIL_H = 4.62;
export const DOOR_W = 3.0;
export const DOOR_H = 3.1;
export const PART_T = 0.4;
export const EYE = 1.6;
export const PLAYER_R = 0.38;
export const ART_Y = 1.6;

export interface RoomGeom {
  id: string;
  z0: number;
  z1: number;
  hw: number;
  bulge: number;
  /** x of the doorway in the far partition (z1). null = closed end wall. */
  doorX: number | null;
}

export const ROOM_GEOMS: RoomGeom[] = [
  { id: "entrance", z0: 0, z1: -18, hw: 9, bulge: 1.6, doorX: 0 },
  { id: "room-01", z0: -18, z1: -32, hw: 7.5, bulge: 1.3, doorX: -3 },
  { id: "room-02", z0: -32, z1: -50, hw: 8, bulge: 1.1, doorX: 3 },
  { id: "room-03", z0: -50, z1: -64, hw: 7.5, bulge: 1.3, doorX: -3 },
  { id: "room-04", z0: -64, z1: -78, hw: 7, bulge: 1.4, doorX: 2.5 },
  { id: "room-05", z0: -78, z1: -92, hw: 7.5, bulge: 1.3, doorX: null },
];

export type V2 = [number, number];

export interface Segment { a: V2; b: V2; r: number }

const SIDE_STEPS = 28;

/** Points along a side wall (side -1 = left, +1 = right), from z0 to z1. */
export function sideWall(g: RoomGeom, side: -1 | 1): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i <= SIDE_STEPS; i++) {
    const t = i / SIDE_STEPS;
    pts.push([side * (g.hw + g.bulge * Math.sin(Math.PI * t)), g.z0 + (g.z1 - g.z0) * t]);
  }
  return pts;
}

/** Point and inward normal at parameter t on a side wall. */
export function sideWallAt(g: RoomGeom, side: -1 | 1, t: number): { p: V2; n: V2 } {
  const x = side * (g.hw + g.bulge * Math.sin(Math.PI * t));
  const z = g.z0 + (g.z1 - g.z0) * t;
  const dx = side * g.bulge * Math.PI * Math.cos(Math.PI * t);
  const dz = g.z1 - g.z0;
  // tangent (dx, dz); inward normal points towards x = 0
  let nx = dz, nz = -dx;
  const len = Math.hypot(nx, nz);
  nx /= len; nz /= len;
  if (nx * -side < 0) { nx = -nx; nz = -nz; }
  return { p: [x, z], n: [nx, nz] };
}

/** Partition between room i and i+1 (at room i's z1); returns segments (two pieces around the door). */
export function partitionPieces(i: number): { z: number; pieces: [number, number][]; doorX: number | null } {
  const g = ROOM_GEOMS[i];
  const next = ROOM_GEOMS[i + 1];
  const w = Math.max(g.hw, next ? next.hw : g.hw) + 0.4;
  if (g.doorX === null) return { z: g.z1, pieces: [[-w, w]], doorX: null };
  return { z: g.z1, pieces: [[-w, g.doorX - DOOR_W / 2], [g.doorX + DOOR_W / 2, w]], doorX: g.doorX };
}

/** Entrance feature wall (deep green), an arc concave towards the visitor. */
export const FEATURE = { cx: 0, cz: -1.5, r: 8, a0: -0.42, a1: 0.42, h: 3.7, t: 0.3 };
export function featureArc(steps = 18): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = FEATURE.a0 + (FEATURE.a1 - FEATURE.a0) * (i / steps);
    pts.push([FEATURE.cx + Math.sin(a) * FEATURE.r, FEATURE.cz - Math.cos(a) * FEATURE.r]);
  }
  return pts;
}

export interface Bench { x: number; z: number; rot: number; w: number; d: number }
export const BENCHES: Bench[] = [
  { x: 5.2, z: -14.5, rot: 0, w: 1.9, d: 0.55 },
  { x: -5.6, z: -6, rot: Math.PI / 2, w: 1.9, d: 0.55 },
  { x: 0, z: -25, rot: Math.PI / 2, w: 2.0, d: 0.55 },
  { x: 0, z: -41, rot: Math.PI / 2, w: 2.2, d: 0.55 },
  { x: 0.5, z: -57, rot: Math.PI / 2, w: 2.0, d: 0.55 },
  { x: -1.5, z: -71, rot: Math.PI / 2, w: 1.8, d: 0.55 },
];
/** Archive table (deep green), room 05. */
export const TABLE = { x: 0, z: -85, w: 1.2, d: 4.2, h: 0.78 };

function polySegs(pts: V2[], r: number): Segment[] {
  const s: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i++) s.push({ a: pts[i], b: pts[i + 1], r });
  return s;
}

function boxSegs(x: number, z: number, w: number, d: number, rot: number): Segment[] {
  const c = Math.cos(rot), s = Math.sin(rot);
  const corners: V2[] = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([px, pz]) => [x + px * c + pz * s, z - px * s + pz * c] as V2);
  return polySegs([...corners, corners[0]], 0.02);
}

export function buildCollision(): Segment[] {
  const segs: Segment[] = [];
  ROOM_GEOMS.forEach((g, i) => {
    segs.push(...polySegs(sideWall(g, -1), 0.05), ...polySegs(sideWall(g, 1), 0.05));
    const p = partitionPieces(i);
    p.pieces.forEach(([x0, x1]) => segs.push({ a: [x0, p.z], b: [x1, p.z], r: PART_T / 2 }));
  });
  const g0 = ROOM_GEOMS[0];
  segs.push({ a: [-g0.hw - 0.4, 0], b: [g0.hw + 0.4, 0], r: 0.1 });
  segs.push(...polySegs(featureArc(), FEATURE.t / 2));
  BENCHES.forEach((b) => segs.push(...boxSegs(b.x, b.z, b.w, b.d, b.rot)));
  segs.push(...boxSegs(TABLE.x, TABLE.z, TABLE.w, TABLE.d, 0));
  return segs;
}

export const COLLISION = buildCollision();

/** Resolve a circle at (x,z) against all segments. Returns the corrected position. */
export function collide(x: number, z: number, r = PLAYER_R): V2 {
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const s of COLLISION) {
      const [ax, az] = s.a, [bx, bz] = s.b;
      const vx = bx - ax, vz = bz - az;
      const L = vx * vx + vz * vz || 1e-9;
      let t = ((x - ax) * vx + (z - az) * vz) / L;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + vx * t, cz = az + vz * t;
      const dx = x - cx, dz = z - cz;
      const d = Math.hypot(dx, dz);
      const min = r + s.r;
      if (d < min) {
        const nx = d > 1e-6 ? dx / d : 0, nz = d > 1e-6 ? dz / d : 1;
        x = cx + nx * min; z = cz + nz * min;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return [x, z];
}

export function roomIndexAt(z: number): number {
  for (let i = 0; i < ROOM_GEOMS.length; i++) if (z <= ROOM_GEOMS[i].z0 && z > ROOM_GEOMS[i].z1) return i;
  return z > 0 ? 0 : ROOM_GEOMS.length - 1;
}

/** Waypoints through doorways to get from z to a target z in another room. */
export function doorWaypoints(fromZ: number, toZ: number): V2[] {
  const a = roomIndexAt(fromZ), b = roomIndexAt(toZ);
  const pts: V2[] = [];
  if (a < b) for (let i = a; i < b; i++) { const d = ROOM_GEOMS[i].doorX!; pts.push([d, ROOM_GEOMS[i].z1 + 1.1], [d, ROOM_GEOMS[i].z1 - 1.1]); }
  else if (a > b) for (let i = a - 1; i >= b; i--) { const d = ROOM_GEOMS[i].doorX!; pts.push([d, ROOM_GEOMS[i].z1 - 1.1], [d, ROOM_GEOMS[i].z1 + 1.1]); }
  return pts;
}

export interface Hang {
  id: string;
  roomId: string;
  placement: Placement;
  pos: [number, number, number];
  rotY: number;
  normal: V2;
  /** Where to stand to view it, and the point to look at. */
  view: { x: number; z: number; look: [number, number, number] };
}

export function hangFor(roomId: string, p: Placement, idx: number, viewDist = 2.5): Hang {
  const g = ROOM_GEOMS.find((r) => r.id === roomId)!;
  let px: number, pz: number, n: V2;
  if (p.wall === "L" || p.wall === "R") {
    const w = sideWallAt(g, p.wall === "L" ? -1 : 1, p.t ?? 0.5);
    n = w.n; px = w.p[0] + n[0] * 0.13; pz = w.p[1] + n[1] * 0.13;
  } else if (p.wall === "B") {
    n = [0, 1]; px = p.x ?? 0; pz = g.z1 + PART_T / 2 + 0.03;
  } else {
    n = [0, -1]; px = p.x ?? 0; pz = g.z0 - PART_T / 2 - 0.03;
  }
  const rotY = Math.atan2(n[0], n[1]);
  const y = p.display === "deck-grid-3x3" ? 1.75 : p.display === "deck-set" ? 1.65 : ART_Y;
  return {
    id: `${roomId}:${p.artwork}:${idx}`,
    roomId, placement: p, pos: [px, y, pz], rotY, normal: n,
    view: { x: px + n[0] * viewDist, z: pz + n[1] * viewDist, look: [px, y, pz] },
  };
}

/** Room entry stop: just inside the doorway, looking down the room. */
export function roomEntry(i: number): { x: number; z: number; look: [number, number, number] } {
  const g = ROOM_GEOMS[i];
  if (i === 0) return { x: 0, z: -2.6, look: [0, 1.9, -9] };
  const prevDoor = ROOM_GEOMS[i - 1].doorX ?? 0;
  return { x: prevDoor * 0.6, z: g.z0 - 1.6, look: [0, 1.6, (g.z0 + g.z1) / 2 - 2] };
}

export function buildHangs(rooms: Room[]): Hang[] {
  const out: Hang[] = [];
  rooms.forEach((r) => r.placements.forEach((p, i) => out.push(hangFor(r.id, p, i, p.display === "deck-set" ? 3.6 : p.display === "deck-grid-3x3" ? 3.2 : 2.5))));
  return out;
}

/** Room-text panel position on the far partition, on the side away from the door. */
export function roomTextSpot(i: number): { x: number; z: number } {
  const g = ROOM_GEOMS[i];
  const side = g.doorX === null ? 0 : g.doorX >= 0 ? -1 : 1;
  const x = g.doorX === null ? 0 : g.doorX + side * (DOOR_W / 2 + 2.4);
  return { x, z: g.z1 + PART_T / 2 + 0.03 };
}
