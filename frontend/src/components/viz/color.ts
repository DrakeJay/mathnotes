"use client";

import { useEffect, useState } from "react";

/* Dataviz reference palette. The same values live as CSS custom properties in
   globals.css for SVG/DOM use; canvas rendering needs them as JS values. */

export const MODES = {
  light: {
    surface: "#fcfcfb",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    ink: "#0b0b0b",
    inkSecondary: "#52514e",
    muted: "#898781",
    blue: "#2a78d6",
    aqua: "#1baf7a",
    red: "#e34948",
    violet: "#4a3aa7",
    divergingMid: "#f0efec",
  },
  dark: {
    surface: "#1a1a19",
    grid: "#2c2c2a",
    axis: "#383835",
    ink: "#ffffff",
    inkSecondary: "#c3c2b7",
    muted: "#898781",
    blue: "#3987e5",
    aqua: "#199e70",
    red: "#e66767",
    violet: "#9085e9",
    divergingMid: "#383835",
  },
} as const;

export type VizMode = keyof typeof MODES;

/* Sequential blue ramp, steps 100 -> 700 (light = near zero). */
const SEQUENTIAL_BLUE = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Sample the sequential blue ramp at t in [0,1]. On dark surfaces the ramp is
 *  reversed so "near zero" recedes toward the (dark) surface. */
export function sequential(t: number, mode: VizMode): string {
  const u = Math.min(1, Math.max(0, mode === "dark" ? 1 - t : t));
  const pos = u * (SEQUENTIAL_BLUE.length - 1);
  const i = Math.min(SEQUENTIAL_BLUE.length - 2, Math.floor(pos));
  return mix(SEQUENTIAL_BLUE[i], SEQUENTIAL_BLUE[i + 1], pos - i);
}

/** Diverging blue <-> red with a neutral gray midpoint, t in [0,1], 0.5 = neutral. */
export function diverging(t: number, mode: VizMode): string {
  const { blue, red, divergingMid } = MODES[mode];
  const u = Math.min(1, Math.max(0, t));
  if (u >= 0.5) {
    return mix(divergingMid, blue, Math.pow((u - 0.5) * 2, 0.85));
  }
  return mix(divergingMid, red, Math.pow((0.5 - u) * 2, 0.85));
}

/** Tracks prefers-color-scheme so canvas-rendered layers match the CSS theme. */
export function useVizMode(): VizMode {
  const [mode, setMode] = useState<VizMode>("light");
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setMode(mq.matches ? "dark" : "light");
    const onChange = (e: MediaQueryListEvent) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mode;
}

export function formatNum(v: number): string {
  if (!Number.isFinite(v)) return "∞";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 10000) return v.toExponential(1);
  if (a >= 1000) return v.toLocaleString();
  if (a >= 1) return String(+v.toFixed(2));
  if (a >= 0.001) return String(+v.toFixed(3));
  return v.toExponential(1);
}

export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) max = min + 1;
  const span = max - min;
  const step0 = Math.pow(10, Math.floor(Math.log10(span / target)));
  const err = span / target / step0;
  const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}
