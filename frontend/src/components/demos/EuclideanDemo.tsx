"use client";

import { useEffect, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

const GOOD = "#0ca30c";
const COLORS = ["var(--series-blue)", "var(--series-aqua)", "var(--series-yellow)", "var(--series-violet)"];

type Step = { a: number; b: number; q: number; r: number };
type TileStep = { size: number; rects: { x: number; y: number; s: number }[] };

function euclidSteps(a: number, b: number): Step[] {
  const steps: Step[] = [];
  while (b > 0) {
    const q = Math.floor(a / b);
    const r = a - q * b;
    steps.push({ a, b, q, r });
    a = b;
    b = r;
  }
  return steps;
}

function tiling(a: number, b: number): TileStep[] {
  let x = 0, y = 0, w = a, h = b;
  const out: TileStep[] = [];
  while (w > 0 && h > 0) {
    const rects: { x: number; y: number; s: number }[] = [];
    if (w >= h) {
      const q = Math.floor(w / h);
      for (let i = 0; i < q; i++) rects.push({ x: x + i * h, y, s: h });
      out.push({ size: h, rects });
      x += q * h;
      w -= q * h;
    } else {
      const q = Math.floor(h / w);
      for (let i = 0; i < q; i++) rects.push({ x, y: y + i * w, s: w });
      out.push({ size: w, rects });
      y += q * w;
      h -= q * w;
    }
  }
  return out;
}

function extendedGcd(a: number, b: number): { g: number; x: number; y: number } {
  if (b === 0) return { g: a, x: 1, y: 0 };
  const sub = extendedGcd(b, a % b);
  return { g: sub.g, x: sub.y, y: sub.x - Math.floor(a / b) * sub.y };
}

const PRESETS: { label: string; a: number; b: number }[] = [
  { label: "252 × 105 (the classic)", a: 252, b: 105 },
  { label: "89 × 55 (Fibonacci — worst case)", a: 89, b: 55 },
  { label: "35 × 12 (coprime)", a: 35, b: 12 },
  { label: "210 × 70 (one divides the other)", a: 210, b: 70 },
];

const clampSide = (v: number) => Math.max(1, Math.min(400, Math.round(v) || 1));

export default function EuclideanDemo() {
  const [aInput, setAInput] = useState(252);
  const [bInput, setBInput] = useState(105);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  const A = Math.max(clampSide(aInput), clampSide(bInput));
  const B = Math.min(clampSide(aInput), clampSide(bInput));

  const steps = useMemo(() => euclidSteps(A, B), [A, B]);
  const tiles = useMemo(() => tiling(A, B), [A, B]);
  const bezout = useMemo(() => extendedGcd(A, B), [A, B]);

  const done = pos >= steps.length;
  const g = steps.length ? steps[steps.length - 1].b : A;

  function setNumbers(a: number, b: number) {
    setAInput(a);
    setBInput(b);
    setPos(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (pos >= steps.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setPos((p) => p + 1), 700);
    return () => clearTimeout(t);
  }, [running, pos, steps]);

  // drawing
  const PAD = 10;
  const VW = 500;
  const VH = 330;
  const scale = Math.min((VW - 2 * PAD) / A, (VH - 2 * PAD) / B);
  const sx = (v: number) => PAD + v * scale;
  const sy = (v: number) => PAD + v * scale;

  const cf = steps.length
    ? `[${steps[0].q}${steps.length > 1 ? "; " + steps.slice(1).map((s) => s.q).join(", ") : ""}]`
    : "[]";

  return (
    <DemoCard
      title="The gcd as a tiling"
      controls={
        <>
          <Control label="Preset">
            <select
              className={selectClass}
              value=""
              onChange={(e) => {
                const p = PRESETS.find((x) => x.label === e.target.value);
                if (p) setNumbers(p.a, p.b);
              }}
            >
              <option value="" disabled>
                Choose…
              </option>
              {PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label="a">
            <input
              type="number"
              min={1}
              max={400}
              value={aInput}
              onChange={(e) => {
                setAInput(Number(e.target.value));
                setPos(0);
                setRunning(false);
              }}
              className={`${selectClass} w-20`}
            />
          </Control>
          <Control label="b">
            <input
              type="number"
              min={1}
              max={400}
              value={bInput}
              onChange={(e) => {
                setBInput(Number(e.target.value));
                setPos(0);
                setRunning(false);
              }}
              className={`${selectClass} w-20`}
            />
          </Control>
          <button className={buttonClass} onClick={() => setPos((p) => Math.min(p + 1, steps.length))} disabled={done}>
            Step
          </button>
          <button className={buttonClass} onClick={() => setRunning((r) => !r)} disabled={done}>
            {running ? "Pause" : "Run"}
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => {
              setPos(0);
              setRunning(false);
            }}
          >
            Reset
          </button>
        </>
      }
      footer={
        done ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            gcd({A}, {B}) = <strong style={{ color: GOOD }}>{g}</strong> in {steps.length} step(s) ·
            Bézout: {A}·({bezout.x}) + {B}·{bezout.y >= 0 ? bezout.y : `(${bezout.y})`} = {g} ·
            continued fraction {A}/{B} = {cf}
          </span>
        ) : (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {steps.length - pos} division step(s) remaining — each slices the largest square that
            fits into what's left.
          </span>
        )
      }
    >
      <div className="not-prose grid gap-4 sm:grid-cols-[1fr_auto]">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`A ${A} by ${B} rectangle being tiled by squares; ${pos} of ${steps.length} division steps done`}
        >
          <rect x={sx(0)} y={sy(0)} width={A * scale} height={B * scale} fill="none" stroke="var(--viz-axis)" strokeWidth="1.5" />
          {tiles.slice(0, pos).map((ts, i) =>
            ts.rects.map((r, j) => (
              <g key={`${i}-${j}`}>
                <rect
                  x={sx(r.x)}
                  y={sy(r.y)}
                  width={r.s * scale}
                  height={r.s * scale}
                  fill={COLORS[i % COLORS.length]}
                  opacity="0.2"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="1.5"
                />
                {r.s * scale > 28 && (
                  <text
                    x={sx(r.x) + (r.s * scale) / 2}
                    y={sy(r.y) + (r.s * scale) / 2 + 3.5}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--foreground)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.s}
                  </text>
                )}
              </g>
            )),
          )}
          <text x={sx(0)} y={VH - 2} fontSize="10" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {A} × {B}
          </text>
        </svg>

        {/* the division table */}
        <div className="text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
          <p className="mb-1 text-ink-3">division steps</p>
          <table className="font-mono">
            <tbody>
              {steps.map((s, i) => (
                <tr
                  key={i}
                  className={
                    i < pos ? (i === pos - 1 ? "font-bold" : "text-ink-2") : "text-ink-3 opacity-40"
                  }
                >
                  <td className="py-0.5 pr-2 text-right">{s.a}</td>
                  <td className="py-0.5">= {s.q} × {s.b} + {s.r}</td>
                </tr>
              ))}
              {done && (
                <tr>
                  <td />
                  <td className="pt-1 font-bold" style={{ color: GOOD }}>
                    gcd = {g}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DemoCard>
  );
}
