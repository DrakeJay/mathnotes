"use client";

import { useRef, useState } from "react";
import DemoCard from "./DemoCard";
import { angleDeg, arcAt, arcSweep, type Vec } from "./geometry";

const W = 360;
const H = 352;
const CX = 180;
const CY = 176;
const SCALE = 116;
const R = 1.3;

type Handle = "A" | "B" | "C";

const norm360 = (d: number) => ((d % 360) + 360) % 360;

export default function InscribedAngleDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [angles, setAngles] = useState<Record<Handle, number>>({ A: 205, B: 335, C: 88 });
  const [dragging, setDragging] = useState<Handle | null>(null);

  const sx = (x: number) => CX + x * SCALE;
  const sy = (y: number) => CY - y * SCALE;
  const pointAt = (deg: number): Vec => {
    const r = (deg * Math.PI) / 180;
    return [sx(R * Math.cos(r)), sy(R * Math.sin(r))];
  };

  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const wx = (((e.clientX - rect.left) / rect.width) * W - CX) / SCALE;
    const wy = (CY - ((e.clientY - rect.top) / rect.height) * H) / SCALE;
    let t = norm360((Math.atan2(wy, wx) * 180) / Math.PI);
    // keep the three points at least a few degrees apart
    const others = (Object.keys(angles) as Handle[]).filter((k) => k !== dragging);
    for (const k of others) {
      let diff = norm360(t - angles[k]);
      if (diff > 180) diff -= 360;
      if (Math.abs(diff) < 5) t = norm360(angles[k] + (diff >= 0 ? 5 : -5));
    }
    setAngles({ ...angles, [dragging]: t });
  }

  const a = pointAt(angles.A);
  const b = pointAt(angles.B);
  const c = pointAt(angles.C);
  const o: Vec = [sx(0), sy(0)];
  const dir = (from: Vec, to: Vec): Vec => [to[0] - from[0], to[1] - from[1]];

  // The subtended arc is the one from A to B *not* containing C. Central
  // angle = that arc's measure (can exceed 180°); inscribed = half of it.
  const ccwAtoB = norm360(angles.B - angles.A);
  const cInCcwArc = norm360(angles.C - angles.A) < ccwAtoB;
  const central = cInCcwArc ? 360 - ccwAtoB : ccwAtoB;
  const inscribed = angleDeg(dir(c, a), dir(c, b));

  // Screen-space arc for the subtended arc (screen angles are -world).
  const arcStart = (-angles.A * Math.PI) / 180;
  const sweepWorld = cInCcwArc ? -(360 - ccwAtoB) : ccwAtoB; // world CCW degrees
  const sweepScreen = (-sweepWorld * Math.PI) / 180;

  const handles: { id: Handle; p: Vec; color: string }[] = [
    { id: "A", p: a, color: "var(--series-blue)" },
    { id: "B", p: b, color: "var(--series-blue)" },
    { id: "C", p: c, color: "var(--series-red)" },
  ];

  return (
    <DemoCard
      title="Inscribed angle = half the central angle"
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          central θ = <strong>{central.toFixed(1)}°</strong> · inscribed ∠ACB ={" "}
          <strong>{inscribed.toFixed(1)}°</strong> · ratio ={" "}
          {(central / Math.max(inscribed, 0.001)).toFixed(2)} — slide C along its arc: the
          inscribed angle refuses to change.
        </span>
      }
    >
      <div className="not-prose mx-auto max-w-sm">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-red)" }} />
            subtended arc + central angle θ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-blue)" }} />
            inscribed angle θ/2
          </span>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)", touchAction: "none" }}
          onPointerMove={onMove}
          onPointerUp={() => setDragging(null)}
          role="img"
          aria-label={`Inscribed angle theorem: central angle ${central.toFixed(0)} degrees, inscribed angle ${inscribed.toFixed(0)} degrees`}
        >
          <circle cx={o[0]} cy={o[1]} r={R * SCALE} fill="none" stroke="var(--viz-axis)" strokeWidth="1.5" />
          {/* the subtended arc, on the circle itself */}
          <path d={arcSweep(o[0], o[1], arcStart, sweepScreen, R * SCALE)} fill="none" stroke="var(--series-red)" strokeWidth="3.5" strokeLinecap="round" />
          {/* radii and central angle mark */}
          <line x1={o[0]} y1={o[1]} x2={a[0]} y2={a[1]} stroke="var(--ink-muted)" strokeWidth="1" />
          <line x1={o[0]} y1={o[1]} x2={b[0]} y2={b[1]} stroke="var(--ink-muted)" strokeWidth="1" />
          <path d={arcSweep(o[0], o[1], arcStart, sweepScreen, 26)} fill="none" stroke="var(--series-red)" strokeWidth="2" />
          {/* chords and inscribed angle mark */}
          <line x1={c[0]} y1={c[1]} x2={a[0]} y2={a[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          <line x1={c[0]} y1={c[1]} x2={b[0]} y2={b[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          <path d={arcAt(c[0], c[1], dir(c, a), dir(c, b), 22)} fill="none" stroke="var(--series-blue)" strokeWidth="2" />

          <circle cx={o[0]} cy={o[1]} r="2.5" fill="var(--ink-muted)" />
          {handles.map(({ id, p, color }) => (
            <g key={id}>
              <circle cx={p[0]} cy={p[1]} r={id === "C" ? 5.5 : 4.5} fill={color} stroke="var(--viz-surface)" strokeWidth="2" />
              <circle
                cx={p[0]} cy={p[1]} r="16" fill="transparent"
                style={{ cursor: "grab", touchAction: "none" }}
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture(e.pointerId);
                  setDragging(id);
                }}
                onPointerUp={() => setDragging(null)}
              />
              <text
                x={p[0] + ((p[0] - o[0]) / (R * SCALE)) * 15 - 4}
                y={p[1] + ((p[1] - o[1]) / (R * SCALE)) * 15 + 4}
                fontSize="12"
                fontStyle="italic"
                fill="var(--foreground)"
              >
                {id}
              </text>
            </g>
          ))}
          <text x={o[0] + 6} y={o[1] - 8} fontSize="11" fontStyle="italic" fill="var(--ink-secondary)">O</text>
        </svg>
        <p className="mt-1 text-xs text-ink-3">
          Drag all three points — and try pulling C across the chord to the other arc.
        </p>
      </div>
    </DemoCard>
  );
}
