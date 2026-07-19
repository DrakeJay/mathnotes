"use client";

import { useMemo, useRef, useState } from "react";
import DemoCard, { Control, selectClass } from "./DemoCard";
import { formatNum } from "../viz/color";

/* Two stacked panels in one SVG: f(x) on top (draw on it with the pointer),
   f'(x) below, computed by central differences and redrawn on every edit. */

const N = 241;
const XMIN = -3;
const XMAX = 3;
const YMAX = 2.6; // top panel y-range: [-YMAX, YMAX]
const DMAX = 3; // bottom panel y-range: [-DMAX, DMAX]

const W = 520;
const ML = 46;
const MR = 14;
const PLOT_W = W - ML - MR;
const TOP_Y = 12;
const TOP_H = 220;
const BOT_Y = 262;
const BOT_H = 140;
const H = BOT_Y + BOT_H + 34;

const xs = Array.from({ length: N }, (_, i) => XMIN + ((XMAX - XMIN) * i) / (N - 1));
const STEP = xs[1] - xs[0];

const sx = (x: number) => ML + ((x - XMIN) / (XMAX - XMIN)) * PLOT_W;
const syT = (y: number) => TOP_Y + ((YMAX - y) / (2 * YMAX)) * TOP_H;
const syB = (d: number) => BOT_Y + ((DMAX - d) / (2 * DMAX)) * BOT_H;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const PRESETS: { value: string; label: string; fn: (x: number) => number }[] = [
  { value: "sin", label: "sin x", fn: (x) => Math.sin(x) },
  { value: "cubic", label: "x³/9 − x", fn: (x) => (x * x * x) / 9 - x },
  { value: "bell", label: "bell curve 2e^(−x²)", fn: (x) => 2 * Math.exp(-x * x) },
  { value: "abs", label: "corner |x| − 1", fn: (x) => Math.abs(x) - 1 },
];

function samplePreset(value: string): number[] {
  const preset = PRESETS.find((p) => p.value === value) ?? PRESETS[0];
  return xs.map(preset.fn);
}

function centralDiff(f: number[]): number[] {
  const d = new Array<number>(N);
  for (let i = 1; i < N - 1; i++) d[i] = (f[i + 1] - f[i - 1]) / (2 * STEP);
  d[0] = (f[1] - f[0]) / STEP;
  d[N - 1] = (f[N - 1] - f[N - 2]) / STEP;
  return d;
}

/* Stationary points: sign changes of f' after squashing |f'| < 0.03 to zero,
   so hand-drawn plateaus and edge noise don't count. */
function stationaryBins(d: number[]): number[] {
  const bins: number[] = [];
  let last = 0;
  for (let i = 0; i < N; i++) {
    const s = d[i] > 0.03 ? 1 : d[i] < -0.03 ? -1 : 0;
    if (s !== 0) {
      if (last !== 0 && s !== last) bins.push(i);
      last = s;
    }
  }
  return bins;
}

function toPath(vals: number[], sy: (v: number) => number, lim: number): string {
  return vals
    .map((v, i) => `${i === 0 ? "M" : "L"}${sx(xs[i]).toFixed(1)},${sy(clamp(v, -lim, lim)).toFixed(1)}`)
    .join("");
}

