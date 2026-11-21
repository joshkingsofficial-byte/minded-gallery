"use client";
import * as THREE from "three";

export const fonts = { serif: "Georgia, serif", sans: "system-ui, sans-serif" };

/** Resolve the next/font families and wait until they are usable in canvas. */
export async function loadFonts() {
  const cs = getComputedStyle(document.documentElement);
  const serif = cs.getPropertyValue("--font-serif-face").trim();
  const sans = cs.getPropertyValue("--font-sans-face").trim();
  if (serif) fonts.serif = `${serif}, Georgia, serif`;
  if (sans) fonts.sans = `${sans}, system-ui, sans-serif`;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`400 64px ${fonts.serif}`),
        document.fonts.load(`500 64px ${fonts.serif}`),
        document.fonts.load(`400 32px ${fonts.sans}`),
        document.fonts.load(`600 32px ${fonts.sans}`),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}
}

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: "left" | "center" = "left") {
  const chars = [...text];
  const total = chars.reduce((s, ch) => s + ctx.measureText(ch).width + spacing, -spacing);
  let cx = align === "center" ? x - total / 2 : x;
  ctx.textAlign = "left";
  for (const ch of chars) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
}

/** Vertical emissive ramp used to fake the cove light washing down the walls. */
export function coveRamp(): THREE.CanvasTexture {
  return canvasTexture(4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "#7a7a7a");
    g.addColorStop(0.5, "#828282");
    g.addColorStop(0.8, "#8e8e8e");
    g.addColorStop(0.94, "#c4c4c4");
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

export function ceilingTexture(): THREE.CanvasTexture {
  const t = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#f1f1ec"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function radialShadow(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(0,0,0,0.45)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

export interface LabelData { title: string; year: string; medium: string; dimensions: string; status: string; note?: string }

/** Gallery label: MINDED / TITLE / Year / Medium / Dimensions / Status */
export function labelTexture(d: LabelData): THREE.CanvasTexture {
  return canvasTexture(600, 760, (ctx, w, h) => {
    ctx.fillStyle = "#fbfbf8"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#205C45"; ctx.font = `600 24px ${fonts.sans}`;
    spaced(ctx, "MINDED", 48, 80, 7);
    ctx.fillStyle = "#171B19"; ctx.font = `500 50px ${fonts.serif}`;
    let y = 150;
    for (const l of wrapText(ctx, d.title, w - 96)) { ctx.fillText(l, 48, y); y += 54; }
    y += 14;
    ctx.font = `400 26px ${fonts.sans}`; ctx.fillStyle = "#171B19";
    ctx.fillText(d.year || "TBC", 48, y); y += 44;
    ctx.fillStyle = "#4d524e"; ctx.font = `400 24px ${fonts.sans}`;
    for (const l of wrapText(ctx, d.medium, w - 96).slice(0, 5)) { ctx.fillText(l, 48, y); y += 34; }
    y += 8;
    ctx.fillText(`Dimensions: ${d.dimensions || "TBC"}`, 48, y); y += 50;
    ctx.fillStyle = "#103D2C"; ctx.font = `600 21px ${fonts.sans}`;
    for (const l of wrapText(ctx, d.status.toUpperCase(), w - 96).slice(0, 3)) { spaced(ctx, l, 48, y, 2); y += 32; }
    if (d.note) {
      y += 16; ctx.fillStyle = "#6b706b"; ctx.font = `italic 400 22px ${fonts.sans}`;
      for (const l of wrapText(ctx, d.note, w - 96).slice(0, 4)) { ctx.fillText(l, 48, y); y += 30; }
    }
  });
}

/** A neutral placeholder card. */
export function placeholderTexture(title: string, line: string, w = 800, h = 600, dark = false): THREE.CanvasTexture {
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = dark ? "#1d2220" : "#ecebe5"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = dark ? "rgba(247,247,242,0.25)" : "rgba(23,27,25,0.25)"; ctx.setLineDash([12, 10]); ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, w - 48, h - 48); ctx.setLineDash([]);
    ctx.fillStyle = dark ? "#f7f7f2" : "#171B19"; ctx.textAlign = "center";
    ctx.font = `600 ${Math.round(w / 34)}px ${fonts.sans}`;
    spaced(ctx, title.toUpperCase(), w / 2, h / 2 - 20, 5, "center");
    ctx.fillStyle = dark ? "rgba(247,247,242,0.7)" : "#5c615d"; ctx.font = `400 ${Math.round(w / 30)}px ${fonts.serif}`;
    ctx.textAlign = "center";
    let y = h / 2 + 34;
    for (const l of wrapText(ctx, line, w - 160)) { ctx.fillText(l, w / 2, y); y += Math.round(w / 24); }
  });
}
