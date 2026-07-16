"use client";

import { useMemo, useState } from "react";
import DemoCard, { Control, selectClass } from "./DemoCard";

type Op = "AND" | "OR" | "XOR" | "NAND" | "NOT";
type InputSpec = { id: string; label: string; x: number; y: number };
type GateSpec = { id: string; op: Op; in: string[]; x: number; y: number };
type OutputSpec = { id: string; from: string; label: string; x: number; y: number };
type Circuit = {
  inputs: InputSpec[];
  gates: GateSpec[];
  outputs: OutputSpec[];
  w: number;
  h: number;
};

const SW = 40; // switch size
const SH = 28;
const GW = 64; // gate size
const GH = 44;

const OP_SYMBOL: Record<Op, string> = { AND: "∧", OR: "∨", XOR: "⊕", NAND: "⊼", NOT: "¬" };

function applyOp(op: Op, a: boolean, b?: boolean): boolean {
  switch (op) {
    case "AND": return a && b!;
    case "OR": return a || b!;
    case "XOR": return a !== b;
    case "NAND": return !(a && b!);
    case "NOT": return !a;
  }
}

function oneGateCircuit(op: Op): Circuit {
  if (op === "NOT") {
    return {
      inputs: [{ id: "A", label: "A", x: 30, y: 86 }],
      gates: [{ id: "g", op, in: ["A"], x: 180, y: 78 }],
      outputs: [{ id: "out", from: "g", label: "out", x: 330, y: 100 }],
      w: 400, h: 200,
    };
  }
  return {
    inputs: [
      { id: "A", label: "A", x: 30, y: 46 },
      { id: "B", label: "B", x: 30, y: 126 },
    ],
    gates: [{ id: "g", op, in: ["A", "B"], x: 180, y: 78 }],
    outputs: [{ id: "out", from: "g", label: "out", x: 330, y: 100 }],
    w: 400, h: 200,
  };
}

const XOR_FROM_NAND: Circuit = {
  inputs: [
    { id: "A", label: "A", x: 24, y: 56 },
    { id: "B", label: "B", x: 24, y: 196 },
  ],
  gates: [
    { id: "n1", op: "NAND", in: ["A", "B"], x: 140, y: 104 },
    { id: "n2", op: "NAND", in: ["A", "n1"], x: 258, y: 36 },
    { id: "n3", op: "NAND", in: ["n1", "B"], x: 258, y: 172 },
    { id: "n4", op: "NAND", in: ["n2", "n3"], x: 374, y: 104 },
  ],
  outputs: [{ id: "out", from: "n4", label: "A ⊕ B", x: 500, y: 126 }],
  w: 560, h: 252,
};

const HALF_ADDER: Circuit = {
  inputs: [
    { id: "A", label: "A", x: 24, y: 46 },
    { id: "B", label: "B", x: 24, y: 168 },
  ],
  gates: [
    { id: "xor", op: "XOR", in: ["A", "B"], x: 180, y: 34 },
    { id: "and", op: "AND", in: ["A", "B"], x: 180, y: 158 },
  ],
  outputs: [
    { id: "sum", from: "xor", label: "Sum", x: 340, y: 56 },
    { id: "carry", from: "and", label: "Carry", x: 340, y: 180 },
  ],
  w: 420, h: 240,
};

const FULL_ADDER: Circuit = {
  inputs: [
    { id: "A", label: "A", x: 24, y: 30 },
    { id: "B", label: "B", x: 24, y: 100 },
    { id: "Cin", label: "Cin", x: 24, y: 210 },
  ],
  gates: [
    { id: "x1", op: "XOR", in: ["A", "B"], x: 140, y: 44 },
    { id: "s", op: "XOR", in: ["x1", "Cin"], x: 268, y: 84 },
    { id: "a1", op: "AND", in: ["A", "B"], x: 140, y: 186 },
    { id: "a2", op: "AND", in: ["x1", "Cin"], x: 268, y: 168 },
    { id: "or", op: "OR", in: ["a2", "a1"], x: 372, y: 186 },
  ],
  outputs: [
    { id: "sum", from: "s", label: "Sum", x: 430, y: 106 },
    { id: "cout", from: "or", label: "Cout", x: 480, y: 208 },
  ],
  w: 560, h: 270,
};

