"use client";

import { useMemo, useRef, useState } from "react";
import { formatNum, niceTicks } from "./color";

const W = 340;
const M = { top: 8, right: 10, bottom: 30, left: 40 };
const PLOT = W - M.left - M.right; // square plot area

type Hover = { px: number; py: number; x: number; y: number; v: number } | null;

/** A square field plot: a scalar grid rendered to canvas (as an SVG image
 *  layer), with axes, hover tooltip, and an arbitrary SVG overlay drawn in
 *  data space via the children render prop. */
export default function HeatmapPlot({
  xs,
  ys,
  grid,
  colorFor,
  xlim,
  ylim,
  valueLabel,
  ariaLabel,
  children,
}: {
  xs: number[];
  ys: number[];
  grid: number[][];
  colorFor: (v: number) => string;
  xlim: [number, number];
  ylim: [number, number];
  valueLabel: string;
  ariaLabel: string;
  children?: (sx: (x: number) => number, sy: (y: number) => number) => React.ReactNode;
}) {
  const H = M.top + PLOT + M.bottom;
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Hover>(null);

  const sx = (x: number) => M.left + ((x - xlim[0]) / (xlim[1] - xlim[0])) * PLOT;
  const sy = (y: number) => M.top + PLOT - ((y - ylim[0]) / (ylim[1] - ylim[0])) * PLOT;

  const dataURL = useMemo(() => {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = xs.length;
    canvas.height = ys.length;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    for (let row = 0; row < ys.length; row++) {
      for (let col = 0; col < xs.length; col++) {
        ctx.fillStyle = colorFor(grid[row][col]);
        // canvas row 0 is the top; grid row 0 is the lowest y
        ctx.fillRect(col, ys.length - 1 - row, 1, 1);
      }
    }
    return canvas.toDataURL();
  }, [xs, ys, grid, colorFor]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const x = xlim[0] + ((px - M.left) / PLOT) * (xlim[1] - xlim[0]);
    const y = ylim[0] + ((M.top + PLOT - py) / PLOT) * (ylim[1] - ylim[0]);
    if (x < xlim[0] || x > xlim[1] || y < ylim[0] || y > ylim[1]) {
      setHover(null);
      return;
    }
    const col = Math.round(((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * (xs.length - 1));
    const row = Math.round(((y - ys[0]) / (ys[ys.length - 1] - ys[0])) * (ys.length - 1));
    const v = grid[Math.max(0, Math.min(ys.length - 1, row))][Math.max(0, Math.min(xs.length - 1, col))];
    setHover({ px, py, x, y, v });
  }

  const xTicks = niceTicks(xlim[0], xlim[1], 4);
  const yTicks = niceTicks(ylim[0], ylim[1], 4);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-md"
        style={{ background: "var(--viz-surface)" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={ariaLabel}
      >
        {dataURL && (
          <image
            href={dataURL}
            x={M.left}
            y={M.top}
            width={PLOT}
            height={PLOT}
            preserveAspectRatio="none"
          />
        )}
        {/* frame + ticks */}
        <rect
          x={M.left}
          y={M.top}
          width={PLOT}
          height={PLOT}
          fill="none"
          stroke="var(--viz-axis)"
          strokeWidth="1"
        />
        {xTicks.map((t) => (
          <text
            key={`x${t}`}
            x={sx(t)}
            y={M.top + PLOT + 13}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-muted)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatNum(t)}
          </text>
        ))}
        {yTicks.map((t) => (
          <text
            key={`y${t}`}
            x={M.left - 6}
            y={sy(t) + 3.5}
            textAnchor="end"
            fontSize="10"
            fill="var(--ink-muted)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatNum(t)}
          </text>
        ))}
        <text
          x={M.left + PLOT / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-muted)"
        >
          x
        </text>
        <text x={M.left - 24} y={M.top + 10} fontSize="10" fill="var(--ink-muted)">
          y
        </text>

        {children?.(sx, sy)}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: `${(hover.px / W) * 100}%`,
            top: `${(hover.py / H) * 100}%`,
            transform: `translate(${hover.px > W * 0.6 ? "-110%" : "12px"}, -50%)`,
          }}
        >
          <div className="text-ink-3" style={{ fontVariantNumeric: "tabular-nums" }}>
            ({formatNum(hover.x)}, {formatNum(hover.y)})
          </div>
          <div>
            <span className="text-ink-2">{valueLabel} </span>
            <span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatNum(hover.v)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
