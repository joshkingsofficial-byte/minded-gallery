/**
 * Mutable per-frame navigation state (kept outside React for performance).
 */
import { collide, doorWaypoints, EYE, roomIndexAt, type V2 } from "./architecture";

export interface Glide {
  from: { x: number; z: number; yaw: number; pitch: number };
  to: { x: number; z: number; yaw: number; pitch: number };
  t: number;
  dur: number;
  onDone?: () => void;
}

export const nav = {
  x: 0,
  z: -2.6,
  yaw: 0,
  pitch: -0.03,
  keys: new Set<string>(),
  joy: { x: 0, y: 0 },
  path: [] as V2[],
  glide: null as Glide | null,
  stuck: 0,
  enabled: true,
  reduceMotion: false,
};

export function yawPitchTo(x: number, z: number, look: [number, number, number]): { yaw: number; pitch: number } {
  const dx = look[0] - x, dz = look[2] - z;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = Math.atan2(look[1] - EYE, Math.hypot(dx, dz));
  return { yaw, pitch };
}

export function setWalkTarget(x: number, z: number) {
  nav.glide = null;
  nav.path = [...doorWaypoints(nav.z, z), [x, z]];
  nav.stuck = 0;
}

function shortAngle(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function startGlide(to: { x: number; z: number; look: [number, number, number] }, dur = 1.6, onDone?: () => void) {
  const { yaw, pitch } = yawPitchTo(to.x, to.z, to.look);
  nav.path = [];
  nav.glide = { from: { x: nav.x, z: nav.z, yaw: nav.yaw, pitch: nav.pitch }, to: { x: to.x, z: to.z, yaw: nav.yaw + shortAngle(nav.yaw, yaw), pitch }, t: 0, dur: nav.reduceMotion ? 0.001 : dur, onDone };
}

export function teleport(to: { x: number; z: number; look: [number, number, number] }) {
  const { yaw, pitch } = yawPitchTo(to.x, to.z, to.look);
  nav.path = []; nav.glide = null;
  nav.x = to.x; nav.z = to.z; nav.yaw = yaw; nav.pitch = pitch;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Advance navigation by dt seconds. */
export function stepNav(dt: number) {
  // integrate in small sub-steps so slow devices move at the same real speed
  let rest = Math.min(dt, 0.3);
  while (rest > 1e-4) { const h = Math.min(rest, 0.05); stepOnce(h); rest -= h; }
}

function stepOnce(dt: number) {
  if (nav.glide) {
    const g = nav.glide;
    g.t = Math.min(1, g.t + dt / g.dur);
    const k = ease(g.t);
    nav.x = g.from.x + (g.to.x - g.from.x) * k;
    nav.z = g.from.z + (g.to.z - g.from.z) * k;
    nav.yaw = g.from.yaw + (g.to.yaw - g.from.yaw) * k;
    nav.pitch = g.from.pitch + (g.to.pitch - g.from.pitch) * k;
    if (g.t >= 1) { nav.glide = null; g.onDone?.(); }
    return;
  }
  if (!nav.enabled) return;
  const speed = nav.keys.has("shift") ? 3.6 : 2.2;
  let f = 0, s = 0;
  if (nav.keys.has("w") || nav.keys.has("arrowup")) f += 1;
  if (nav.keys.has("s") || nav.keys.has("arrowdown")) f -= 1;
  if (nav.keys.has("a")) s -= 1;
  if (nav.keys.has("d")) s += 1;
  if (nav.keys.has("arrowleft")) nav.yaw += 1.6 * dt;
  if (nav.keys.has("arrowright")) nav.yaw -= 1.6 * dt;
  f += -nav.joy.y; s += nav.joy.x;
  let mx = 0, mz = 0;
  if (f || s) {
    nav.path = [];
    const len = Math.max(1, Math.hypot(f, s));
    f /= len; s /= len;
    const sin = Math.sin(nav.yaw), cos = Math.cos(nav.yaw);
    mx = (-sin * f + cos * s) * speed * dt;
    mz = (-cos * f - sin * s) * speed * dt;
  } else if (nav.path.length) {
    const [tx, tz] = nav.path[0];
    const dx = tx - nav.x, dz = tz - nav.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.2) { nav.path.shift(); return; }
    const sp = Math.min(speed * dt, d);
    mx = (dx / d) * sp; mz = (dz / d) * sp;
    // turn gently towards the direction of travel
    const want = Math.atan2(-dx, -dz);
    nav.yaw += shortAngle(nav.yaw, want) * Math.min(1, dt * 2.2);
  }
  if (mx || mz) {
    const [nx, nz] = collide(nav.x + mx, nav.z + mz);
    const progress = Math.hypot(nx - nav.x, nz - nav.z);
    if (nav.path.length && progress < 0.002) { nav.stuck += dt; if (nav.stuck > 0.6) nav.path = []; } else nav.stuck = 0;
    nav.x = nx; nav.z = nz;
  }
}

export function currentRoom() {
  return roomIndexAt(nav.z);
}
