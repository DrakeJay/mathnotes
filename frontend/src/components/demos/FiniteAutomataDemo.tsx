"use client";

import { useEffect, useId, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

type StateNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  accept: boolean;
  loop?: "up" | "down";
};

type DFA = {
  name: string;
  alphabet: string[];
  states: StateNode[];
  start: string;
  transitions: Record<string, Record<string, string>>;
  /** per-edge curvature overrides, keyed "from>to" (else: auto) */
  curves?: Record<string, number>;
  sample: string;
  annotate: (consumed: string) => string;
};

const MACHINES: DFA[] = [
  {
    name: "Binary number divisible by 3",
    alphabet: ["0", "1"],
    states: [
      { id: "r0", label: "r₀", x: 120, y: 80, accept: true },
      { id: "r1", label: "r₁", x: 330, y: 80, accept: false },
      { id: "r2", label: "r₂", x: 225, y: 215, accept: false, loop: "down" },
    ],
    start: "r0",
    transitions: {
      r0: { "0": "r0", "1": "r1" },
      r1: { "0": "r2", "1": "r0" },
      r2: { "0": "r1", "1": "r2" },
    },
    sample: "1001",
    annotate: (s) => {
      if (!s) return "nothing read yet — value 0, remainder 0";
      const v = parseInt(s, 2);
      return `read ${s}₂ = ${v} — remainder ${v % 3}`;
    },
  },
  {
    name: "Even number of 1s",
    alphabet: ["0", "1"],
    states: [
      { id: "e", label: "even", x: 160, y: 150, accept: true },
      { id: "o", label: "odd", x: 300, y: 150, accept: false },
    ],
    start: "e",
    transitions: {
      e: { "0": "e", "1": "o" },
      o: { "0": "o", "1": "e" },
    },
    sample: "10110",
    annotate: (s) => {
      const ones = s.split("").filter((c) => c === "1").length;
      return `1s so far: ${ones} (${ones % 2 === 0 ? "even" : "odd"})`;
    },
  },
  {
    name: "Ends in “ab”",
    alphabet: ["a", "b"],
    states: [
      { id: "s0", label: "s₀", x: 80, y: 150, accept: false },
      { id: "sA", label: "a", x: 215, y: 150, accept: false },
      { id: "sAB", label: "ab", x: 350, y: 150, accept: true },
    ],
    start: "s0",
    transitions: {
      s0: { a: "sA", b: "s0" },
      sA: { a: "sA", b: "sAB" },
      sAB: { a: "sA", b: "s0" },
    },
    curves: { "sAB>s0": -0.35 },
    sample: "abab",
    annotate: (s) =>
      s ? `last two symbols: “${s.slice(-2)}”` : "nothing read yet",
  },
];

const W = 440;
const H = 292;
const R = 24;
const GOOD = "#0ca30c";

type Edge = { from: StateNode; to: StateNode; symbols: string[]; curve: number };

function buildEdges(m: DFA): Edge[] {
  const byPair = new Map<string, string[]>();
  for (const [from, row] of Object.entries(m.transitions)) {
    for (const [sym, to] of Object.entries(row)) {
      const key = `${from}>${to}`;
      byPair.set(key, [...(byPair.get(key) ?? []), sym]);
    }
  }
  const node = (id: string) => m.states.find((s) => s.id === id)!;
  return [...byPair.entries()].map(([key, symbols]) => {
    const [from, to] = key.split(">");
    const reverse = byPair.has(`${to}>${from}`) && from !== to;
    const curve = m.curves?.[key] ?? (reverse ? 0.22 : 0);
    return { from: node(from), to: node(to), symbols, curve };
  });
}

