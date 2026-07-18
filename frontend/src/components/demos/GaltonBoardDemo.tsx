"use client";

import { useMemo, useState } from "react";
import DemoCard, { Control, buttonClass } from "./DemoCard";

const W = 520;
const H = 390;
const CX = W / 2;
const PEG_TOP = 34;
const PEG_AREA = 160;
const BAR_BASE = 356;
const BAR_AREA = 130;
const MAX_BALLS = 50000;

function pascalRow(n: number): number[] {
  const r = [1];
  for (let k = 1; k <= n; k++) r.push((r[k - 1] * (n - k + 1)) / k);
  return r;
}

export default function GaltonBoardDemo() {
  const [rows, setRows] = useState(10);
  const [counts, setCounts] = useState<number[]>(Array(11).fill(0));
  const [total, setTotal] = useState(0);
  const [lastPath, setLastPath] = useState<number[] | null>(null);

  const dx = Math.min(40, 440 / (rows + 1));
  const dy = PEG_AREA / rows;

  function reset(newRows?: number) {
    const r = newRows ?? rows;
    if (newRows !== undefined) setRows(newRows);
    setCounts(Array(r + 1).fill(0));
    setTotal(0);
    setLastPath(null);
  }

  function drop(k: number) {
    const budget = Math.min(k, MAX_BALLS - total);
    const next = [...counts];
    let path: number[] | null = null;
    for (let b = 0; b < budget; b++) {
      let rights = 0;
      const trace = [0];
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.5) rights++;
        trace.push(rights);
      }
      next[rights]++;
      if (budget === 1) path = trace;
    }
    setCounts(next);
    setTotal(total + budget);
    setLastPath(path);
  }

  const pmf = useMemo(() => {
    const c = pascalRow(rows);
    const denom = Math.pow(2, rows);
    return c.map((v) => v / denom);
  }, [rows]);

  const maxScale = Math.max(...pmf, ...(total > 0 ? counts.map((c) => c / total) : [0])) * 1.12;
  const binX = (k: number) => CX + (k - rows / 2) * dx;
  const barH = (k: number) => (total > 0 ? ((counts[k] / total) / maxScale) * BAR_AREA : 0);

  return (
    <DemoCard
      title="The Galton board: coin flips become a bell"
      controls={
        <>
          <Control label={`Peg rows = ${rows}`}>
            <input
              type="range"
              min={4}
              max={12}
              step={1}
              value={rows}
              onChange={(e) => reset(Number(e.target.value))}
              className="w-32 accent-(--series-blue)"
            />
          </Control>
          <button className={buttonClass} onClick={() => drop(1)} disabled={total >= MAX_BALLS}>
            Drop 1
          </button>
          <button className={buttonClass} onClick={() => drop(200)} disabled={total >= MAX_BALLS}>
            Drop 200
          </button>
          <button className={buttonClass} onClick={() => drop(5000)} disabled={total >= MAX_BALLS}>
            Drop 5,000
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => reset()}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {total.toLocaleString()} ball(s) · each ball makes {rows} left/right coin flips; its bin
          is the number of rights — so the histogram is the binomial, and its silhouette is the
          bell curve.
        </span>
      }
    >
      <div className="not-prose">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-blue)" }} />
            observed proportion
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-yellow)" }} />
            binomial prediction
          </span>
          {lastPath && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-red)" }} />
              last ball&apos;s path
            </span>
          )}
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full max-w-lg rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Galton board with ${rows} peg rows and ${total} balls dropped; the histogram approximates the binomial distribution`}
        >
          {/* pegs */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: r + 1 }, (_, i) => (
              <circle
                key={`${r}-${i}`}
                cx={CX + (i - r / 2) * dx}
                cy={PEG_TOP + r * dy}
                r="2.5"
                fill="var(--ink-muted)"
              />
            )),
          )}
          {/* last single ball path */}
          {lastPath && (
            <path
              d={lastPath
                .map(
                  (rights, r) =>
                    `${r === 0 ? "M" : "L"}${CX + (rights - r / 2) * dx},${r === 0 ? 14 : PEG_TOP + (r - 1) * dy + dy / 2}`,
                )
                .join(" ")}
              fill="none"
              stroke="var(--series-red)"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}
          {/* baseline */}
          <line x1={40} x2={W - 40} y1={BAR_BASE} y2={BAR_BASE} stroke="var(--viz-axis)" strokeWidth="1" />
          {/* bars */}
          {counts.map((c, k) => {
            const h = barH(k);
            const x = binX(k) - (dx * 0.68) / 2;
            const w = dx * 0.68;
            const yTop = BAR_BASE - h;
            const r = Math.min(4, h / 2);
            return (
              <g key={k}>
                {h > 0.5 && (
                  <path
                    d={`M${x},${BAR_BASE} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${BAR_BASE} Z`}
                    fill="var(--series-blue)"
                  />
                )}
                <text
                  x={binX(k)}
                  y={BAR_BASE + 13}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--ink-muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {k}
                </text>
              </g>
            );
          })}
          {/* binomial prediction dots */}
          {pmf.map((v, k) => (
            <circle
              key={`p${k}`}
              cx={binX(k)}
              cy={BAR_BASE - (v / maxScale) * BAR_AREA}
              r="4"
              fill="var(--series-yellow)"
              stroke="var(--viz-surface)"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    </DemoCard>
  );
}
