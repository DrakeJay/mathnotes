"use client";

import { useEffect, useRef, useState } from "react";
import DemoCard, { buttonClass } from "./DemoCard";

/* A tiny von Neumann machine you single-step through the fetch–decode–execute
   cycle. Instructions live in the same memory as data, encoded as numbers:
   word = opcode·10000 + regA·1000 + operand. The decoder splits that number
   back into fields, and the ALU does the arithmetic — the same adder built
   from gates in the logic-gates lesson, scaled up. */

const OPS = {
  HALT: 0,
  SET: 1,
  LOAD: 2,
  STORE: 3,
  ADD: 4,
  SUB: 5,
  JMP: 6,
  JNZ: 7,
} as const;

const enc = (op: keyof typeof OPS, a: number, b: number) => OPS[op] * 10000 + a * 1000 + b;

// Program: sum 5 + 4 + 3 + 2 + 1, store the result (15) in memory cell 15.
const PROGRAM: { word: number; text: string }[] = [
  { word: enc("SET", 0, 0), text: "SET  R0, 0" },
  { word: enc("SET", 1, 5), text: "SET  R1, 5" },
  { word: enc("SET", 2, 1), text: "SET  R2, 1" },
  { word: enc("ADD", 0, 1), text: "ADD  R0, R1" },
  { word: enc("SUB", 1, 2), text: "SUB  R1, R2" },
  { word: enc("JNZ", 1, 3), text: "JNZ  R1, 3" },
  { word: enc("STORE", 0, 15), text: "STORE R0, 15" },
  { word: enc("HALT", 0, 0), text: "HALT" },
];

const MEMSIZE = 16;
const RESULT_CELL = 15;

type Stage = "fetch" | "decode" | "execute" | "halted";

type Machine = {
  mem: number[];
  R: number[];
  PC: number;
  IR: number;
  stage: Stage; // the stage that will run on the next Step
  performed: Stage | null; // the stage the last Step actually ran (for highlight)
  decoded: { op: number; a: number; b: number } | null;
  msg: string;
  alu: { lhs: number; sym: string; rhs: number; out: number } | null;
  touchedMem: number | null;
  touchedReg: number | null;
  instrs: number;
  cycles: number;
};

function initMachine(): Machine {
  const mem = new Array(MEMSIZE).fill(0);
  PROGRAM.forEach((ins, i) => (mem[i] = ins.word));
  return {
    mem,
    R: [0, 0, 0, 0],
    PC: 0,
    IR: 0,
    stage: "fetch",
    performed: null,
    decoded: null,
    msg: "Ready — press Step to fetch the first instruction.",
    alu: null,
    touchedMem: null,
    touchedReg: null,
    instrs: 0,
    cycles: 0,
  };
}

const decodeWord = (w: number) => ({
  op: Math.floor(w / 10000),
  a: Math.floor(w / 1000) % 10,
  b: w % 1000,
});

function disasm(w: number): string {
  const { op, a, b } = decodeWord(w);
  switch (op) {
    case OPS.SET: return `SET R${a}, ${b}`;
    case OPS.LOAD: return `LOAD R${a}, [${b}]`;
    case OPS.STORE: return `STORE R${a}, [${b}]`;
    case OPS.ADD: return `ADD R${a}, R${b}`;
    case OPS.SUB: return `SUB R${a}, R${b}`;
    case OPS.JMP: return `JMP ${b}`;
    case OPS.JNZ: return `JNZ R${a}, ${b}`;
    default: return "HALT";
  }
}

