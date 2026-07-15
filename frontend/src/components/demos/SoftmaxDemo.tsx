"use client";

import { useMemo, useRef, useState } from "react";
import DemoCard, { Control } from "./DemoCard";
import { formatNum } from "../viz/color";

const K = 4;
const W = 520;
const H = 260;
const M = { top: 16, right: 12, bottom: 34, left: 42 };
const BAR_WIDTH = 24;

type Hover = { index: number; px: number; py: number } | null;

function softmax(logits: number[], temperature: number): number[] {
  // Shift by the max before exponentiating — same math, stable numbers.
  const scaled = logits.map((z) => z / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Bar path: 4px rounded corners at the data end (top), square at the baseline. */
function barPath(x: number, yTop: number, yBase: number, w: number): string {
  const r = Math.min(4, (yBase - yTop) / 2);
  return [
    `M${x},${yBase}`,
    `L${x},${yTop + r}`,
    `Q${x},${yTop} ${x + r},${yTop}`,
    `L${x + w - r},${yTop}`,
    `Q${x + w},${yTop} ${x + w},${yTop + r}`,
    `L${x + w},${yBase}`,
    "Z",
  ].join("");
}

export default function SoftmaxDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [logits, setLogits] = useState<number[]>([2, 0.5, -1, -3]);
  const [temperature, setTemperature] = useState(1);
  const [trueClass, setTrueClass] = useState(0);
  const [hover, setHover] = useState<Hover>(null);

  const probs = useMemo(() => softmax(logits, temperature), [logits, temperature]);
  const loss = -Math.log(Math.max(probs[trueClass], 1e-12));

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const slot = plotW / K;
  const sx = (i: number) => M.left + slot * i + (slot - BAR_WIDTH) / 2;
  const sy = (p: number) => M.top + plotH * (1 - p);

  function setLogit(i: number, v: number) {
    const next = [...logits];
    next[i] = v;
    setLogits(next);
  }

  return (
    <DemoCard
      title="Softmax: logits → probabilities"
      controls={
        <>
          {logits.map((z, i) => (
            <Control key={i} label={`z${i + 1} = ${z.toFixed(1)}`}>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.1}
                value={z}
                onChange={(e) => setLogit(i, Number(e.target.value))}
                className="w-24 accent-(--series-blue)"
              />
            </Control>
          ))}
          <Control label={`Temperature T = ${temperature.toFixed(2)}`}>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-32 accent-(--series-blue)"
            />
          </Control>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          Cross-entropy L = −ln p<sub>true</sub> = −ln({(probs[trueClass] * 100).toFixed(1)}%) ={" "}
          <strong>{formatNum(loss)}</strong>{" "}
          {probs[trueClass] < 0.05
            ? "— confidently wrong is expensive"
            : probs[trueClass] > 0.9
              ? "— confident and correct, almost free"
              : ""}
        </span>
      }
    >
      <div className="not-prose">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-blue)" }} />
            predicted probability
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-aqua)" }} />
            true class (click a bar to change)
          </span>
        </div>
        <div className="relative mx-auto max-w-lg">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full rounded-md"
            style={{ background: "var(--viz-surface)" }}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label={`Softmax probabilities for ${K} classes; class ${trueClass + 1} is the true class`}
          >
            {/* gridlines + y ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth="1" />
                <text
                  x={M.left - 8}
                  y={sy(t) + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--ink-muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {t * 100}%
                </text>
              </g>
            ))}
            {/* baseline */}
            <line x1={M.left} x2={W - M.right} y1={sy(0)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth="1" />

            {probs.map((p, i) => (
              <g key={i}>
                <path
                  d={barPath(sx(i), sy(p), sy(0), BAR_WIDTH)}
                  fill={i === trueClass ? "var(--series-aqua)" : "var(--series-blue)"}
                />
                {/* value on the cap */}
                <text
                  x={sx(i) + BAR_WIDTH / 2}
                  y={sy(p) - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--foreground)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {(p * 100).toFixed(1)}%
                </text>
                {/* category label */}
                <text
                  x={M.left + slot * i + slot / 2}
                  y={H - M.bottom + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill={i === trueClass ? "var(--foreground)" : "var(--ink-muted)"}
                >
                  class {i + 1}{i === trueClass ? " (true)" : ""}
                </text>
                {/* hit target: whole slot, larger than the mark */}
                <rect
                  x={M.left + slot * i}
                  y={M.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  role="button"
                  aria-label={`Set class ${i + 1} as the true class`}
                  onClick={() => setTrueClass(i)}
                  onMouseEnter={() =>
                    setHover({ index: i, px: sx(i) + BAR_WIDTH / 2, py: sy(p) })
                  }
                />
              </g>
            ))}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-xs shadow-sm"
              style={{
                left: `${(hover.px / W) * 100}%`,
                top: `${(hover.py / H) * 100}%`,
                transform: `translate(${hover.px > W * 0.65 ? "-110%" : "12px"}, -50%)`,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div className="text-ink-3">class {hover.index + 1}</div>
              <div>z = {logits[hover.index].toFixed(1)} · p = {(probs[hover.index] * 100).toFixed(2)}%</div>
              <div className="text-ink-2">−ln p = {formatNum(-Math.log(Math.max(probs[hover.index], 1e-12)))}</div>
            </div>
          )}
        </div>
      </div>
    </DemoCard>
  );
}
