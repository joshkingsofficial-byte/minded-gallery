"use client";
import { create } from "zustand";

export type Mode = "free" | "guided";
export type Selection =
  | { type: "artwork"; slug: string; image?: number; hangId?: string }
  | { type: "archive"; section: number; entry: number }
  | null;

interface UIState {
  started: boolean;
  ready: boolean;
  mode: Mode;
  tourIndex: number;
  roomIndex: number;
  selection: Selection;
  near: { hangId: string; label: string } | null;
  sound: boolean;
  fading: boolean;
  auraMirror: boolean;
  roomsOpen: boolean;
  set: (p: Partial<UIState>) => void;
}

export const useUI = create<UIState>((set) => ({
  started: false,
  ready: false,
  mode: "free",
  tourIndex: 0,
  roomIndex: 0,
  selection: null,
  near: null,
  sound: false,
  fading: false,
  auraMirror: false,
  roomsOpen: false,
  set: (p) => set(p),
}));
