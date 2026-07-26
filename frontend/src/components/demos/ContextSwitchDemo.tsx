"use client";

import { useEffect, useState } from "react";
import DemoCard, { buttonClass } from "./DemoCard";

/* One context switch, stage by stage. The registers on the CPU *are* the
   running process; switching means copying them out to a PCB in kernel
   memory and copying another process's copy back in. Step through it and
   watch the same four registers change hands. */

type Regs = { PC: number; SP: number; R0: number; R1: number };
const REG_KEYS: (keyof Regs)[] = ["PC", "SP", "R0", "R1"];

type Pid = "A" | "B";

const INFO: Record<Pid, { name: string; color: string }> = {
  A: { name: "Process A — compile", color: "var(--series-blue)" },
  B: { name: "Process B — browser", color: "var(--series-aqua)" },
};

const SLICE = 10; // useful cycles per time slice
const PHASES = [
  { key: "run", label: "Run", cost: 0 },
  { key: "interrupt", label: "Interrupt", cost: 1 },
  { key: "save", label: "Save", cost: 1 },
  { key: "schedule", label: "Schedule", cost: 1 },
  { key: "space", label: "Address space", cost: 2 },
  { key: "restore", label: "Restore", cost: 1 },
  { key: "resume", label: "Resume", cost: 1 },
] as const;

const SWITCH_COST = PHASES.reduce((a, p) => a + p.cost, 0);

type State = {
  phase: number;
  running: Pid;
  incoming: Pid;
  cpu: Regs;
  pcb: Record<Pid, Regs>;
  stale: Record<Pid, boolean>; // PCB copy is out of date (process is on the CPU)
  mode: "user" | "kernel";
  warmth: number; // cache + TLB usefulness, 0..1
  useful: number;
  overhead: number;
  switches: number;
  touched: { cpu: boolean; pcb: Pid | null };
  msg: string;
};

const initial = (): State => ({
  phase: 0,
  running: "A",
  incoming: "B",
  cpu: { PC: 1024, SP: 65500, R0: 7, R1: 3 },
  pcb: {
    A: { PC: 1024, SP: 65500, R0: 7, R1: 3 },
    B: { PC: 2048, SP: 61400, R0: 42, R1: 12 },
  },
  stale: { A: true, B: false },
  mode: "user",
  warmth: 0.9,
  useful: 0,
  overhead: 0,
  switches: 0,
  touched: { cpu: false, pcb: null },
  msg: `Process A is running in user mode. Its registers are the CPU's registers — nothing else about it is "on" the processor.`,
});

function advance(s: State): State {
  const n: State = {
    ...s,
    cpu: { ...s.cpu },
    pcb: { A: { ...s.pcb.A }, B: { ...s.pcb.B } },
    stale: { ...s.stale },
    touched: { cpu: false, pcb: null },
  };
  const phase = PHASES[s.phase];
  n.phase = (s.phase + 1) % PHASES.length;
  n.overhead = s.overhead + phase.cost;
  const cur = s.running;
  const other = s.incoming;

  switch (phase.key) {
    case "run":
      // The slice: real work happens, and the caches warm up to this process.
      n.cpu.PC = s.cpu.PC + SLICE;
      n.cpu.R0 = s.cpu.R0 + 1;
      n.useful = s.useful + SLICE;
      n.warmth = Math.min(1, s.warmth + 0.45);
      n.stale[cur] = true;
      n.touched = { cpu: true, pcb: null };
      n.msg = `${INFO[cur].name} runs for a time slice: ${SLICE} cycles of real work. PC advances, R0 changes — and the caches fill with this process's data.`;
      break;
    case "interrupt":
      n.mode = "kernel";
      n.touched = { cpu: false, pcb: null };
      n.msg = `Timer interrupt. The hardware stops ${cur} mid-stride, switches to kernel mode, and jumps to the scheduler's handler. The process never asked for this and never notices it.`;
      break;
    case "save":
      n.pcb[cur] = { ...s.cpu };
      n.stale[cur] = false;
      n.touched = { cpu: false, pcb: cur };
      n.msg = `Save. The kernel copies all four registers out of the CPU into ${cur}'s process control block. That copy is now the entire live state of ${cur} — everything needed to resume it later.`;
      break;
    case "schedule":
      n.msg = `Schedule. The kernel walks its run queue and picks ${other} to run next. This is the only step that involves any policy; the rest is pure bookkeeping.`;
      break;
    case "space":
      n.warmth = 0.05;
      n.msg = `Address space. The page-table base register is pointed at ${other}'s tables, so the same virtual addresses now mean different physical memory — and the TLB and caches are suddenly full of the wrong process's data.`;
      break;
    case "restore":
      n.cpu = { ...s.pcb[other] };
      n.stale[other] = true;
      n.touched = { cpu: true, pcb: other };
      n.msg = `Restore. ${other}'s saved registers are copied back onto the CPU. The processor is now, in every sense that matters, ${other}.`;
      break;
    case "resume":
      n.mode = "user";
      n.running = other;
      n.incoming = cur;
      n.switches = s.switches + 1;
      n.msg = `Return from interrupt: back to user mode, resuming ${other} at the exact instruction it was stopped at. The switch cost ${SWITCH_COST} cycles of overhead — plus a cold cache to pay off.`;
      break;
  }
  return n;
}

