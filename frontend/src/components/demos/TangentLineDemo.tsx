"use client";

import { useId, useMemo, useState } from "react";
import DemoCard, { Control } from "./DemoCard";
import { formatNum, niceTicks } from "../viz/color";

type FnName = "square" | "cubic" | "sine";

const FNS: Record<
  FnName,
  {
    label: string;
    f: (x: number) => number;
    df: (x: number) => number;
    xlim: [number, number];
    ylim: [number, number];
  }
> = {
  square: {
    label: "f(x) = x²",
    f: (x) => x * x,
    df: (x) => 2 * x,
    xlim: [-3, 3],
    ylim: [-2, 9],
  },
  cubic: {
    label: "f(x) = x³ − 2x",
    f: (x) => x ** 3 - 2 * x,
    df: (x) => 3 * x * x - 2,
    xlim: [-2.2, 2.2],
    ylim: [-6, 6],
  },
  sine: {
    label: "f(x) = sin 2x",
    f: (x) => Math.sin(2 * x),
    df: (x) => 2 * Math.cos(2 * x),
    xlim: [-3, 3],
    ylim: [-1.7, 1.7],
  },
};

const W = 520;
const H = 300;
const M = { top: 12, right: 14, bottom: 30, left: 44 };

export default function TangentLineDemo() {
  const [fn, setFn] = useState<FnName>("square");
  const [a, setA] = useState(1);
  const [h, setH] = useState(1.2);
  const clipId = useId();

  const { f, df, xlim, ylim } = FNS[fn];
  const sx = (x: number) => M.left + ((x - xlim[0]) / (xlim[1] - xlim[0])) * (W - M.left - M.right);
  const sy = (y: number) => H - M.bottom - ((y - ylim[0]) / (ylim[1] - ylim[0])) * (H - M.top - M.bottom);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = xlim[0] + ((xlim[1] - xlim[0]) * i) / 160;
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`);
    }
    return pts.join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);

  const aClamped = Math.max(xlim[0] + 0.3, Math.min(xlim[1] - 0.3, a));
  const b = Math.min(xlim[1], aClamped + h);
  const fa = f(aClamped);
  const secantSlope = (f(b) - fa) / (b - aClamped || 1e-9);
  const tangentSlope = df(aClamped);

  // A line through (a, fa) with a given slope, spanning the x-domain (clipped).
  const lineThrough = (slope: number, color: string) => (
    <line
      x1={sx(xlim[0])}
      y1={sy(fa + slope * (xlim[0] - aClamped))}
      x2={sx(xlim[1])}
      y2={sy(fa + slope * (xlim[1] - aClamped))}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      clipPath={`url(#${clipId})`}
    />
  );

  const xTicks = niceTicks(xlim[0], xlim[1], 5);
  const yTicks = niceTicks(ylim[0], ylim[1], 4);

  return (
    <DemoCard
      title="From secant to tangent: the limit, visibly"
      controls={
        <>
          <div className="flex gap-1.5">
            {(Object.keys(FNS) as FnName[]).map((name) => (
              <button
                key={name}
                onClick={() => setFn(name)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  fn === name
                    ? "border-accent bg-accent text-white"
                    : "border-hairline bg-background text-ink-2 hover:text-foreground"
                }`}
              >
                {FNS[name].label}
              </button>
            ))}
          </div>
          <Control label={`a = ${aClamped.toFixed(2)}`}>
            <input
              type="range"
              min={xlim[0] + 0.3}
              max={xlim[1] - 0.3}
              step={0.05}
              value={aClamped}
              onChange={(e) => setA(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <Control label={`h = ${h.toFixed(2)}`}>
            <input
              type="range"
              min={0.05}
              max={2}
              step={0.05}
              value={h}
              onChange={(e) => setH(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          secant slope (f(a+h) − f(a)) / h = <strong>{formatNum(secantSlope)}</strong> · true
          derivative f′(a) = <strong>{formatNum(tangentSlope)}</strong> — shrink h and watch the
          secant collapse onto the tangent.
        </span>
      }
    >
      <div className="not-prose">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          {[
            { name: "f(x)", color: "var(--series-blue)" },
            { name: "tangent at a", color: "var(--series-aqua)" },
            { name: "secant through a, a+h", color: "var(--series-yellow)" },
          ].map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Graph of ${FNS[fn].label} with its tangent at a and the secant through a and a plus h`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
            </clipPath>
          </defs>
          {yTicks.map((t) => (
            <line key={`g${t}`} x1={M.left} x2={W - M.right} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth="1" />
          ))}
          <line x1={M.left} x2={W - M.right} y1={sy(0)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth="1" />
          {yTicks.map((t) => (
            <text key={`ty${t}`} x={M.left - 8} y={sy(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatNum(t)}
            </text>
          ))}
          {xTicks.map((t) => (
            <text key={`tx${t}`} x={sx(t)} y={H - M.bottom + 14} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatNum(t)}
            </text>
          ))}

          {lineThrough(secantSlope, "var(--series-yellow)")}
          {lineThrough(tangentSlope, "var(--series-aqua)")}
          <path d={curve} fill="none" stroke="var(--series-blue)" strokeWidth="2" strokeLinejoin="round" clipPath={`url(#${clipId})`} />

          <circle cx={sx(b)} cy={sy(f(b))} r="4" fill="var(--series-yellow)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle cx={sx(aClamped)} cy={sy(fa)} r="4.5" fill="var(--series-blue)" stroke="var(--viz-surface)" strokeWidth="2" />
          <text x={sx(aClamped)} y={sy(fa) - 10} textAnchor="middle" fontSize="10" fill="var(--foreground)">
            (a, f(a))
          </text>
          <text x={sx(b)} y={sy(f(b)) - 10} textAnchor="middle" fontSize="10" fill="var(--foreground)">
            a+h
          </text>
        </svg>
      </div>
    </DemoCard>
  );
}
