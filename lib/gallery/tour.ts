import { getArtwork, getRooms } from "../content";
import { ROOM_GEOMS, buildHangs, roomEntry, sideWallAt, type Hang } from "./architecture";

export interface Stop {
  room: number;
  x: number;
  z: number;
  look: [number, number, number];
  title: string;
  caption: string;
  hangId?: string;
}

export function buildTour(): Stop[] {
  const rooms = getRooms();
  const hangs = buildHangs(rooms);
  const stops: Stop[] = [];
  rooms.forEach((r, i) => {
    const e = roomEntry(i);
    stops.push({ room: i, ...e, title: r.number ? `Room ${r.number}: ${r.title}` : r.title, caption: r.intro });
    if (i === 0) {
      const g = ROOM_GEOMS[0];
      const L = sideWallAt(g, -1, 0.42), R = sideWallAt(g, 1, 0.42);
      stops.push({ room: 0, x: L.p[0] + L.n[0] * 2.8, z: L.p[1] + L.n[1] * 2.8, look: [L.p[0], 1.75, L.p[1]], title: "Artist statement", caption: "MINDED explores the relationship between intention and accident." });
      stops.push({ room: 0, x: R.p[0] + R.n[0] * 2.8, z: R.p[1] + R.n[1] * 2.8, look: [R.p[0], 1.9, R.p[1]], title: "Directory", caption: "Five rooms follow in sequence. Select a room on the wall to go straight there." });
    }
    hangs.filter((h) => h.roomId === r.id).forEach((h) => {
      const a = getArtwork(h.placement.artwork);
      const title = h.placement.display === "aura-simulation" ? "AURA 001 (SIMULATION)" : h.placement.display === "doc" ? `AURA 001: ${a?.images[h.placement.image ?? 0]?.kind === "documentation" ? "prototype documentation" : "concept visual"}` : a?.title ?? "";
      stops.push({ room: i, x: h.view.x, z: h.view.z, look: h.view.look, title, caption: a?.statement ?? "", hangId: h.id });
    });
    if (r.id === "room-05") {
      const g = ROOM_GEOMS[5];
      [-1, 1].forEach((side) => {
        const w = sideWallAt(g, side as -1 | 1, 0.5);
        stops.push({ room: i, x: w.p[0] + w.n[0] * 3.4, z: w.p[1] + w.n[1] * 3.4, look: [w.p[0], 1.6, w.p[1]], title: "The Archive", caption: side < 0 ? "Studio documentation, prototype development and photographic studies." : "Material tests, sketches, unfinished ideas and reflections, to be added by the artist." });
      });
    }
  });
  return stops;
}

export function hangsById(): Map<string, Hang> {
  return new Map(buildHangs(getRooms()).map((h) => [h.id, h]));
}