function step(m: Machine): Machine {
  if (m.stage === "halted") return m;
  const next: Machine = {
    ...m,
    mem: m.mem.slice(),
    R: m.R.slice(),
    alu: null,
    touchedMem: null,
    touchedReg: null,
    cycles: m.cycles + 1,
  };

  if (m.stage === "fetch") {
    next.IR = m.mem[m.PC];
    next.touchedMem = m.PC;
    next.PC = m.PC + 1;
    next.decoded = null;
    next.msg = `Fetch — read the word ${next.IR} from address ${m.PC}; PC advances to ${next.PC}.`;
    next.performed = "fetch";
    next.stage = "decode";
    return next;
  }

  if (m.stage === "decode") {
    next.decoded = decodeWord(m.IR);
    next.msg = `Decode — the number ${m.IR} splits into the instruction ${disasm(m.IR)}.`;
    next.performed = "decode";
    next.stage = "execute";
    return next;
  }

  // execute
  const d = m.decoded ?? decodeWord(m.IR);
  const { op, a, b } = d;
  next.instrs = m.instrs + 1;
  next.performed = "execute";
  next.stage = "fetch";
  switch (op) {
    case OPS.SET:
      next.R[a] = b;
      next.touchedReg = a;
      next.msg = `Execute — load the constant ${b} into R${a}.`;
      break;
    case OPS.LOAD:
      next.R[a] = m.mem[b];
      next.touchedReg = a;
      next.touchedMem = b;
      next.msg = `Execute — copy memory[${b}] = ${m.mem[b]} into R${a}.`;
      break;
    case OPS.STORE:
      next.mem[b] = m.R[a];
      next.touchedMem = b;
      next.msg = `Execute — write R${a} = ${m.R[a]} into memory[${b}].`;
      break;
    case OPS.ADD:
      next.alu = { lhs: m.R[a], sym: "+", rhs: m.R[b], out: m.R[a] + m.R[b] };
      next.R[a] = m.R[a] + m.R[b];
      next.touchedReg = a;
      next.msg = `Execute — ALU computes ${m.R[a]} + ${m.R[b]} = ${next.R[a]}, result to R${a}.`;
      break;
    case OPS.SUB:
      next.alu = { lhs: m.R[a], sym: "−", rhs: m.R[b], out: m.R[a] - m.R[b] };
      next.R[a] = m.R[a] - m.R[b];
      next.touchedReg = a;
      next.msg = `Execute — ALU computes ${m.R[a]} − ${m.R[b]} = ${next.R[a]}, result to R${a}.`;
      break;
    case OPS.JMP:
      next.PC = b;
      next.msg = `Execute — jump: PC ← ${b}.`;
      break;
    case OPS.JNZ:
      if (m.R[a] !== 0) {
        next.PC = b;
        next.msg = `Execute — R${a} = ${m.R[a]} ≠ 0, so branch: PC ← ${b}.`;
      } else {
        next.msg = `Execute — R${a} = 0, so no branch; fall through.`;
      }
      break;
    case OPS.HALT:
    default:
      next.stage = "halted";
      next.instrs = m.instrs; // HALT isn't counted as work
      next.msg = "HALT — the program has finished.";
      break;
  }
  return next;
}

const REG_NAMES = ["R0", "R1", "R2", "R3"];
const STAGES: { key: Stage; label: string }[] = [
  { key: "fetch", label: "Fetch" },
  { key: "decode", label: "Decode" },
  { key: "execute", label: "Execute" },
];

