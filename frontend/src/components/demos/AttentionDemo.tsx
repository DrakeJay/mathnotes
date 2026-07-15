"use client";

import { useMemo, useRef, useState } from "react";
import DemoCard, { Control } from "./DemoCard";
import { formatNum, sequential, useVizMode } from "../viz/color";

const TOKENS = ["The", "robot", "picked", "up", "the", "ball"];

/* Hand-crafted 2D key vectors. Directions are interpretable:
   nouns point right, function words (determiners/particles) point up,
   the verb points down-right. Real models learn these in hundreds of
   dimensions; two are enough to see the machinery. */
const KEYS: [number, number][] = [
  [0.15, 2.0], // The
  [2.0, 0.1], // robot
  [1.0, -1.6], // picked
  [-0.5, 1.55], // up
  [0.75, 1.75], // the
  [1.7, -0.8], // ball
];

/* Default queries: what each token "looks for". */
const DEFAULT_QUERIES: [number, number][] = [
  [1.6, 0.1], // The -> nouns
  [0.5, 1.2], // robot -> its determiner
  [1.9, -0.35], // picked -> its noun arguments
  [0.9, -1.5], // up -> the verb
  [1.6, 0.1], // the -> nouns
  [0.4, 1.7], // ball -> its determiner
];

const PANE = 340;
const LIM = 2.6;
const CELL = 32;
const HM_LEFT = 56;
const HM_TOP = 48;

type Vec = [number, number];
type HmHover = { row: number; col: number; px: number; py: number } | null;

function attentionRow(
  query: Vec,
  scale: number,
  rowIndex: number,
  causal: boolean,
): { weights: number[]; scores: number[] } {
  const scores = KEYS.map(([kx, ky]) => (query[0] * kx + query[1] * ky) * scale);
  const visible = scores.map((_, j) => !causal || j <= rowIndex);
  const max = Math.max(...scores.filter((_, j) => visible[j]));
  const exps = scores.map((s, j) => (visible[j] ? Math.exp(s - max) : 0));
  const sum = exps.reduce((a, b) => a + b, 0);
  return { weights: exps.map((e) => e / sum), scores };
}

