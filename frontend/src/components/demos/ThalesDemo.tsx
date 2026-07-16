"use client";

import { useRef, useState } from "react";
import DemoCard from "./DemoCard";
import { angleDeg, arcAt, bisectorPoint, rightAngleMark, type Vec } from "./geometry";

const W = 360;
const H = 330;
const CX = 180;
const CY = 162;
const SCALE = 116;
const R = 1.3;

export default function ThalesDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  // C's position on the circle, as an angle in degrees (0 = right, CCW).
  const [theta, setTheta] = useState(62);
  const [dragging, setDragging] = useState(false);

  const sx = (x: number) => CX + x * SCALE;
  const sy = (y: number) => CY - y * SCALE;

  const A: Vec = [-R, 0];
  const B: Vec = [R, 0];
  const rad = (theta * Math.PI) / 180;
  const C: Vec = [R * Math.cos(rad), R * Math.sin(rad)];

  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const wx = (((e.clientX - rect.left) / rect.width) * W - CX) / SCALE;
    const wy = (CY - ((e.clientY - rect.top) / rect.height) * H) / SCALE;
    let t = (Math.atan2(wy, wx) * 180) / Math.PI;
    // keep C clear of A and B so the triangle never degenerates
    const away = 6;
    if (Math.abs(t) < away) t = t >= 0 ? away : -away;
    if (180 - Math.abs(t) < away) t = t >= 0 ? 180 - away : -(180 - away);
    setTheta(t);
  }

  // screen points
  const a: Vec = [sx(A[0]), sy(A[1])];
  const b: Vec = [sx(B[0]), sy(B[1])];
  const c: Vec = [sx(C[0]), sy(C[1])];
  const o: Vec = [sx(0), sy(0)];

  const dir = (from: Vec, to: Vec): Vec => [to[0] - from[0], to[1] - from[1]];

  const alpha = angleDeg(dir(A, B), dir(A, C));
  const beta = angleDeg(dir(B, A), dir(B, C));
  const gamma = angleDeg(dir(C, A), dir(C, B));

  const alphaLabel = bisectorPoint(a[0], a[1], dir(a, b), dir(a, c), 34);
  const betaLabel = bisectorPoint(b[0], b[1], dir(b, a), dir(b, c), 34);

  return (
    <DemoCard
      title="A diameter is always seen at a right angle"
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          α = {alpha.toFixed(1)}° · β = {beta.toFixed(1)}° · ∠ACB = α + β ={" "}
          <strong>{gamma.toFixed(1)}°</strong> — the radius OC splits the angle at C into a copy
          of α and a copy of β, and 2α + 2β = 180°.
        </span>
      }
    >
      <div className="not-prose mx-auto max-w-sm">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-aqua)" }} />
            α (isosceles pair at A and C)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-yellow)" }} />
            β (pair at B and C)
          </span>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)", touchAction: "none" }}
          onPointerMove={onMove}
          onPointerUp={() => setDragging(false)}
          role="img"
          aria-label={`Thales' theorem: triangle on the diameter AB with draggable point C; the angle at C is ${gamma.toFixed(0)} degrees`}
        >
          <circle cx={o[0]} cy={o[1]} r={R * SCALE} fill="none" stroke="var(--viz-axis)" strokeWidth="1.5" />
          {/* diameter and radius OC */}
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--viz-axis)" strokeWidth="1.5" />
          <line x1={o[0]} y1={o[1]} x2={c[0]} y2={c[1]} stroke="var(--ink-muted)" strokeWidth="1" />
          {/* triangle sides */}
          <line x1={c[0]} y1={c[1]} x2={a[0]} y2={a[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          <line x1={c[0]} y1={c[1]} x2={b[0]} y2={b[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />

          {/* angle marks: α at A, β at B, and the split α+β at C */}
          <path d={arcAt(a[0], a[1], dir(a, b), dir(a, c), 24)} fill="none" stroke="var(--series-aqua)" strokeWidth="2" />
          <path d={arcAt(b[0], b[1], dir(b, a), dir(b, c), 24)} fill="none" stroke="var(--series-yellow)" strokeWidth="2" />
          <path d={arcAt(c[0], c[1], dir(c, a), dir(c, o), 20)} fill="none" stroke="var(--series-aqua)" strokeWidth="2" />
          <path d={arcAt(c[0], c[1], dir(c, o), dir(c, b), 26)} fill="none" stroke="var(--series-yellow)" strokeWidth="2" />
          <path d={rightAngleMark(c[0], c[1], dir(c, a), dir(c, b), 11)} fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />

          {/* angle value labels */}
          <text x={alphaLabel[0]} y={alphaLabel[1] + 3} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {alpha.toFixed(0)}°
          </text>
          <text x={betaLabel[0]} y={betaLabel[1] + 3} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {beta.toFixed(0)}°
          </text>

          {/* points */}
          <circle cx={o[0]} cy={o[1]} r="2.5" fill="var(--ink-muted)" />
          <circle cx={a[0]} cy={a[1]} r="4" fill="var(--series-blue)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle cx={b[0]} cy={b[1]} r="4" fill="var(--series-blue)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle cx={c[0]} cy={c[1]} r="5.5" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle
            cx={c[0]} cy={c[1]} r="17" fill="transparent"
            style={{ cursor: "grab", touchAction: "none" }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              setDragging(true);
            }}
            onPointerUp={() => setDragging(false)}
          />

          {/* labels */}
          <text x={a[0] - 14} y={a[1] + 4} fontSize="12" fontStyle="italic" fill="var(--foreground)">A</text>
          <text x={b[0] + 7} y={b[1] + 4} fontSize="12" fontStyle="italic" fill="var(--foreground)">B</text>
          <text x={o[0] - 4} y={o[1] + 15} fontSize="11" fontStyle="italic" fill="var(--ink-secondary)">O</text>
          <text
            x={c[0] + (C[0] / R) * 16 - 4}
            y={c[1] - (C[1] / R) * 16 + 4}
            fontSize="12"
            fontStyle="italic"
            fill="var(--foreground)"
          >
            C
          </text>
        </svg>
        <p className="mt-1 text-xs text-ink-3">Drag C around the circle.</p>
      </div>
    </DemoCard>
  );
}
