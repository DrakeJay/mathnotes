"use client";

import { useMemo, useState } from "react";
import DemoCard, { Control } from "./DemoCard";
import LineChart from "../viz/LineChart";

const PHI = (1 + Math.sqrt(5)) / 2;

type TreeNode = {
  arg: number;
  kind: "first" | "repeat" | "hit";
  children: TreeNode[];
  x: number;
  y: number;
};

function fib(n: number): number {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

function buildTree(n: number, memoize: boolean): { root: TreeNode; nodes: TreeNode[] } {
  const seen = new Set<number>();
  const nodes: TreeNode[] = [];

  function build(k: number): TreeNode {
    const isRepeat = seen.has(k);
    seen.add(k);
    const node: TreeNode = {
      arg: k,
      kind: isRepeat ? (memoize ? "hit" : "repeat") : "first",
      children: [],
      x: 0,
      y: 0,
    };
    if (k >= 2 && !(memoize && isRepeat)) {
      node.children = [build(k - 1), build(k - 2)];
    }
    nodes.push(node);
    return node;
  }

  const root = build(n);

  // tidy layout: leaves get consecutive x slots, parents center over children
  const next = { x: 0 };
  function place(node: TreeNode, depth: number): number {
    node.y = depth;
    if (node.children.length === 0) {
      node.x = next.x++;
    } else {
      const xs = node.children.map((c) => place(c, depth + 1));
      node.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    return node.x;
  }
  place(root, 0);
  return { root, nodes };
}

export default function FibonacciDemo() {
  const [n, setN] = useState(6);
  const [memoize, setMemoize] = useState(false);

  const { nodes } = useMemo(() => buildTree(n, memoize), [n, memoize]);

  const total = nodes.length;
  const firsts = nodes.filter((x) => x.kind === "first").length;
  const repeats = nodes.filter((x) => x.kind === "repeat").length;
  const hits = nodes.filter((x) => x.kind === "hit").length;
  const maxX = Math.max(...nodes.map((x) => x.x));
  const maxY = Math.max(...nodes.map((x) => x.y));

  const VW = 700;
  const VH = 60 + maxY * 34;
  const PAD = 26;
  const sx = (x: number) => PAD + (maxX === 0 ? (VW - 2 * PAD) / 2 : (x / maxX) * (VW - 2 * PAD));
  const sy = (y: number) => 30 + y * 34;
  const r = Math.max(6.5, Math.min(11, ((VW - 2 * PAD) / Math.max(maxX, 1)) * 0.42));

  const ratioSeries = useMemo(() => {
    const pts: [number, number][] = [];
    for (let k = 2; k <= 13; k++) pts.push([k, fib(k + 1) / fib(k)]);
    return [
      { name: "Fₖ₊₁ / Fₖ", color: "var(--series-blue)", points: pts },
      {
        name: "φ",
        color: "var(--series-yellow)",
        points: [
          [2, PHI],
          [13, PHI],
        ] as [number, number][],
      },
    ];
  }, []);

  const NODE_COLOR: Record<TreeNode["kind"], string> = {
    first: "var(--series-blue)",
    repeat: "var(--series-red)",
    hit: "var(--series-aqua)",
  };

  return (
    <DemoCard
      title="The recursion tree, and the cure"
      controls={
        <>
          <Control label={`n = ${n}`}>
            <input
              type="range"
              min={3}
              max={8}
              step={1}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <label className="flex items-center gap-1.5 pb-1 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={memoize}
              onChange={(e) => setMemoize(e.target.checked)}
              className="accent-(--series-blue)"
            />
            memoize (cache every result)
          </label>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          fib({n}) = <strong>{fib(n)}</strong> ·{" "}
          {memoize
            ? `memoized: ${firsts} computations + ${hits} cache hits — dynamic programming in one checkbox`
            : `naive recursion: ${total} calls, but only ${firsts} distinct values — ${repeats} redundant (red)`}
        </span>
      }
    >
      <div className="not-prose">
        <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-blue)" }} />
            first computation
          </span>
          {!memoize && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-red)" }} />
              already computed — wasted work
            </span>
          )}
          {memoize && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-aqua)" }} />
              cache hit (no recursion)
            </span>
          )}
        </div>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Call tree of fib(${n}) ${memoize ? "with" : "without"} memoization: ${total} nodes`}
        >
          {nodes.map((node, i) =>
            node.children.map((c, j) => (
              <line
                key={`${i}-${j}`}
                x1={sx(node.x)}
                y1={sy(node.y)}
                x2={sx(c.x)}
                y2={sy(c.y)}
                stroke="var(--viz-axis)"
                strokeWidth="1"
              />
            )),
          )}
          {nodes.map((node, i) => (
            <g key={`n${i}`}>
              <circle
                cx={sx(node.x)}
                cy={sy(node.y)}
                r={node.kind === "hit" ? r * 0.75 : r}
                fill={NODE_COLOR[node.kind]}
                opacity={node.kind === "repeat" ? 0.75 : 1}
                stroke="var(--viz-surface)"
                strokeWidth="1.5"
              />
              {r >= 6.5 && (
                <text
                  x={sx(node.x)}
                  y={sy(node.y) + 3}
                  textAnchor="middle"
                  fontSize={Math.min(10, r + 1)}
                  fontWeight={600}
                  fill="#ffffff"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {node.arg}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div className="mt-3 grid items-center gap-4 sm:grid-cols-2">
          <p className="text-xs leading-relaxed text-ink-2">
            The naive tree obeys the same recurrence it computes — its size grows like φⁿ. Memoization
            keeps one blue node per distinct argument, so the work drops to n + 1 computations: the
            sequence didn&apos;t change, the algorithm did.
          </p>
          <div>
            <p className="mb-1 text-xs text-ink-3">
              consecutive ratios close in on φ ≈ {PHI.toFixed(6)}
            </p>
            <LineChart series={ratioSeries} xLabel="k" yLabel="ratio" height={190} />
          </div>
        </div>
      </div>
    </DemoCard>
  );
}