export default function FiniteAutomataDemo() {
  const uid = useId();
  const [machineIdx, setMachineIdx] = useState(0);
  const machine = MACHINES[machineIdx];
  const [input, setInput] = useState(MACHINES[0].sample);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  const edges = useMemo(() => buildEdges(machine), [machine]);

  // Fold the consumed prefix through delta to find the current state.
  const consumed = input.slice(0, pos);
  const currentId = consumed
    .split("")
    .reduce((state, sym) => machine.transitions[state][sym], machine.start);
  const current = machine.states.find((s) => s.id === currentId)!;
  const done = pos >= input.length;
  const accepted = done && current.accept;

  // The edge used by the most recent step, for highlighting.
  const lastEdge =
    pos > 0
      ? {
          from: input
            .slice(0, pos - 1)
            .split("")
            .reduce((st, sym) => machine.transitions[st][sym], machine.start),
          symbol: input[pos - 1],
        }
      : null;

  function selectMachine(i: number) {
    setMachineIdx(i);
    setInput(MACHINES[i].sample);
    setPos(0);
    setRunning(false);
  }

  function editInput(raw: string) {
    const cleaned = raw
      .split("")
      .filter((c) => machine.alphabet.includes(c))
      .slice(0, 16)
      .join("");
    setInput(cleaned);
    setPos(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (pos >= input.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setPos((p) => p + 1), 550);
    return () => clearTimeout(t);
  }, [running, pos, input]);

  const edgePath = (e: Edge): { d: string; label: [number, number] } => {
    if (e.from.id === e.to.id) {
      const dirUp = e.from.loop !== "down";
      const s = dirUp ? -1 : 1;
      const y0 = e.from.y + s * (R - 3);
      return {
        d: `M${e.from.x - 11},${y0} C${e.from.x - 26},${e.from.y + s * (R + 36)} ${e.from.x + 26},${e.from.y + s * (R + 36)} ${e.from.x + 11},${y0}`,
        label: [e.from.x, e.from.y + s * (R + 33)],
      };
    }
    const dx = e.to.x - e.from.x;
    const dy = e.to.y - e.from.y;
    const dist = Math.hypot(dx, dy);
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const k = e.curve * dist;
    const cx = (e.from.x + e.to.x) / 2 + px * k;
    const cy = (e.from.y + e.to.y) / 2 + py * k;
    // trim endpoints to the circle borders, aimed at the control point
    const aim = (x: number, y: number, tx: number, ty: number) => {
      const d2 = Math.hypot(tx - x, ty - y);
      return [x + ((tx - x) / d2) * R, y + ((ty - y) / d2) * R];
    };
    const [x1, y1] = aim(e.from.x, e.from.y, cx, cy);
    const [x2, y2] = aim(e.to.x, e.to.y, cx, cy);
    const labelSide = k === 0 ? -14 : (k > 0 ? 14 : -14) * 1.15;
    return {
      d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`,
      label: [
        (x1 + 2 * cx + x2) / 4 + px * (k === 0 ? labelSide : labelSide * 0.55),
        (y1 + 2 * cy + y2) / 4 + py * (k === 0 ? labelSide : labelSide * 0.55),
      ],
    };
  };

  return (
    <DemoCard
      title="Run a finite automaton"
      controls={
        <>
          <Control label="Machine">
            <select
              className={selectClass}
              value={machineIdx}
              onChange={(e) => selectMachine(Number(e.target.value))}
            >
              {MACHINES.map((m, i) => (
                <option key={m.name} value={i}>
                  {m.name}
                </option>
              ))}
            </select>
          </Control>
          <Control label={`Input (alphabet: ${machine.alphabet.join(", ")})`}>
            <input
              className={`${selectClass} w-40 font-mono`}
              value={input}
              onChange={(e) => editInput(e.target.value)}
              spellCheck={false}
            />
          </Control>
          <button className={buttonClass} onClick={() => setPos((p) => Math.min(p + 1, input.length))} disabled={done}>
            Step
          </button>
          <button className={buttonClass} onClick={() => setRunning((r) => !r)} disabled={done}>
            {running ? "Pause" : "Run"}
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => {
              setPos(0);
              setRunning(false);
            }}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {machine.annotate(consumed)} · state <strong>{current.label}</strong>
          {done && " · input consumed"}
        </span>
      }
    >
      <div className="not-prose">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full max-w-md rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`State diagram of the machine "${machine.name}"; current state ${current.label}`}
        >
          <defs>
            <marker id={`${uid}-m`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--viz-axis)" />
            </marker>
            <marker id={`${uid}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--series-blue)" />
            </marker>
          </defs>

          {/* start arrow */}
          {(() => {
            const s = machine.states.find((st) => st.id === machine.start)!;
            return (
              <path
                d={`M${s.x - R - 34},${s.y} L${s.x - R - 2},${s.y}`}
                stroke="var(--viz-axis)"
                strokeWidth="1.5"
                markerEnd={`url(#${uid}-m)`}
              />
            );
          })()}

          {/* edges */}
          {edges.map((e) => {
            const { d, label } = edgePath(e);
            const isActive =
              lastEdge !== null &&
              e.from.id === lastEdge.from &&
              e.symbols.includes(lastEdge.symbol) &&
              machine.transitions[lastEdge.from][lastEdge.symbol] === e.to.id;
            return (
              <g key={`${e.from.id}>${e.to.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={isActive ? "var(--series-blue)" : "var(--viz-axis)"}
                  strokeWidth={isActive ? 2 : 1.5}
                  markerEnd={`url(#${uid}-${isActive ? "b" : "m"})`}
                />
                <text
                  x={label[0]}
                  y={label[1] + 3.5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isActive ? 700 : 400}
                  fill="var(--foreground)"
                  className="font-mono"
                >
                  {e.symbols.join(",")}
                </text>
              </g>
            );
          })}

          {/* states */}
          {machine.states.map((s) => {
            const isCurrent = s.id === currentId;
            return (
              <g key={s.id}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={R}
                  fill={isCurrent ? "var(--series-blue)" : "var(--surface-card)"}
                  stroke={isCurrent ? "var(--series-blue)" : "var(--hairline)"}
                  strokeWidth="1.5"
                />
                {s.accept && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={R - 4.5}
                    fill="none"
                    stroke={isCurrent ? "var(--viz-surface)" : "var(--ink-muted)"}
                    strokeWidth="1.3"
                  />
                )}
                <text
                  x={s.x}
                  y={s.y + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={600}
                  fill={isCurrent ? "#ffffff" : "var(--foreground)"}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* the tape */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1" aria-label="input tape">
          {input.length === 0 && <span className="text-xs text-ink-3">ε (empty input)</span>}
          {input.split("").map((ch, i) => (
            <span
              key={i}
              className={`inline-flex h-8 w-7 items-center justify-center rounded-md border font-mono text-sm ${
                i < pos
                  ? "border-hairline text-ink-3"
                  : i === pos
                    ? "border-accent font-bold text-foreground"
                    : "border-hairline text-foreground"
              }`}
            >
              {ch}
            </span>
          ))}
          {done && (
            <span
              className="ml-3 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: accepted ? GOOD : "var(--status-critical)" }}
            >
              {accepted ? "✓ accepted" : "✗ rejected"}
            </span>
          )}
        </div>

        {/* transition table */}
        <details className="mx-auto mt-3 max-w-md text-xs text-ink-2">
          <summary className="cursor-pointer select-none text-ink-3">
            Transition table δ
          </summary>
          <table className="mt-2 w-full text-left" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="border-b border-hairline">
                <th className="py-1 pr-4 font-medium">state</th>
                {machine.alphabet.map((a) => (
                  <th key={a} className="py-1 pr-4 font-mono font-medium">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {machine.states.map((s) => (
                <tr key={s.id} className="border-b border-hairline/50">
                  <td className="py-1 pr-4">
                    {s.id === machine.start ? "→ " : ""}
                    {s.label}
                    {s.accept ? " ★" : ""}
                  </td>
                  {machine.alphabet.map((a) => (
                    <td key={a} className="py-1 pr-4">
                      {machine.states.find((t) => t.id === machine.transitions[s.id][a])?.label}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-ink-3">→ start state · ★ accepting</p>
        </details>
      </div>
    </DemoCard>
  );
}
