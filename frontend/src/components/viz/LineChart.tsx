"use client";

import { useMemo, useRef, useState } from "react";
import { formatNum, niceTicks } from "./color";

export type Series = {
  name: string;
  /** CSS color — pass a var(--series-*) token so both themes work. */
  color: string;
  points: [number, number][];
};

type Hover = { px: number; py: number; index: number } | null;

const W = 520;
const H = 250;
const M = { top: 14, right: 70, bottom: 36, left: 52 };

/** SVG line chart per the dataviz mark specs: 2px lines, ≥8px end markers with
 *  a surface ring, hairline grid, crosshair + tooltip on hover, legend for ≥2
 *  series, direct end labels, optional table view. */
export default function LineChart({
  series,
  xLabel,
  yLabel,
  height = H,
  showTable = false,
}: {
  series: Series[];
  xLabel: string;
  yLabel: string;
  height?: number;
  showTable?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Hover>(null);

  const { xTicks, yTicks, sx, sy, xMin, xMax } = useMemo(() => {
    const xs = series.flatMap((s) => s.points.map((p) => p[0]));
    const ys = series.flatMap((s) => s.points.map((p) => p[1]));
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    const pad = (yMax - yMin || Math.abs(yMax) || 1) * 0.06;
    yMin -= pad;
    yMax += pad;
    const sx = (x: number) =>
      M.left + ((x - xMin) / (xMax - xMin || 1)) * (W - M.left - M.right);
    const sy = (y: number) =>
      height - M.bottom - ((y - yMin) / (yMax - yMin || 1)) * (height - M.top - M.bottom);
    return {
      xTicks: niceTicks(xMin, xMax, 5),
      yTicks: niceTicks(yMin, yMax, 4),
      sx,
      sy,
      xMin,
      xMax,
    };
  }, [series, height]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || series.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    // Nearest point by x within the longest series.
    const longest = series.reduce((a, b) => (a.points.length >= b.points.length ? a : b));
    let best = 0;
    let bestDist = Infinity;
    longest.points.forEach((p, i) => {
      const d = Math.abs(sx(p[0]) - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    const p = longest.points[best];
    setHover({ px: sx(p[0]), py: sy(p[1]), index: best });
  }

  const longest = series.reduce(
    (a, b) => (a.points.length >= b.points.length ? a : b),
    series[0],
  );

  return (
    <div className="not-prose">
      {series.length >= 2 && (
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${height}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Line chart of ${series.map((s) => s.name).join(", ")} versus ${xLabel}`}
        >
          {/* gridlines */}
          {yTicks.map((t) => (
            <line
              key={`gy${t}`}
              x1={M.left}
              x2={W - M.right}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--viz-grid)"
              strokeWidth="1"
            />
          ))}
          {/* baseline */}
          <line
            x1={M.left}
            x2={W - M.right}
            y1={height - M.bottom}
            y2={height - M.bottom}
            stroke="var(--viz-axis)"
            strokeWidth="1"
          />
          {/* tick labels */}
          {yTicks.map((t) => (
            <text
              key={`ty${t}`}
              x={M.left - 8}
              y={sy(t) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNum(t)}
            </text>
          ))}
          {xTicks.map((t) => (
            <text
              key={`tx${t}`}
              x={sx(t)}
              y={height - M.bottom + 14}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNum(t)}
            </text>
          ))}
          {/* axis titles */}
          <text
            x={(M.left + W - M.right) / 2}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-muted)"
          >
            {xLabel}
          </text>
          <text x={M.left} y={M.top - 3} fontSize="10" fill="var(--ink-muted)">
            {yLabel}
          </text>

          {/* crosshair */}
          {hover && (
            <line
              x1={hover.px}
              x2={hover.px}
              y1={M.top}
              y2={height - M.bottom}
              stroke="var(--viz-axis)"
              strokeWidth="1"
            />
          )}

          {/* series lines */}
          {series.map((s) => (
            <path
              key={s.name}
              d={s.points
                .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`)
                .join("")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* end markers with surface ring + direct end labels */}
          {series.map((s) => {
            const last = s.points[s.points.length - 1];
            if (!last) return null;
            return (
              <g key={`end${s.name}`}>
                <circle
                  cx={sx(last[0])}
                  cy={sy(last[1])}
                  r="4"
                  fill={s.color}
                  stroke="var(--viz-surface)"
                  strokeWidth="2"
                />
                <text
                  x={sx(last[0]) + 8}
                  y={sy(last[1]) + 3.5}
                  fontSize="10"
                  fill="var(--foreground)"
                >
                  {series.length >= 2 ? s.name : formatNum(last[1])}
                </text>
              </g>
            );
          })}

          {/* hover markers */}
          {hover &&
            series.map((s) => {
              const p = s.points[Math.min(hover.index, s.points.length - 1)];
              if (!p) return null;
              return (
                <circle
                  key={`h${s.name}`}
                  cx={sx(p[0])}
                  cy={sy(p[1])}
                  r="4"
                  fill={s.color}
                  stroke="var(--viz-surface)"
                  strokeWidth="2"
                />
              );
            })}
        </svg>

        {hover && longest && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-xs shadow-sm"
            style={{
              left: `${(hover.px / W) * 100}%`,
              top: `${(hover.py / height) * 100}%`,
              transform: `translate(${hover.px > W * 0.65 ? "-110%" : "12px"}, -50%)`,
            }}
          >
            <div className="text-ink-3">
              {xLabel} {formatNum(longest.points[hover.index][0])}
            </div>
            {series.map((s) => {
              const p = s.points[Math.min(hover.index, s.points.length - 1)];
              return p ? (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ background: s.color }}
                  />
                  <span className="text-ink-2">{s.name}</span>
                  <span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatNum(p[1])}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>

      {showTable && longest && (
        <details className="mt-1 text-xs text-ink-2">
          <summary className="cursor-pointer select-none text-ink-3">
            View as table
          </summary>
          <div className="mt-2 max-h-48 overflow-y-auto">
            <table className="w-full text-left" style={{ fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr className="border-b border-hairline">
                  <th className="py-1 pr-4 font-medium">{xLabel}</th>
                  {series.map((s) => (
                    <th key={s.name} className="py-1 pr-4 font-medium">
                      {s.name || yLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {longest.points
                  .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 25)) === 0)
                  .map((p, i) => (
                    <tr key={i} className="border-b border-hairline/50">
                      <td className="py-1 pr-4">{formatNum(p[0])}</td>
                      {series.map((s) => {
                        const q = s.points.find((sp) => sp[0] === p[0]);
                        return (
                          <td key={s.name} className="py-1 pr-4">
                            {q ? formatNum(q[1]) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