export default function ContextSwitchDemo() {
  const [s, setS] = useState<State>(initial);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setS(advance), 1400);
    return () => clearInterval(id);
  }, [auto]);

  const activePhase = PHASES[s.phase]; // the stage the next Step will perform

  const regTable = (title: string, regs: Regs, opts: { color?: string; highlight?: boolean; note?: string; label: string }) => (
    <div
      className="rounded-md border p-2"
      style={{
        borderColor: opts.highlight ? (opts.color ?? "var(--series-blue)") : "var(--viz-axis)",
        background: opts.highlight
          ? `color-mix(in srgb, ${opts.color ?? "var(--series-blue)"} 12%, transparent)`
          : "transparent",
      }}
      aria-label={opts.label}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium" style={{ color: opts.color }}>
          {title}
        </span>
        {opts.note && <span className="text-[10px] text-ink-3">{opts.note}</span>}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
        {REG_KEYS.map((k) => (
          <div key={k} className="flex justify-between font-mono text-[11px]">
            <span className="text-ink-3">{k}</span>
            <span className="font-semibold">{regs[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DemoCard
      title="One context switch, stage by stage"
      controls={
        <>
          <button
            className={buttonClass}
            onClick={() => setS((cur) => advance(cur))}
            disabled={auto}
          >
            Step
          </button>
          <button className={buttonClass} onClick={() => setAuto(true)} disabled={auto}>
            Auto
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => setAuto(false)}
            disabled={!auto}
          >
            Pause
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => {
              setAuto(false);
              setS(initial());
            }}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span>
          A process is not a thing the CPU holds — it is a set of register values
          plus a memory map. Switching means copying one set out to a{" "}
          <strong>process control block</strong> and another set in, which is why the
          direct cost is only a few cycles. The expensive part is the warmth bar:
          the incoming process starts with cold caches and an empty TLB, and every
          miss costs a trip to RAM.
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        {PHASES.map((p, i) => (
          <span
            key={p.key}
            aria-label={i === s.phase ? "next stage" : undefined}
            className="rounded-full px-2 py-1 font-medium"
            style={{
              background: i === s.phase ? "var(--series-blue)" : "var(--viz-surface)",
              color: i === s.phase ? "#fff" : "var(--ink-3)",
              border: "1px solid var(--viz-axis)",
            }}
          >
            {p.label}
          </span>
        ))}
        <span
          className="ml-auto rounded-full px-2.5 py-1 font-medium"
          aria-label="mode"
          style={{
            background: s.mode === "kernel" ? "var(--series-red)" : "var(--viz-surface)",
            color: s.mode === "kernel" ? "#fff" : "var(--ink-3)",
            border: "1px solid var(--viz-axis)",
          }}
        >
          {s.mode} mode
        </span>
      </div>

      <p className="mb-4 min-h-[3rem] text-sm text-ink-2" aria-label="narration">
        {s.msg}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {regTable(`PCB — Process A`, s.pcb.A, {
          color: INFO.A.color,
          highlight: s.touched.pcb === "A",
          note: s.stale.A ? "stale (A is on the CPU)" : "saved",
          label: "pcb A",
        })}
        <div>
          {regTable(`CPU registers`, s.cpu, {
            color: INFO[s.running].color,
            highlight: s.touched.cpu,
            note: `running: ${s.running}`,
            label: "cpu registers",
          })}
          <div className="mt-2 text-[10px] text-ink-3">cache + TLB warmth</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-(--viz-grid)">
            <div
              className="h-full rounded-full transition-all duration-500"
              aria-label="warmth"
              style={{
                width: `${Math.round(s.warmth * 100)}%`,
                background: s.warmth < 0.3 ? "var(--series-red)" : "var(--series-aqua)",
              }}
            />
          </div>
          <div className="mt-1 text-[10px] text-ink-3">
            {s.warmth < 0.3
              ? "cold — the next accesses miss all the way to RAM"
              : "warm — most accesses hit in cache"}
          </div>
        </div>
        {regTable(`PCB — Process B`, s.pcb.B, {
          color: INFO.B.color,
          highlight: s.touched.pcb === "B",
          note: s.stale.B ? "stale (B is on the CPU)" : "saved",
          label: "pcb B",
        })}
      </div>

      <div
        className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span aria-label="switch count">
          switches: <strong>{s.switches}</strong>
        </span>
        <span>
          useful cycles: <strong>{s.useful}</strong>
        </span>
        <span>
          overhead cycles: <strong>{s.overhead}</strong>
        </span>
        <span aria-label="next stage name">
          next: <strong>{activePhase.label}</strong>
        </span>
      </div>
    </DemoCard>
  );
}
