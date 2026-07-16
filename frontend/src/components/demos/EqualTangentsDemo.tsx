"use client";

import { useRef, useState } from "react";
import DemoCard from "./DemoCard";
import { formatNum } from "../viz/color";
import { rightAngleMark, type Vec } from "./geometry";

const W = 420;
const H = 300;
const CX = 135;
const CY = 150;
const SCALE = 95;
const R = 1.0;

export default function EqualTangentsDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Vec>([1.95, 0.55]);
  const [dragging, setDragging] = useState(false);

  const sx = (x: number) => CX + x * SCALE;
  const sy = (y: number) => CY - y * SCALE;

  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = svgRef.current!.getBoundingClientRect();
    let wx = (((e.clientX - rect.left) / rect.width) * W - CX) / SCALE;
    let wy = (CY - ((e.clientY - rect.top) / rect.height) * H) / SCALE;
    wx = Math.max(-1.3, Math.min(2.9, wx));
    wy = Math.max(-1.5, Math.min(1.5, wy));
    // keep P outside the circle
    const d = Math.hypot(wx, wy);
    const minD = R + 0.14;
    if (d < minD) {
      wx = (wx / d) * minD;
      wy = (wy / d) * minD;
    }
    setP([+wx.toFixed(3), +wy.toFixed(3)]);
  }

  const d = Math.hypot(P[0], P[1]);
  const L = Math.sqrt(Math.max(0, d * d - R * R));
  const alpha = Math.acos(R / d);
  const u: Vec = [P[0] / d, P[1] / d];
  const rot = (v: Vec, t: number): Vec => [
    v[0] * Math.cos(t) - v[1] * Math.sin(t),
    v[0] * Math.sin(t) + v[1] * Math.cos(t),
  ];
  const T1: Vec = [rot(u, alpha)[0] * R, rot(u, alpha)[1] * R];
  const T2: Vec = [rot(u, -alpha)[0] * R, rot(u, -alpha)[1] * R];

  const o: Vec = [sx(0), sy(0)];
  const p: Vec = [sx(P[0]), sy(P[1])];
  const t1: Vec = [sx(T1[0]), sy(T1[1])];
  const t2: Vec = [sx(T2[0]), sy(T2[1])];
  const dir = (from: Vec, to: Vec): Vec => [to[0] - from[0], to[1] - from[1]];

  // length labels sit just off the midpoint of each tangent segment
  const labelFor = (t: Vec): Vec => {
    const mx = (t[0] + p[0]) / 2;
    const my = (t[1] + p[1]) / 2;
    const nx = -(p[1] - t[1]);
    const ny = p[0] - t[0];
    const n = Math.hypot(nx, ny) || 1;
    const side = t === t1 ? 1 : -1;
    return [mx + (nx / n) * 12 * side, my + (ny / n) * 12 * side];
  };
  const l1 = labelFor(t1);
  const l2 = labelFor(t2);

  return (
    <DemoCard
      title="Two tangents, one length"
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          |PT₁| = |PT₂| = <strong>{formatNum(L)}</strong> = √(d² − r²) with d = |OP| ={" "}
          {formatNum(d)}, r = 1 — two right triangles sharing the hypotenuse OP.
        </span>
      }
    >
      <div className="not-prose mx-auto max-w-md">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)", touchAction: "none" }}
          onPointerMove={onMove}
          onPointerUp={() => setDragging(false)}
          role="img"
          aria-label={`Equal tangent theorem: both tangent segments from the draggable point P have length ${L.toFixed(2)}`}
        >
          {/* kite wash */}
          <polygon
            points={`${o[0]},${o[1]} ${t1[0]},${t1[1]} ${p[0]},${p[1]} ${t2[0]},${t2[1]}`}
            fill="var(--series-blue)"
            opacity="0.09"
          />
          <circle cx={o[0]} cy={o[1]} r={R * SCALE} fill="none" stroke="var(--viz-axis)" strokeWidth="1.5" />
          {/* OP and the two radii */}
          <line x1={o[0]} y1={o[1]} x2={p[0]} y2={p[1]} stroke="var(--ink-muted)" strokeWidth="1" />
          <line x1={o[0]} y1={o[1]} x2={t1[0]} y2={t1[1]} stroke="var(--ink-muted)" strokeWidth="1.3" />
          <line x1={o[0]} y1={o[1]} x2={t2[0]} y2={t2[1]} stroke="var(--ink-muted)" strokeWidth="1.3" />
          {/* tangent segments */}
          <line x1={p[0]} y1={p[1]} x2={t1[0]} y2={t1[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          <line x1={p[0]} y1={p[1]} x2={t2[0]} y2={t2[1]} stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          {/* right angles at the tangent points */}
          <path d={rightAngleMark(t1[0], t1[1], dir(t1, o), dir(t1, p), 9)} fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />
          <path d={rightAngleMark(t2[0], t2[1], dir(t2, o), dir(t2, p), 9)} fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />

          {/* length labels */}
          <text x={l1[0]} y={l1[1] + 3} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatNum(L)}
          </text>
          <text x={l2[0]} y={l2[1] + 3} textAnchor="middle" fontSize="10.5" fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatNum(L)}
          </text>

          {/* points */}
          <circle cx={o[0]} cy={o[1]} r="3" fill="var(--ink-muted)" />
          <circle cx={t1[0]} cy={t1[1]} r="4" fill="var(--series-blue)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle cx={t2[0]} cy={t2[1]} r="4" fill="var(--series-blue)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle cx={p[0]} cy={p[1]} r="5.5" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
          <circle
            cx={p[0]} cy={p[1]} r="17" fill="transparent"
            style={{ cursor: "grab", touchAction: "none" }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              setDragging(true);
            }}
            onPointerUp={() => setDragging(false)}
          />

          <text x={o[0] - 14} y={o[1] + 4} fontSize="11" fontStyle="italic" fill="var(--ink-secondary)">O</text>
          <text x={p[0] + 9} y={p[1] + 4} fontSize="12" fontStyle="italic" fill="var(--foreground)">P</text>
          <text x={t1[0] - 6} y={t1[1] - 9} fontSize="11" fontStyle="italic" fill="var(--foreground)">T₁</text>
          <text x={t2[0] - 6} y={t2[1] + 16} fontSize="11" fontStyle="italic" fill="var(--foreground)">T₂</text>
        </svg>
        <p className="mt-1 text-xs text-ink-3">Drag P anywhere outside the circle.</p>
      </div>
    </DemoCard>
  );
}
