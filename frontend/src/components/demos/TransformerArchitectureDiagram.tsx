"use client";

import { useId } from "react";
import DemoCard from "./DemoCard";

/* Two static, theme-aware panels: one transformer block (pre-LayerNorm, as
   modern models use), and the whole model end to end. */

const BW = 300;
const BH = 440;

function Box({
  x, y, w, h, title, sub, accent,
}: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="7"
        fill="var(--surface-card)"
        stroke={accent ? "var(--series-blue)" : "var(--hairline)"}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 3 : h / 2 + 4)}
        textAnchor="middle"
        fontSize="11"
        fontWeight={600}
        fill="var(--foreground)"
      >
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

export default function TransformerArchitectureDiagram() {
  const uid = useId();

  const Arrow = ({ d }: { d: string }) => (
    <path d={d} fill="none" stroke="var(--viz-axis)" strokeWidth="1.5" markerEnd={`url(#${uid}-a)`} />
  );

  const PlusNode = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r="10" fill="var(--surface-card)" stroke="var(--hairline)" strokeWidth="1" />
      <path d={`M${cx - 5},${cy} L${cx + 5},${cy} M${cx},${cy - 5} L${cx},${cy + 5}`} stroke="var(--foreground)" strokeWidth="1.5" />
    </g>
  );

  const defs = (
    <defs>
      <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill="var(--viz-axis)" />
      </marker>
    </defs>
  );

  return (
    <DemoCard
      title="The transformer, assembled"
      footer="Left: one block — attention mixes information between tokens, the MLP transforms each token, and residual connections let both act as refinements. Right: the whole model is embeddings, N of those blocks, and a softmax over the vocabulary."
    >
      <div className="not-prose grid gap-6 sm:grid-cols-2">
        {/* -------- one block -------- */}
        <div>
          <p className="mb-1 text-xs text-ink-3">One transformer block</p>
          <svg viewBox={`0 0 ${BW} ${BH}`} className="w-full max-w-[320px] rounded-md" style={{ background: "var(--viz-surface)" }} role="img"
            aria-label="One transformer block: input flows through LayerNorm then multi-head attention with a residual connection, then LayerNorm and an MLP with a second residual connection">
            {defs}
            <text x={150} y={22} textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">
              from previous block · (L × d)
            </text>
            <Arrow d="M150,30 L150,48" />
            <Box x={100} y={50} w={100} h={28} title="LayerNorm" />
            <Arrow d="M150,78 L150,96" />
            <Box x={62} y={98} w={176} h={58} title="multi-head attention" accent />
            {/* the h heads, hinted */}
            {[0, 1, 2].map((i) => (
              <rect key={i} x={86 + i * 40} y={128} width={30} height={18} rx="4" fill="none" stroke="var(--series-blue)" strokeWidth="1" opacity="0.55" />
            ))}
            <text x={212} y={141} fontSize="9" fill="var(--ink-muted)">× h</text>
            <Arrow d="M150,156 L150,180" />
            {/* residual 1: input skips around attention */}
            <path d="M150,36 L262,36 L262,190 L164,190" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" markerEnd={`url(#${uid}-a)`} />
            <text x={268} y={116} fontSize="9" fill="var(--ink-muted)" transform="rotate(90 268 116)">residual</text>
            <PlusNode cx={150} cy={190} />
            <Arrow d="M150,200 L150,220" />
            <Box x={100} y={222} w={100} h={28} title="LayerNorm" />
            <Arrow d="M150,250 L150,268" />
            <Box x={62} y={270} w={176} h={44} title="MLP (two layers)" sub="the backprop lesson's network" accent />
            <Arrow d="M150,314 L150,338" />
            {/* residual 2 */}
            <path d="M150,209 L38,209 L38,348 L136,348" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" markerEnd={`url(#${uid}-a)`} />
            <text x={32} y={290} fontSize="9" fill="var(--ink-muted)" transform="rotate(-90 32 290)">residual</text>
            <PlusNode cx={150} cy={348} />
            <Arrow d="M150,358 L150,382" />
            <text x={150} y={398} textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">
              to the next block · (L × d)
            </text>
            <text x={150} y={424} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
              attention mixes across tokens · the MLP transforms each token
            </text>
          </svg>
        </div>

        {/* -------- the whole model -------- */}
        <div>
          <p className="mb-1 text-xs text-ink-3">The whole model (GPT-style)</p>
          <svg viewBox={`0 0 ${BW} ${BH}`} className="w-full max-w-[320px] rounded-md" style={{ background: "var(--viz-surface)" }} role="img"
            aria-label="The full model: text is tokenized, embedded with positions, passed through N transformer blocks, a final LayerNorm, a linear layer producing logits, and a softmax giving next-token probabilities">
            {defs}
            <text x={150} y={22} textAnchor="middle" fontSize="10" fontStyle="italic" fill="var(--ink-secondary)">
              “The robot picked up the …”
            </text>
            <Arrow d="M150,30 L150,46" />
            <Box x={80} y={48} w={140} h={28} title="tokenizer" sub="text → token IDs" />
            <Arrow d="M150,76 L150,94" />
            <Box x={80} y={96} w={140} h={32} title="embedding + positions" sub="(L × d)" />
            <Arrow d="M150,128 L150,148" />
            {/* stacked blocks */}
            <rect x={72} y={166} width={156} height={44} rx="7" fill="var(--surface-card)" stroke="var(--hairline)" strokeWidth="1" />
            <rect x={66} y={158} width={156} height={44} rx="7" fill="var(--surface-card)" stroke="var(--hairline)" strokeWidth="1" />
            <Box x={60} y={150} w={156} h={44} title="transformer block" sub="attention + MLP" accent />
            <text x={242} y={178} fontSize="11" fontWeight={600} fill="var(--ink-secondary)">× N</text>
            <Arrow d="M150,212 L150,232" />
            <Box x={80} y={234} w={140} h={28} title="final LayerNorm" />
            <Arrow d="M150,262 L150,280" />
            <Box x={80} y={282} w={140} h={32} title="linear → logits" sub="(L × vocab size)" />
            <Arrow d="M150,314 L150,332" />
            <Box x={80} y={334} w={140} h={32} title="softmax" sub="the last lesson" accent />
            <Arrow d="M150,366 L150,384" />
            <text x={150} y={400} textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">
              P(next token) — sampled with temperature
            </text>
            <text x={150} y={424} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
              trained end-to-end with cross-entropy + backprop + gradient descent
            </text>
          </svg>
        </div>
      </div>
    </DemoCard>
  );
}
