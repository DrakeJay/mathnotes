"use client";

import { useMemo, useRef, useState } from "react";
import DemoCard, { Control, selectClass } from "./DemoCard";

const W = 560;
const H = 330;
const BASE = 258;
const PAD = 30;

const PRESETS: { label: string; values: number[] }[] = [
  { label: "Symmetric", values: [30, 38, 44, 50, 50, 56, 62, 70] },
  { label: "Skewed", values: [20, 24, 27, 30, 34, 40, 48, 60, 75] },
  { label: "Outlier (the billionaire)", values: [12, 15, 18, 20, 22, 25, 28, 95] },
];

export default function DescriptiveStatsDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [values, setValues] = useState<number[]>(PRESETS[0].values);
  const [dragging, setDragging] = useState<number | null>(null);
  const [showSquares, setShowSquares] = useState(false);

  const sx = (v: number) => PAD + (v / 100) * (W - 2 * PAD);

  const stats = useMemo(() => {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return { mean, median, sd: Math.sqrt(variance) };
  }, [values]);

  function onMove(e: React.PointerEvent) {
    if (dragging === null) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const v = Math.max(0, Math.min(100, Math.round(((px - PAD) / (W - 2 * PAD)) * 100 * 2) / 2));
    setValues(values.map((x, i) => (i === dragging ? v : x)));
  }

  // stack nearby points vertically so they don't overlap
  const stackIndex = (i: number) =>
    values.filter((v, j) => j < i && Math.abs(v - values[i]) < 2.5).length;

  const gap = stats.mean - stats.median;
  const note =
    Math.abs(gap) < 3
      ? "mean and median agree — the data is roughly symmetric"
      : gap > 0
        ? `the mean sits ${gap.toFixed(1)} above the median — pulled by the right tail`
        : `the mean sits ${(-gap).toFixed(1)} below the median — pulled by the left tail`;

  return (
    <DemoCard
      title="Center and spread, draggable"
      controls={
        <>
          <Control label="Preset">
            <select
              className={selectClass}
              value=""
              onChange={(e) => {
                const p = PRESETS.find((x) => x.label === e.target.value);
                if (p) {
                  setValues([...p.values]);
                  setDragging(null);
                }
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
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => values.length < 16 && setValues([...values, 50])}
          >
            + point
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => values.length > 2 && setValues(values.slice(0, -1))}
          >
            − point
          </button>
          <label className="flex items-center gap-1.5 pb-1 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={showSquares}
              onChange={(e) => setShowSquares(e.target.checked)}
              className="accent-(--series-blue)"
            />
            squared deviations (variance = average area)
          </label>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          mean = <strong>{stats.mean.toFixed(1)}</strong> · median ={" "}
          <strong>{stats.median.toFixed(1)}</strong> · σ = {stats.sd.toFixed(1)} — {note}
        </span>
      }
    >
      <div className="not-prose">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-blue)" }} />
            mean (balance point)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-aqua)" }} />
            median (middle value)
          </span>
          <span className="text-ink-3">shaded band = mean ± 1σ · drag the points</span>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)", touchAction: "none" }}
          onPointerMove={onMove}
          onPointerUp={() => setDragging(null)}
          role="img"
          aria-label={`Dot plot of ${values.length} draggable points with mean ${stats.mean.toFixed(1)}, median ${stats.median.toFixed(1)}, standard deviation ${stats.sd.toFixed(1)}`}
        >
          {/* ±1σ band */}
          <rect
            x={sx(Math.max(0, stats.mean - stats.sd))}
            y={86}
            width={sx(Math.min(100, stats.mean + stats.sd)) - sx(Math.max(0, stats.mean - stats.sd))}
            height={BASE - 86}
            fill="var(--series-blue)"
            opacity="0.07"
          />

          {/* squared deviations */}
          {showSquares &&
            values.map((v, i) => {
              const side = Math.abs(sx(v) - sx(stats.mean));
              if (side < 1) return null;
              return (
                <rect
                  key={`sq${i}`}
                  x={Math.min(sx(v), sx(stats.mean))}
                  y={BASE - side}
                  width={side}
                  height={side}
                  fill="var(--series-yellow)"
                  opacity="0.13"
                  stroke="var(--series-yellow)"
                  strokeWidth="1"
                />
              );
            })}

          {/* number line */}
          <line x1={PAD} x2={W - PAD} y1={BASE} y2={BASE} stroke="var(--viz-axis)" strokeWidth="1.5" />
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={BASE} y2={BASE + 5} stroke="var(--viz-axis)" strokeWidth="1" />
              <text x={sx(t)} y={BASE + 18} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {t}
              </text>
            </g>
          ))}

          {/* mean & median markers */}
          <line x1={sx(stats.mean)} x2={sx(stats.mean)} y1={64} y2={BASE + 6} stroke="var(--series-blue)" strokeWidth="2" />
          <text x={sx(stats.mean)} y={56} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            mean {stats.mean.toFixed(1)}
          </text>
          <line x1={sx(stats.median)} x2={sx(stats.median)} y1={90} y2={BASE + 6} stroke="var(--series-aqua)" strokeWidth="2" />
          <text x={sx(stats.median)} y={82} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            median {stats.median.toFixed(1)}
          </text>

          {/* the points */}
          {values.map((v, i) => {
            const y = BASE - 14 - stackIndex(i) * 15;
            return (
              <g key={i}>
                <circle cx={sx(v)} cy={y} r="6" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
                <circle
                  cx={sx(v)}
                  cy={y}
                  r="14"
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => {
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setDragging(i);
                  }}
                  onPointerUp={() => setDragging(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </DemoCard>
  );
}