export default function AttentionDemo() {
  const mode = useVizMode();
  const paneRef = useRef<SVGSVGElement>(null);
  const hmRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState(2); // "picked"
  const [queries, setQueries] = useState<Vec[]>(DEFAULT_QUERIES.map((q) => [...q] as Vec));
  const [scale, setScale] = useState(1);
  const [causal, setCausal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hmHover, setHmHover] = useState<HmHover>(null);

  const matrix = useMemo(
    () => queries.map((q, i) => attentionRow(q, scale, i, causal)),
    [queries, scale, causal],
  );
  const row = matrix[selected];
  const entropy = -row.weights.reduce((a, w) => (w > 0 ? a + w * Math.log(w) : a), 0);

  // --- vector pane geometry ---
  const sx = (x: number) => ((x + LIM) / (2 * LIM)) * PANE;
  const sy = (y: number) => ((LIM - y) / (2 * LIM)) * PANE;

  function paneToWorld(e: React.PointerEvent): Vec {
    const rect = paneRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * PANE;
    const py = ((e.clientY - rect.top) / rect.height) * PANE;
    const clamp = (v: number) => Math.max(-LIM, Math.min(LIM, v));
    return [clamp(+((px / PANE) * 2 * LIM - LIM).toFixed(2)), clamp(+(LIM - (py / PANE) * 2 * LIM).toFixed(2))];
  }

  const arrow = (v: Vec, color: string, label: string, width = 2) => {
    const len = Math.hypot(v[0], v[1]);
    const ux = len ? v[0] / len : 1;
    const uy = len ? v[1] / len : 0;
    const hx = sx(v[0]);
    const hy = sy(v[1]);
    const s = PANE / (2 * LIM);
    return (
      <g>
        <line x1={sx(0)} y1={sy(0)} x2={hx} y2={hy} stroke={color} strokeWidth={width} strokeLinecap="round" />
        {len > 0.05 && (
          <polygon
            points={`${hx},${hy} ${hx - (ux * 0.2 - uy * 0.1) * s},${hy + (uy * 0.2 + ux * 0.1) * s} ${hx - (ux * 0.2 + uy * 0.1) * s},${hy + (uy * 0.2 - ux * 0.1) * s}`}
            fill={color}
          />
        )}
        <text x={hx + ux * 13 - 8} y={hy - uy * 13 + 4} fontSize="10" fill="var(--foreground)">
          {label}
        </text>
      </g>
    );
  };

  const q = queries[selected];

  // --- heatmap geometry ---
  const HM_W = HM_LEFT + CELL * TOKENS.length + 8;
  const HM_H = HM_TOP + CELL * TOKENS.length + 8;

  return (
    <DemoCard
      title="Scaled dot-product attention, hands on"
      controls={
        <>
          <Control label={`Score scale = ${scale.toFixed(2)} (temperature dial)`}>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <label className="flex items-center gap-1.5 pb-1 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={causal}
              onChange={(e) => setCausal(e.target.checked)}
              className="accent-(--series-blue)"
            />
            causal mask (no peeking at the future)
          </label>
          <button
            className="rounded-md border border-hairline bg-background px-2.5 py-1 text-xs text-ink-2 hover:text-foreground"
            onClick={() => setQueries(DEFAULT_QUERIES.map((v) => [...v] as Vec))}
          >
            Reset queries
          </button>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          <em>{TOKENS[selected]}</em> attends with entropy H ={" "}
          <strong>{formatNum(entropy)}</strong> nats (uniform over{" "}
          {causal ? selected + 1 : TOKENS.length} visible tokens ={" "}
          {formatNum(Math.log(causal ? selected + 1 : TOKENS.length))}) — sharpen or flatten it
          with the score scale.
        </span>
      }
    >
      <div className="not-prose">
        {/* token chips */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TOKENS.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                i === selected
                  ? "border-accent bg-accent text-white"
                  : "border-hairline bg-background text-ink-2 hover:text-foreground"
              }`}
              aria-pressed={i === selected}
            >
              {t}
            </button>
          ))}
          <span className="self-center text-xs text-ink-3">
            ← pick a token, then drag its query arrow
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* vector pane */}
          <div>
            <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-blue)" }} />
                keys k<sub>j</sub>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-red)" }} />
                query of <em>{TOKENS[selected]}</em> (drag it)
              </span>
            </div>
            <svg
              ref={paneRef}
              viewBox={`0 0 ${PANE} ${PANE}`}
              className="w-full rounded-md"
              style={{ background: "var(--viz-surface)", touchAction: "none" }}
              onPointerMove={(e) => {
                if (!dragging) return;
                const p = paneToWorld(e);
                setQueries((prev) => prev.map((v, i) => (i === selected ? p : v)));
              }}
              onPointerUp={() => setDragging(false)}
              role="img"
              aria-label={`Key vectors of all tokens and the draggable query vector of ${TOKENS[selected]}`}
            >
              {[-2, -1, 0, 1, 2].map((k) => (
                <g key={k}>
                  <line x1={sx(k)} y1={0} x2={sx(k)} y2={PANE} stroke="var(--viz-grid)" strokeWidth="1" />
                  <line x1={0} y1={sy(k)} x2={PANE} y2={sy(k)} stroke="var(--viz-grid)" strokeWidth="1" />
                </g>
              ))}
              <line x1={sx(-LIM)} y1={sy(0)} x2={sx(LIM)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth="1" />
              <line x1={sx(0)} y1={sy(-LIM)} x2={sx(0)} y2={sy(LIM)} stroke="var(--viz-axis)" strokeWidth="1" />

              {KEYS.map((k, j) => (
                <g key={j} opacity={causal && j > selected ? 0.3 : 1}>
                  {arrow(k, "var(--series-blue)", TOKENS[j])}
                </g>
              ))}
              {arrow(q, "var(--series-red)", "", 2.5)}
              <circle cx={sx(q[0])} cy={sy(q[1])} r="5" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
              <circle
                cx={sx(q[0])}
                cy={sy(q[1])}
                r="16"
                fill="transparent"
                style={{ cursor: "grab", touchAction: "none" }}
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture(e.pointerId);
                  setDragging(true);
                }}
                onPointerUp={() => setDragging(false)}
              />
            </svg>
          </div>

          {/* weights + matrix */}
          <div>
            <p className="mb-1 text-xs text-ink-3">
              Attention of <em>{TOKENS[selected]}</em> over the sequence
            </p>
            <svg viewBox="0 0 520 128" className="w-full rounded-md" style={{ background: "var(--viz-surface)" }} aria-hidden>
              {row.weights.map((w, j) => {
                const slot = (520 - 16) / TOKENS.length;
                const x = 8 + slot * j + (slot - 30) / 2;
                const yBase = 100;
                const h = w * 78;
                const yTop = yBase - h;
                const r = Math.min(4, h / 2);
                return (
                  <g key={j}>
                    <path
                      d={`M${x},${yBase} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + 30 - r},${yTop} Q${x + 30},${yTop} ${x + 30},${yTop + r} L${x + 30},${yBase} Z`}
                      fill="var(--series-blue)"
                      opacity={causal && j > selected ? 0.25 : 1}
                    />
                    <text
                      x={x + 15}
                      y={yTop - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--foreground)"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {(w * 100).toFixed(0)}%
                    </text>
                    <text x={x + 15} y={116} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">
                      {TOKENS[j]}
                    </text>
                  </g>
                );
              })}
              <line x1={8} x2={512} y1={100} y2={100} stroke="var(--viz-axis)" strokeWidth="1" />
            </svg>

            <p className="mb-1 mt-3 text-xs text-ink-3">
              Full attention matrix — rows are queries, columns are keys; each row sums to 100%
            </p>
            <div className="relative">
              <svg
                ref={hmRef}
                viewBox={`0 0 ${HM_W} ${HM_H}`}
                className="w-full max-w-[280px] rounded-md"
                style={{ background: "var(--viz-surface)" }}
                onMouseLeave={() => setHmHover(null)}
                role="img"
                aria-label="Attention matrix for all query and key positions"
              >
                {TOKENS.map((t, j) => (
                  <text
                    key={`c${j}`}
                    x={HM_LEFT + j * CELL + CELL / 2 + 3}
                    y={HM_TOP - 8}
                    fontSize="9"
                    fill="var(--ink-muted)"
                    transform={`rotate(-45 ${HM_LEFT + j * CELL + CELL / 2 + 3} ${HM_TOP - 8})`}
                  >
                    {t}
                  </text>
                ))}
                {TOKENS.map((t, i) => (
                  <text
                    key={`r${i}`}
                    x={HM_LEFT - 6}
                    y={HM_TOP + i * CELL + CELL / 2 + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight={i === selected ? 700 : 400}
                    fill={i === selected ? "var(--foreground)" : "var(--ink-muted)"}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(i)}
                  >
                    {t}
                  </text>
                ))}
                {matrix.map((r, i) =>
                  r.weights.map((w, j) => (
                    <rect
                      key={`${i}-${j}`}
                      x={HM_LEFT + j * CELL + 1}
                      y={HM_TOP + i * CELL + 1}
                      width={CELL - 2}
                      height={CELL - 2}
                      rx="2"
                      fill={sequential(w, mode)}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(i)}
                      onMouseEnter={() =>
                        setHmHover({ row: i, col: j, px: HM_LEFT + j * CELL + CELL / 2, py: HM_TOP + i * CELL })
                      }
                    />
                  )),
                )}
                <rect
                  x={HM_LEFT}
                  y={HM_TOP + selected * CELL}
                  width={CELL * TOKENS.length}
                  height={CELL}
                  fill="none"
                  stroke="var(--series-red)"
                  strokeWidth="1.5"
                  rx="3"
                  pointerEvents="none"
                />
              </svg>
              {hmHover && (
                <div
                  className="pointer-events-none absolute z-10 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-xs shadow-sm"
                  style={{
                    left: `${(hmHover.px / HM_W) * 76}%`,
                    top: `${(hmHover.py / HM_H) * 100}%`,
                    transform: `translate(${hmHover.px > HM_W * 0.6 ? "-110%" : "12px"}, -50%)`,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <div className="text-ink-3">
                    {TOKENS[hmHover.row]} → {TOKENS[hmHover.col]}
                  </div>
                  <div>
                    weight {(matrix[hmHover.row].weights[hmHover.col] * 100).toFixed(1)}% · score{" "}
                    {formatNum(matrix[hmHover.row].scores[hmHover.col])}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}
