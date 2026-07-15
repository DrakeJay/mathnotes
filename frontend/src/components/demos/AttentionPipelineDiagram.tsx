"use client";

import { useId, useState } from "react";
import DemoCard from "./DemoCard";

/* A data-flow diagram of scaled dot-product attention. Hover (or tap) any
   stage for its explanation. Q/K/V paths are color-coded with the validated
   categorical triple. */

type Stage = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  dashed?: boolean;
  caption: string;
};

const W = 850;
const H = 316;
const BOX_H = 40;

const STAGES: Stage[] = [
  {
    id: "x",
    x: 12, y: 138, w: 108, h: BOX_H,
    title: "token vectors X",
    sub: "(L × d)",
    caption: "The input: one row per token, straight from the embeddings. L tokens, d dimensions each.",
  },
  {
    id: "wq",
    x: 152, y: 42, w: 108, h: BOX_H,
    title: "Q = X · W_Q",
    sub: "(L × dₖ)",
    caption: "A linear layer produces each token's query — what it is looking for.",
  },
  {
    id: "wk",
    x: 152, y: 138, w: 108, h: BOX_H,
    title: "K = X · W_K",
    sub: "(L × dₖ)",
    caption: "A second linear layer produces each token's key — what it advertises about itself.",
  },
  {
    id: "wv",
    x: 152, y: 234, w: 108, h: BOX_H,
    title: "V = X · W_V",
    sub: "(L × dᵥ)",
    caption: "A third linear layer produces each token's value — the information it hands over when attended to.",
  },
  {
    id: "scores",
    x: 322, y: 90, w: 110, h: BOX_H,
    title: "Q Kᵀ / √dₖ",
    sub: "scores (L × L)",
    caption: "Every query dot-producted with every key — one matmul. The √dₖ keeps scores in the softmax's responsive range.",
  },
  {
    id: "mask",
    x: 454, y: 90, w: 108, h: BOX_H,
    title: "causal mask",
    sub: "j > i → −∞",
    dashed: true,
    caption: "Optional (GPT-style models): scores for future positions are set to −∞, so their softmax weight is exactly zero.",
  },
  {
    id: "softmax",
    x: 584, y: 90, w: 116, h: BOX_H,
    title: "row-wise softmax",
    sub: "A (L × L)",
    caption: "Each row of scores becomes a probability distribution over the sequence — the attention weights.",
  },
  {
    id: "out",
    x: 722, y: 138, w: 116, h: BOX_H,
    title: "output = A · V",
    sub: "(L × dᵥ)",
    caption: "Each token's new representation: the attention-weighted average of everyone's values. One more matmul.",
  },
];

const DEFAULT_CAPTION =
  "Two matrix multiplications and a softmax. Hover any stage to see its job and its tensor shape.";

/** Orthogonal elbow path from (x1,y1) to (x2,y2), bending at midX. */
function elbow(x1: number, y1: number, x2: number, y2: number, midX?: number): string {
  const mx = midX ?? (x1 + x2) / 2;
  if (y1 === y2) return `M${x1},${y1} L${x2},${y2}`;
  return `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`;
}

export default function AttentionPipelineDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const uid = useId();
  const stage = STAGES.find((s) => s.id === active);

  const marker = (name: string, color: string) => (
    <marker
      id={`${uid}-${name}`}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 Z" fill={color} />
    </marker>
  );

  const flow = (d: string, color: string, name: string) => (
    <path d={d} fill="none" stroke={color} strokeWidth="1.5" markerEnd={`url(#${uid}-${name})`} />
  );

  return (
    <DemoCard title="Inside one attention layer" footer={stage?.caption ?? DEFAULT_CAPTION}>
      <div className="not-prose overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[680px] w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label="Data flow of scaled dot-product attention: X projects to Q, K, and V; Q times K transpose over root d k, optionally masked, goes through a row-wise softmax; the weights multiply V to give the output"
        >
          <defs>
            {marker("q", "var(--series-blue)")}
            {marker("k", "var(--series-aqua)")}
            {marker("v", "var(--series-yellow)")}
            {marker("m", "var(--viz-axis)")}
          </defs>

          {/* X fans out to the three projections */}
          {flow(elbow(120, 150, 152, 62, 136), "var(--series-blue)", "q")}
          {flow(elbow(120, 158, 152, 158), "var(--series-aqua)", "k")}
          {flow(elbow(120, 166, 152, 254, 136), "var(--series-yellow)", "v")}

          {/* Q and K into scores */}
          {flow(elbow(260, 62, 322, 102, 296), "var(--series-blue)", "q")}
          {flow(elbow(260, 158, 322, 118, 296), "var(--series-aqua)", "k")}
          <text x={276} y={54} fontSize="11" fontStyle="italic" fill="var(--foreground)">Q</text>
          <text x={276} y={150} fontSize="11" fontStyle="italic" fill="var(--foreground)">K</text>

          {/* main spine: scores -> mask -> softmax */}
          {flow(elbow(432, 110, 454, 110), "var(--viz-axis)", "m")}
          {flow(elbow(562, 110, 584, 110), "var(--viz-axis)", "m")}

          {/* A into output, V bypasses everything and joins */}
          {flow(elbow(700, 110, 722, 150, 711), "var(--viz-axis)", "m")}
          {flow(elbow(260, 254, 722, 166, 700), "var(--series-yellow)", "v")}
          <text x={480} y={248} fontSize="11" fontStyle="italic" fill="var(--foreground)">V</text>
          <text x={704} y={102} fontSize="11" fontStyle="italic" fill="var(--foreground)">A</text>

          {/* stage boxes */}
          {STAGES.map((s) => (
            <g
              key={s.id}
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(s.id)}
              style={{ cursor: "default" }}
            >
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                rx="7"
                fill="var(--surface-card)"
                stroke={active === s.id ? "var(--series-blue)" : "var(--hairline)"}
                strokeWidth={active === s.id ? 1.8 : 1}
                strokeDasharray={s.dashed ? "4 3" : undefined}
              />
              <text
                x={s.x + s.w / 2}
                y={s.y + (s.sub ? 17 : 24)}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight={600}
                fill="var(--foreground)"
              >
                {s.title}
              </text>
              {s.sub && (
                <text
                  x={s.x + s.w / 2}
                  y={s.y + 31}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--ink-muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {s.sub}
                </text>
              )}
            </g>
          ))}

          {/* legend for the colored paths */}
          <g fontSize="10" fill="var(--ink-secondary)">
            <line x1={12} y1={300} x2={26} y2={300} stroke="var(--series-blue)" strokeWidth="2" />
            <text x={30} y={303.5}>queries</text>
            <line x1={86} y1={300} x2={100} y2={300} stroke="var(--series-aqua)" strokeWidth="2" />
            <text x={104} y={303.5}>keys</text>
            <line x1={142} y1={300} x2={156} y2={300} stroke="var(--series-yellow)" strokeWidth="2" />
            <text x={160} y={303.5}>values</text>
          </g>
        </svg>
      </div>
    </DemoCard>
  );
}
