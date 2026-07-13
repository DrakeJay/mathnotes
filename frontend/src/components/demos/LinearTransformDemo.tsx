"use client";

import { useState } from "react";
import DemoCard, { selectClass } from "./DemoCard";
import { formatNum } from "../viz/color";

type Mat = [number, number, number, number]; // [a, b, c, d] = [[a, b], [c, d]]

const PRESETS: { label: string; m: Mat }[] = [
  { label: "Identity", m: [1, 0, 0, 1] },
  { label: "Rotate 30°", m: [0.87, -0.5, 0.5, 0.87] },
  { label: "Shear", m: [1, 0.6, 0, 1] },
  { label: "Stretch x, squash y", m: [1.5, 0, 0, 0.6] },
  { label: "Reflect (swap axes)", m: [0, 1, 1, 0] },
  { label: "Singular (det = 0)", m: [1, 2, 0.5, 1] },
];

const W = 340;
const LIM = 3.2;
const GRID_RANGE = [-3, -2, -1, 0, 1, 2, 3];

export default function LinearTransformDemo() {
  const [m, setM] = useState<Mat>([1, 0.6, 0, 1]);
  const [a, b, c, d] = m;
  const det = a * d - b * c;

  const sx = (x: number) => ((x + LIM) / (2 * LIM)) * W;
  const sy = (y: number) => ((LIM - y) / (2 * LIM)) * W;
  const tx = (x: number, y: number): [number, number] => [a * x + b * y, c * x + d * y];

  function setEntry(i: number, v: number) {
    const next = [...m] as Mat;
    next[i] = v;
    setM(next);
  }

  const line = (p: [number, number], q: [number, number], stroke: string, width: number, opacity = 1) => (
    <line
      x1={sx(p[0])}
      y1={sy(p[1])}
      x2={sx(q[0])}
      y2={sy(q[1])}
      stroke={stroke}
      strokeWidth={width}
      opacity={opacity}
    />
  );

  const arrow = (v: [number, number], color: string, label: string) => {
    const [vx, vy] = v;
    const len = Math.hypot(vx, vy);
    if (len < 0.05) return null;
    const ux = vx / len;
    const uy = vy / len;
    const headX = sx(vx);
    const headY = sy(vy);
    const scale = W / (2 * LIM);
    return (
      <g>
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={headX}
          y2={headY}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon
          points={`${headX},${headY} ${headX - (ux * 0.28 - uy * 0.14) * scale},${headY + (uy * 0.28 + ux * 0.14) * scale} ${headX - (ux * 0.28 + uy * 0.14) * scale},${headY + (uy * 0.28 - ux * 0.14) * scale}`}
          fill={color}
        />
        <text
          x={headX + ux * 14 + 4}
          y={headY - uy * 14 + 4}
          fontSize="12"
          fill="var(--foreground)"
          fontStyle="italic"
        >
          {label}
        </text>
      </g>
    );
  };

  const e1 = tx(1, 0);
  const e2 = tx(0, 1);
  const square = [tx(0, 0), tx(1, 0), tx(1, 1), tx(0, 1)];

  return (
    <DemoCard
      title="A matrix transforms the plane"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-light text-ink-3">[</span>
            <div className="grid grid-cols-2 gap-1.5">
              {m.map((v, i) => (
                <input
                  key={i}
                  type="number"
                  step={0.1}
                  value={v}
                  onChange={(e) => setEntry(i, Number(e.target.value))}
                  className={`${selectClass} w-16 text-center`}
                  aria-label={`matrix entry ${["a", "b", "c", "d"][i]}`}
                />
              ))}
            </div>
            <span className="text-2xl font-light text-ink-3">]</span>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-ink-3">Preset</span>
            <select
              className={selectClass}
              value=""
              onChange={(e) => {
                const preset = PRESETS.find((p) => p.label === e.target.value);
                if (preset) setM(preset.m);
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
          </label>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          det = ad − bc = <strong>{formatNum(det)}</strong> — the unit square&apos;s area is
          scaled by |det| {det < 0 ? "(negative: orientation flips)" : ""}
          {Math.abs(det) < 0.01 ? " — zero: the plane collapses onto a line, information is lost" : ""}
        </span>
      }
    >
      <div className="mx-auto max-w-sm">
        <svg
          viewBox={`0 0 ${W} ${W}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label="The plane under the linear transformation: transformed grid lines, unit square, and basis vectors"
        >
          {/* original lattice, faint */}
          {GRID_RANGE.map((k) => (
            <g key={`o${k}`}>
              {line([k, -LIM], [k, LIM], "var(--viz-grid)", 1)}
              {line([-LIM, k], [LIM, k], "var(--viz-grid)", 1)}
            </g>
          ))}
          {/* transformed lattice */}
          {GRID_RANGE.map((k) => (
            <g key={`t${k}`}>
              {line(tx(k, -LIM), tx(k, LIM), "var(--series-blue)", 1, 0.35)}
              {line(tx(-LIM, k), tx(LIM, k), "var(--series-blue)", 1, 0.35)}
            </g>
          ))}
          {/* axes through origin */}
          {line([-LIM, 0], [LIM, 0], "var(--viz-axis)", 1)}
          {line([0, -LIM], [0, LIM], "var(--viz-axis)", 1)}
          {/* transformed unit square as a wash */}
          <polygon
            points={square.map(([px, py]) => `${sx(px)},${sy(py)}`).join(" ")}
            fill="var(--series-blue)"
            opacity="0.12"
            stroke="var(--series-blue)"
            strokeWidth="1.5"
          />
          {arrow(e1, "var(--series-blue)", "Ae₁")}
          {arrow(e2, "var(--series-red)", "Ae₂")}
        </svg>
      </div>
    </DemoCard>
  );
}