export default function DerivativeGrapherDemo() {
  const [preset, setPreset] = useState("sin");
  const [ys, setYs] = useState<number[]>(() => samplePreset("sin"));
  const [markZeros, setMarkZeros] = useState(true);
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ bin: number; val: number } | null>(null);
  const strokeRef = useRef<[number, number]>([N, -1]);

  const deriv = useMemo(() => centralDiff(ys), [ys]);
  const zeros = useMemo(() => stationaryBins(deriv), [deriv]);

  function toLocal(e: React.PointerEvent<SVGSVGElement>): { px: number; py: number } | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      px: ((e.clientX - rect.left) / rect.width) * W,
      py: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function applyStroke(bin: number, val: number) {
    const from = lastRef.current ?? { bin, val };
    setYs((prev) => {
      const next = prev.slice();
      const lo = Math.min(from.bin, bin);
      const hi = Math.max(from.bin, bin);
      for (let b = lo; b <= hi; b++) {
        const t = hi === lo ? 1 : (b - lo) / (hi - lo);
        next[b] = from.bin <= bin ? from.val + t * (val - from.val) : val + t * (from.val - val);
      }
      return next;
    });
    strokeRef.current = [
      Math.min(strokeRef.current[0], Math.min(from.bin, bin)),
      Math.max(strokeRef.current[1], Math.max(from.bin, bin)),
    ];
    lastRef.current = { bin, val };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const pt = toLocal(e);
    if (!pt) return;
    const inTop =
      pt.px >= ML && pt.px <= W - MR && pt.py >= TOP_Y && pt.py <= TOP_Y + TOP_H;
    if (!inTop) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = null;
    strokeRef.current = [N, -1];
    const bin = clamp(Math.round(((pt.px - ML) / PLOT_W) * (N - 1)), 0, N - 1);
    const val = clamp(YMAX - ((pt.py - TOP_Y) / TOP_H) * 2 * YMAX, -2.5, 2.5);
    applyStroke(bin, val);
    setDrawn(true);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const pt = toLocal(e);
    if (!pt) return;
    const bin = clamp(Math.round(((pt.px - ML) / PLOT_W) * (N - 1)), 0, N - 1);
    if (drawingRef.current) {
      const val = clamp(YMAX - ((pt.py - TOP_Y) / TOP_H) * 2 * YMAX, -2.5, 2.5);
      applyStroke(bin, val);
    }
    setHoverBin(pt.px >= ML && pt.px <= W - MR ? bin : null);
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    // Light smoothing over the stroked range: differentiation amplifies hand
    // wobble, so take two passes of a [1 2 1]/4 kernel before showing f'.
    const [lo, hi] = strokeRef.current;
    if (hi >= lo) {
      setYs((prev) => {
        let next = prev.slice();
        for (let pass = 0; pass < 2; pass++) {
          const src = next.slice();
          for (let b = Math.max(1, lo - 2); b <= Math.min(N - 2, hi + 2); b++) {
            next[b] = 0.25 * src[b - 1] + 0.5 * src[b] + 0.25 * src[b + 1];
          }
        }
        return next;
      });
    }
  }

  function loadPreset(value: string) {
    setPreset(value);
    setYs(samplePreset(value));
    setDrawn(false);
  }

  const hover =
    hoverBin !== null
      ? { x: xs[hoverBin], f: ys[hoverBin], d: deriv[hoverBin] }
      : null;

  const topTicks = [-2, -1, 0, 1, 2];
  const botTicks = [-2, 0, 2];
  const xTicks = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <DemoCard
      title="Draw a function, get its derivative"
      controls={
        <>
          <Control label="Preset">
            <select
              className={selectClass}
              value={preset}
              onChange={(e) => loadPreset(e.target.value)}
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Control>
          <label className="flex items-center gap-1.5 pb-1 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={markZeros}
              onChange={(e) => setMarkZeros(e.target.checked)}
              className="accent-(--series-violet)"
            />
            mark f′ = 0
          </label>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => loadPreset(preset)}
          >
            Reset curve
          </button>
        </>
      }
      footer={
        <span>
          The lower curve is computed by central differences, f′(x) ≈ (f(x+h) −
          f(x−h)) / 2h — the same finite-difference check this site&apos;s test
          suite uses to verify backpropagation. Differentiation amplifies noise:
          draw with a wobbly hand and the wobble comes out far taller below.
        </span>
      }
    >
      <div
        className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span aria-label="stationary points">
          stationary points (f′ = 0): <strong>{zeros.length}</strong>
        </span>
        <span className="text-ink-3">
          {hover
            ? `x = ${formatNum(hover.x)} · f(x) = ${formatNum(hover.f)} · slope f′(x) = ${formatNum(hover.d)}`
            : drawn
              ? "hover for the tangent line"
              : "drag on the upper graph to draw your own f"}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair rounded-md"
        style={{ background: "var(--viz-surface)", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHoverBin(null);
        }}
        role="img"
        aria-label="A function you can draw on, and its derivative computed below it"
      >
        {/* ---- top panel: f ---- */}
        {topTicks.map((t) => (
          <g key={`t${t}`}>
            <line
              x1={ML}
              x2={W - MR}
              y1={syT(t)}
              y2={syT(t)}
              stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
              strokeWidth="1"
            />
            <text
              x={ML - 6}
              y={syT(t) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {t}
            </text>
          </g>
        ))}
        <rect
          x={ML}
          y={TOP_Y}
          width={PLOT_W}
          height={TOP_H}
          fill="none"
          stroke="var(--viz-axis)"
          strokeWidth="1"
        />
        <text x={ML + 8} y={TOP_Y + 14} fontSize="11" fontWeight="600" fill="var(--series-blue)">
          f(x)
        </text>
        <path d={toPath(ys, syT, 2.55)} fill="none" stroke="var(--series-blue)" strokeWidth="2" />

        {/* ---- bottom panel: f' ---- */}
        {botTicks.map((t) => (
          <g key={`b${t}`}>
            <line
              x1={ML}
              x2={W - MR}
              y1={syB(t)}
              y2={syB(t)}
              stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
              strokeWidth="1"
            />
            <text
              x={ML - 6}
              y={syB(t) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {t}
            </text>
          </g>
        ))}
        <rect
          x={ML}
          y={BOT_Y}
          width={PLOT_W}
          height={BOT_H}
          fill="none"
          stroke="var(--viz-axis)"
          strokeWidth="1"
        />
        <text x={ML + 8} y={BOT_Y + 14} fontSize="11" fontWeight="600" fill="var(--series-aqua)">
          f′(x)
        </text>
        <path d={toPath(deriv, syB, 2.95)} fill="none" stroke="var(--series-aqua)" strokeWidth="2" />

        {xTicks.map((t) => (
          <text
            key={`x${t}`}
            x={sx(t)}
            y={BOT_Y + BOT_H + 14}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-muted)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {t}
          </text>
        ))}
        <text x={ML + PLOT_W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">
          x
        </text>

        {/* ---- stationary-point markers: peaks/valleys above, zeros below ---- */}
        {markZeros &&
          zeros.map((b) => (
            <g key={`z${b}`}>
              <circle
                cx={sx(xs[b])}
                cy={syT(clamp(ys[b], -2.55, 2.55))}
                r="4"
                fill="var(--viz-surface)"
                stroke="var(--series-violet)"
                strokeWidth="2"
              />
              <circle
                cx={sx(xs[b])}
                cy={syB(clamp(deriv[b], -2.95, 2.95))}
                r="4"
                fill="var(--viz-surface)"
                stroke="var(--series-violet)"
                strokeWidth="2"
              />
            </g>
          ))}

        {/* ---- hover: crosshair, tangent line on f, matching point on f' ---- */}
        {hover && (
          <g pointerEvents="none">
            <line
              x1={sx(hover.x)}
              x2={sx(hover.x)}
              y1={TOP_Y}
              y2={BOT_Y + BOT_H}
              stroke="var(--ink-muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            {Math.abs(hover.f) <= 2.5 && (
              <line
                x1={sx(clamp(hover.x - 0.45, XMIN, XMAX))}
                y1={syT(clamp(hover.f - 0.45 * hover.d, -2.55, 2.55))}
                x2={sx(clamp(hover.x + 0.45, XMIN, XMAX))}
                y2={syT(clamp(hover.f + 0.45 * hover.d, -2.55, 2.55))}
                stroke="var(--series-red)"
                strokeWidth="2"
              />
            )}
            <circle
              cx={sx(hover.x)}
              cy={syT(clamp(hover.f, -2.55, 2.55))}
              r="3.5"
              fill="var(--series-blue)"
              stroke="var(--viz-surface)"
              strokeWidth="1.5"
            />
            <circle
              cx={sx(hover.x)}
              cy={syB(clamp(hover.d, -2.95, 2.95))}
              r="3.5"
              fill="var(--series-aqua)"
              stroke="var(--viz-surface)"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      <p className="mt-2 text-xs text-ink-3">
        The red segment is the tangent at the hovered point — its slope up top is
        the height of the aqua dot below. Open circles mark where f′ crosses
        zero: the peaks and valleys of f.
      </p>
    </DemoCard>
  );
}