const MODES = ["One gate", "XOR from NAND", "Half adder", "Full adder"] as const;
const EXPLORER_OPS: Op[] = ["AND", "OR", "XOR", "NAND", "NOT"];

export default function LogicGatesDemo() {
  const [mode, setMode] = useState(0);
  const [gateOp, setGateOp] = useState<Op>("AND");
  const [on, setOn] = useState<Record<string, boolean>>({});

  const circuit = useMemo<Circuit>(() => {
    if (mode === 0) return oneGateCircuit(gateOp);
    if (mode === 1) return XOR_FROM_NAND;
    if (mode === 2) return HALF_ADDER;
    return FULL_ADDER;
  }, [mode, gateOp]);

  const vals = useMemo(() => {
    const v: Record<string, boolean> = {};
    for (const i of circuit.inputs) v[i.id] = on[i.id] ?? false;
    for (const g of circuit.gates) v[g.id] = applyOp(g.op, v[g.in[0]], g.in[1] !== undefined ? v[g.in[1]] : undefined);
    return v;
  }, [circuit, on]);

  const bit = (b: boolean) => (b ? 1 : 0);
  const A = bit(vals.A ?? false);
  const B = bit(vals.B ?? false);

  const caption = (() => {
    if (mode === 0) {
      return gateOp === "NOT"
        ? `¬${A} = ${bit(vals.g)}`
        : `${A} ${OP_SYMBOL[gateOp]} ${B} = ${bit(vals.g)}`;
    }
    if (mode === 1) return `A ⊕ B = ${bit(vals.n4)} — four NANDs are enough (NAND is universal)`;
    if (mode === 2) {
      const c = bit(vals.and);
      const s = bit(vals.xor);
      return `${A} + ${B} = ${c}${s}₂ (${2 * c + s} in decimal): Sum = A ⊕ B, Carry = A ∧ B`;
    }
    const cin = bit(vals.Cin ?? false);
    const s = bit(vals.s);
    const c = bit(vals.or);
    return `${A} + ${B} + ${cin} = ${c}${s}₂ (${2 * c + s} in decimal) — chain these and you can add any numbers`;
  })();

  // ports
  const outPort = (id: string): [number, number] => {
    const i = circuit.inputs.find((n) => n.id === id);
    if (i) return [i.x + SW, i.y + SH / 2];
    const g = circuit.gates.find((n) => n.id === id)!;
    return [g.x + GW, g.y + GH / 2];
  };
  const gateInPort = (g: GateSpec, idx: number): [number, number] => [
    g.x,
    g.y + (GH * (idx + 1)) / (g.in.length + 1),
  ];

  const wire = (from: [number, number], to: [number, number], hot: boolean, key: string) => {
    const midX = (from[0] + to[0]) / 2;
    return (
      <path
        key={key}
        d={`M${from[0]},${from[1]} L${midX},${from[1]} L${midX},${to[1]} L${to[0]},${to[1]}`}
        fill="none"
        stroke={hot ? "var(--series-blue)" : "var(--viz-axis)"}
        strokeWidth={hot ? 2.2 : 1.5}
      />
    );
  };

  // truth table (shown for 2-input single gates, xor-from-nand, half adder)
  const table = (() => {
    if (mode === 0 && gateOp !== "NOT") {
      return {
        head: ["A", "B", "out"],
        rows: [0, 1, 2, 3].map((i) => {
          const a = i >> 1, b = i & 1;
          return { cells: [a, b, bit(applyOp(gateOp, !!a, !!b))], active: a === A && b === B };
        }),
      };
    }
    if (mode === 1) {
      return {
        head: ["A", "B", "A ⊕ B"],
        rows: [0, 1, 2, 3].map((i) => {
          const a = i >> 1, b = i & 1;
          return { cells: [a, b, bit(!!a !== !!b)], active: a === A && b === B };
        }),
      };
    }
    if (mode === 2) {
      return {
        head: ["A", "B", "Carry", "Sum"],
        rows: [0, 1, 2, 3].map((i) => {
          const a = i >> 1, b = i & 1;
          return { cells: [a, b, a & b, a ^ b], active: a === A && b === B };
        }),
      };
    }
    return null;
  })();

  return (
    <DemoCard
      title="Circuits you can flip"
      controls={
        <>
          <Control label="Circuit">
            <select
              className={selectClass}
              value={mode}
              onChange={(e) => {
                setMode(Number(e.target.value));
                setOn({});
              }}
            >
              {MODES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </Control>
          {mode === 0 && (
            <div className="flex gap-1.5">
              {EXPLORER_OPS.map((op) => (
                <button
                  key={op}
                  onClick={() => setGateOp(op)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    gateOp === op
                      ? "border-accent bg-accent text-white"
                      : "border-hairline bg-background text-ink-2 hover:text-foreground"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          )}
          <span className="pb-1.5 text-xs text-ink-3">click the switches</span>
        </>
      }
      footer={<span style={{ fontVariantNumeric: "tabular-nums" }}>{caption}</span>}
    >
      <div className="not-prose grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <svg
          viewBox={`0 0 ${circuit.w} ${circuit.h}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Logic circuit: ${MODES[mode]}${mode === 0 ? ` (${gateOp})` : ""}; ${caption}`}
        >
          {/* wires */}
          {circuit.gates.flatMap((g) =>
            g.in.map((src, i) => wire(outPort(src), gateInPort(g, i), vals[src], `${g.id}-${src}-${i}`)),
          )}
          {circuit.outputs.map((o) => wire(outPort(o.from), [o.x - 14, o.y], vals[o.from], `out-${o.id}`))}

          {/* input switches */}
          {circuit.inputs.map((i) => (
            <g key={i.id} onClick={() => setOn({ ...on, [i.id]: !(on[i.id] ?? false) })} style={{ cursor: "pointer" }}>
              <rect
                x={i.x}
                y={i.y}
                width={SW}
                height={SH}
                rx="6"
                fill={vals[i.id] ? "var(--series-blue)" : "var(--surface-card)"}
                stroke={vals[i.id] ? "var(--series-blue)" : "var(--hairline)"}
                strokeWidth="1.5"
              />
              <text
                x={i.x + SW / 2}
                y={i.y + SH / 2 + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight={700}
                fill={vals[i.id] ? "#ffffff" : "var(--foreground)"}
                className="font-mono"
              >
                {bit(vals[i.id])}
              </text>
              <text x={i.x + SW / 2} y={i.y - 6} textAnchor="middle" fontSize="10" fontStyle="italic" fill="var(--ink-secondary)">
                {i.label}
              </text>
              <rect
                x={i.x - 6}
                y={i.y - 6}
                width={SW + 12}
                height={SH + 12}
                fill="transparent"
                role="switch"
                aria-checked={vals[i.id]}
                aria-label={`input ${i.label}`}
              />
            </g>
          ))}

          {/* gates */}
          {circuit.gates.map((g) => (
            <g key={g.id}>
              <rect
                x={g.x}
                y={g.y}
                width={GW}
                height={GH}
                rx="8"
                fill="var(--surface-card)"
                stroke={vals[g.id] ? "var(--series-blue)" : "var(--hairline)"}
                strokeWidth={vals[g.id] ? 2 : 1}
              />
              <text x={g.x + GW / 2} y={g.y + GH / 2 + 4} textAnchor="middle" fontSize="11.5" fontWeight={600} fill="var(--foreground)">
                {g.op}
              </text>
            </g>
          ))}

          {/* output bulbs */}
          {circuit.outputs.map((o) => (
            <g key={o.id}>
              <circle
                cx={o.x}
                cy={o.y}
                r="14"
                fill={vals[o.from] ? "var(--series-blue)" : "var(--surface-card)"}
                stroke={vals[o.from] ? "var(--series-blue)" : "var(--hairline)"}
                strokeWidth="1.5"
              />
              <text
                x={o.x}
                y={o.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight={700}
                fill={vals[o.from] ? "#ffffff" : "var(--foreground)"}
                className="font-mono"
              >
                {bit(vals[o.from])}
              </text>
              <text x={o.x} y={o.y - 20} textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">
                {o.label}
              </text>
            </g>
          ))}
        </svg>

        {table && (
          <table className="text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="border-b border-hairline text-ink-2">
                {table.head.map((h) => (
                  <th key={h} className="px-2 py-1 text-center font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {table.rows.map((r, i) => (
                <tr
                  key={i}
                  className={r.active ? "rounded bg-accent/10 font-bold" : "text-ink-2"}
                >
                  {r.cells.map((c, j) => (
                    <td key={j} className="px-2 py-1 text-center">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DemoCard>
  );
}
