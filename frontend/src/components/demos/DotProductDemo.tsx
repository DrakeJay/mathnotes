"use client";

import { useRef, useState } from "react";
import DemoCard from "./DemoCard";
import { formatNum } from "../viz/color";

const W = 340;
const LIM = 3;
const GRID_RANGE = [-3, -2, -1, 0, 1, 2, 3];

type Vec = [number, number];

export default function DotProductDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState<Vec>([2, 1]);
  const [x, setX] = useState<Vec>([1, 2]);
  const [dragging, setDragging] = useState<"w" | "x" | null>(null);

  const sx = (px: number) => ((px + LIM) / (2 * LIM)) * W;
  const sy = (py: number) => ((LIM - py) / (2 * LIM)) * W;

  const dot = w[0] * x[0] + w[1] * x[1];
  const normW = Math.hypot(w[0], w[1]);
  const normX = Math.hypot(x[0], x[1]);
  const cos = normW && normX ? dot / (normW * normX) : 0;
  const theta = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  // Projection of x onto w.
  const projScale = normW ? dot / (normW * normW) : 0;
  const proj: Vec = [projScale * w[0], projScale * w[1]];

  function toWorld(e: React.PointerEvent): Vec {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * W;
    const clamp = (v: number) => Math.max(-LIM, Math.min(LIM, v));
    return [
      clamp(+((px / W) * 2 * LIM - LIM).toFixed(2)),
      clamp(+(LIM - (py / W) * 2 * LIM).toFixed(2)),
    ];
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const p = toWorld(e);
    if (dragging === "w") setW(p);
    else setX(p);
  }

  const arrow = (v: Vec, color: string, label: string, which: "w" | "x") => {
    const len = Math.hypot(v[0], v[1]);
    const ux = len ? v[0] / len : 1;
    const uy = len ? v[1] / len : 0;
    const hx = sx(v[0]);
    const hy = sy(v[1]);
    const scale = W / (2 * LIM);
    return (
      <g>
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={hx}
          y2={hy}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {len > 0.05 && (
          <polygon
            points={`${hx},${hy} ${hx - (ux * 0.24 - uy * 0.12) * scale},${hy + (uy * 0.24 + ux * 0.12) * scale} ${hx - (ux * 0.24 + uy * 0.12) * scale},${hy + (uy * 0.24 - ux * 0.12) * scale}`}
            fill={color}
          />
        )}
        <text
          x={hx + ux * 16 + 2}
          y={hy - uy * 16 + 4}
          fontSize="13"
          fontStyle="italic"
          fill="var(--foreground)"
        >
          {label}
        </text>
        {/* drag handle: visible dot with surface ring + oversized hit target */}
        <circle cx={hx} cy={hy} r="5" fill={color} stroke="var(--viz-surface)" strokeWidth="2" />
        <circle
          cx={hx}
          cy={hy}
          r="16"
          fill="transparent"
          style={{ cursor: "grab", touchAction: "none" }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            setDragging(which);
          }}
          onPointerUp={() => setDragging(null)}
        />
      </g>
    );
  };

  return (
    <DemoCard
      title="The dot product, geometrically"
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          <strong>w · x = {formatNum(dot)}</strong> · ‖w‖ = {formatNum(normW)} · ‖x‖ ={" "}
          {formatNum(normX)} · θ = {theta.toFixed(0)}° · cos θ = {formatNum(cos)} —{" "}
          {Math.abs(dot) < 0.15
            ? "nearly orthogonal: x carries almost no evidence along w"
            : dot > 0
              ? "aligned: x points with w"
              : "opposed: x points against w"}
        </span>
      }
    >
      <div className="mx-auto max-w-sm">
        <p className="mb-1 text-xs text-ink-3">
          Drag the arrowheads. The thick segment along <em>w</em> is x&apos;s projection —
          its signed length times ‖w‖ is the dot product.
        </p>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${W}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)", touchAction: "none" }}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(null)}
          role="img"
          aria-label="Two draggable vectors w and x with their dot product, angle, and the projection of x onto w"
        >
          {GRID_RANGE.map((k) => (
            <g key={k}>
              <line x1={sx(k)} y1={0} x2={sx(k)} y2={W} stroke="var(--viz-grid)" strokeWidth="1" />
              <line x1={0} y1={sy(k)} x2={W} y2={sy(k)} stroke="var(--viz-grid)" strokeWidth="1" />
            </g>
          ))}
          <line x1={sx(-LIM)} y1={sy(0)} x2={sx(LIM)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth="1" />
          <line x1={sx(0)} y1={sy(-LIM)} x2={sx(0)} y2={sy(LIM)} stroke="var(--viz-axis)" strokeWidth="1" />

          {/* projection: drop line from x to its shadow on w's line, then the shadow itself */}
          <line
            x1={sx(x[0])}
            y1={sy(x[1])}
            x2={sx(proj[0])}
            y2={sy(proj[1])}
            stroke="var(--ink-muted)"
            strokeWidth="1"
          />
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(proj[0])}
            y2={sy(proj[1])}
            stroke="var(--series-aqua)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.9"
          />

          {arrow(w, "var(--series-blue)", "w", "w")}
          {arrow(x, "var(--series-red)", "x", "x")}
        </svg>
      </div>
    </DemoCard>
  );
}