export default function CpuSimulatorDemo() {
  const [m, setM] = useState<Machine>(initMachine);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3); // stages per second
  const mRef = useRef(m);
  mRef.current = m;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += now - last;
      last = now;
      const interval = 1000 / speedRef.current;
      while (acc >= interval) {
        acc -= interval;
        if (mRef.current.stage === "halted") {
          setRunning(false);
          return;
        }
        const nextState = step(mRef.current);
        mRef.current = nextState;
        setM(nextState);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const halted = m.stage === "halted";
  const activeStage = halted ? null : m.performed;

  const regBox = (i: number) => {
    const active = m.touchedReg === i;
    return (
      <div
        key={i}
        className="rounded-md border px-2 py-1"
        style={{
          borderColor: active ? "var(--series-aqua)" : "var(--viz-axis)",
          background: active ? "color-mix(in srgb, var(--series-aqua) 15%, transparent)" : "transparent",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span className="font-mono text-[10px] text-ink-3">{REG_NAMES[i]}</span>
        <span className="ml-1.5 font-mono text-sm font-semibold">{m.R[i]}</span>
      </div>
    );
  };

  return (
    <DemoCard
      title="A CPU running a program, one stage at a time"
      controls={
        <>
          <button
            className={buttonClass}
            onClick={() => setM((cur) => step(cur))}
            disabled={running || halted}
          >
            Step
          </button>
          <button
            className={buttonClass}
            onClick={() => setRunning(true)}
            disabled={running || halted}
          >
            Run
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => setRunning(false)}
            disabled={!running}
          >
            Pause
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => {
              setRunning(false);
              setM(initMachine());
            }}
          >
            Reset
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-ink-3">Clock = {speed} Hz</span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={speed}
              aria-label="clock speed"
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-(--series-blue)"
            />
          </label>
        </>
      }
      footer={
        <span>
          Every instruction takes three ticks of the clock: <strong>fetch</strong>{" "}
          the numbered word at the program counter, <strong>decode</strong> it into
          an operation and operands, <strong>execute</strong> it. Program and data
          share one memory (the von Neumann design) — the instructions really are
          just numbers living in cells 0–7.
        </span>
      }
    >
      {/* stage indicator + narration */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {STAGES.map((s) => (
          <span
            key={s.key}
            aria-label={activeStage === s.key ? "active stage" : undefined}
            className="rounded-full px-2.5 py-1 font-medium"
            style={{
              background:
                activeStage === s.key ? "var(--series-blue)" : "var(--viz-surface)",
              color: activeStage === s.key ? "#fff" : "var(--ink-3)",
              border: "1px solid var(--viz-axis)",
            }}
          >
            {s.label}
          </span>
        ))}
        <span
          className="rounded-full px-2.5 py-1 font-medium"
          style={{
            background: halted ? "var(--series-red)" : "var(--viz-surface)",
            color: halted ? "#fff" : "var(--ink-3)",
            border: "1px solid var(--viz-axis)",
          }}
          aria-label="machine state"
        >
          {halted ? "Halted" : "Running"}
        </span>
      </div>
      <p className="mb-4 min-h-[2.5rem] text-sm text-ink-2" aria-label="narration">
        {m.msg}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {/* memory listing */}
        <div>
          <div className="mb-1 text-xs text-ink-3">Memory (program in 0–7, data in 8–15)</div>
          <div
            className="overflow-hidden rounded-md border border-hairline"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {m.mem.map((word, addr) => {
              const isPC = !halted && m.PC === addr;
              const touched = m.touchedMem === addr;
              const inProgram = addr < PROGRAM.length;
              return (
                <div
                  key={addr}
                  className="flex items-center gap-2 px-2 py-0.5 font-mono text-[11px]"
                  style={{
                    background: isPC
                      ? "color-mix(in srgb, var(--series-blue) 18%, transparent)"
                      : touched
                        ? "color-mix(in srgb, var(--series-aqua) 16%, transparent)"
                        : "transparent",
                    borderLeft: isPC
                      ? "3px solid var(--series-blue)"
                      : "3px solid transparent",
                  }}
                >
                  <span className="w-6 text-right text-ink-3">{addr}</span>
                  <span className="w-14 text-right font-semibold">{word}</span>
                  <span className="text-ink-2">
                    {inProgram
                      ? disasm(word)
                      : addr === RESULT_CELL
                        ? "← result"
                        : ""}
                  </span>
                  {isPC && <span className="ml-auto text-[10px] text-(--series-blue)">◀ PC</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* datapath */}
        <div>
          <div className="mb-1 text-xs text-ink-3">The processor</div>
          <div className="rounded-md border border-hairline p-3">
            {/* PC + IR */}
            <div className="mb-3 flex gap-2 text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
              <div className="flex-1 rounded-md border border-hairline px-2 py-1">
                <span className="font-mono text-[10px] text-ink-3">PC</span>
                <span className="ml-1.5 font-mono text-sm font-semibold">{halted ? "—" : m.PC}</span>
              </div>
              <div
                className="flex-[2] rounded-md border px-2 py-1"
                style={{
                  borderColor:
                    activeStage === "fetch" || activeStage === "decode"
                      ? "var(--series-blue)"
                      : "var(--viz-axis)",
                }}
              >
                <span className="font-mono text-[10px] text-ink-3">IR</span>
                <span className="ml-1.5 font-mono text-sm font-semibold">{m.IR}</span>
                {m.decoded && (
                  <span className="ml-2 font-mono text-[10px] text-(--series-blue)">
                    {disasm(m.IR)}
                  </span>
                )}
              </div>
            </div>

            {/* registers */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              {REG_NAMES.map((_, i) => regBox(i))}
            </div>

            {/* ALU */}
            <div className="text-xs text-ink-3">ALU</div>
            <svg viewBox="0 0 260 96" className="w-full" role="img" aria-label="arithmetic logic unit">
              <polygon
                points="70,8 190,8 210,44 190,88 70,88 50,44"
                fill={m.alu ? "color-mix(in srgb, var(--series-aqua) 14%, transparent)" : "var(--viz-surface)"}
                stroke={m.alu ? "var(--series-aqua)" : "var(--viz-axis)"}
                strokeWidth="1.5"
              />
              {m.alu ? (
                <text
                  x="130"
                  y="52"
                  textAnchor="middle"
                  fontSize="17"
                  fontFamily="ui-monospace, monospace"
                  fontWeight="600"
                  fill="var(--foreground)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {m.alu.lhs} {m.alu.sym} {m.alu.rhs} = {m.alu.out}
                </text>
              ) : (
                <text x="130" y="52" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">
                  idle
                </text>
              )}
            </svg>
          </div>
          <div
            className="mt-2 text-xs text-ink-2"
            style={{ fontVariantNumeric: "tabular-nums" }}
            aria-label="result"
          >
            memory[15] = <strong>{m.mem[RESULT_CELL]}</strong> · {m.instrs} instructions ·{" "}
            {m.cycles} clock ticks
          </div>
        </div>
      </div>
    </DemoCard>
  );
}
