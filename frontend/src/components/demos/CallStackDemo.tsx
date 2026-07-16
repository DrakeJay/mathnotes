"use client";

import { useEffect, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

const GOOD = "#0ca30c";
const BASE_ADDR = 0xffe0;
const FRAME_SIZE = 0x20;
const STACK_LIMIT_FRAMES = 8; // frames below main() before the limit line

type Ev = { op: "push" | "pop" | "overflow"; name?: string; action: string };
type Program = { name: string; events: Ev[]; result: string | null };

function factorialProgram(n: number): Program {
  const events: Ev[] = [];
  function go(k: number, caller: string): number {
    events.push({
      op: "push",
      name: `factorial(${k})`,
      action: `call factorial(${k}) — push a frame (return address: ${caller})`,
    });
    if (k <= 1) {
      events.push({ op: "pop", action: `factorial(${k}) hits the base case → returns 1 — pop the frame` });
      return 1;
    }
    const sub = go(k - 1, `factorial(${k})`);
    const val = k * sub;
    events.push({ op: "pop", action: `factorial(${k}) resumes: ${k} × ${sub} = ${val} → return — pop` });
    return val;
  }
  const result = go(n, "main()");
  return { name: `factorial(${n})`, events, result: `factorial(${n}) = ${result}` };
}

function fibProgram(n: number): Program {
  const events: Ev[] = [];
  function go(k: number, caller: string): number {
    events.push({
      op: "push",
      name: `fib(${k})`,
      action: `call fib(${k}) — push a frame (return address: ${caller})`,
    });
    if (k <= 1) {
      events.push({ op: "pop", action: `fib(${k}) is a base case → returns ${k} — pop` });
      return k;
    }
    const a = go(k - 1, `fib(${k})`);
    const b = go(k - 2, `fib(${k})`);
    const val = a + b;
    events.push({ op: "pop", action: `fib(${k}) resumes: ${a} + ${b} = ${val} → return — pop` });
    return val;
  }
  const result = go(n, "main()");
  return { name: `fib(${n})`, events, result: `fib(${n}) = ${result}` };
}

function overflowProgram(): Program {
  const events: Ev[] = [];
  for (let i = 1; i <= STACK_LIMIT_FRAMES; i++) {
    events.push({
      op: "push",
      name: `loop() #${i}`,
      action: `loop() calls loop() — push frame #${i}, sp moves down another 0x${FRAME_SIZE.toString(16)}`,
    });
  }
  events.push({
    op: "overflow",
    action: "the next frame would cross the stack limit — the runtime kills the program",
  });
  return { name: "loop() forever", events, result: null };
}

const PROGRAMS: Program[] = [factorialProgram(4), fibProgram(4), overflowProgram()];

export default function CallStackDemo() {
  const [programIdx, setProgramIdx] = useState(0);
  const program = PROGRAMS[programIdx];
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  const run = useMemo(() => {
    const frames: { name: string; addr: number }[] = [];
    let action = "main() is running — its frame sits at the top of the stack region";
    let maxDepth = 0;
    let overflowed = false;
    for (let i = 0; i < pos && i < program.events.length; i++) {
      const ev = program.events[i];
      action = ev.action;
      if (ev.op === "push") {
        frames.push({ name: ev.name!, addr: BASE_ADDR - FRAME_SIZE * (frames.length + 1) });
        maxDepth = Math.max(maxDepth, frames.length);
      } else if (ev.op === "pop") {
        frames.pop();
      } else {
        overflowed = true;
      }
    }
    return { frames, action, maxDepth, overflowed };
  }, [program, pos]);

  const done = pos >= program.events.length;
  const hex = (a: number) => `0x${a.toString(16).toUpperCase()}`;

  function selectProgram(i: number) {
    setProgramIdx(i);
    setPos(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (pos >= program.events.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setPos((p) => p + 1), 550);
    return () => clearTimeout(t);
  }, [running, pos, program]);

  return (
    <DemoCard
      title="The call stack, frame by frame"
      controls={
        <>
          <Control label="Program">
            <select className={selectClass} value={programIdx} onChange={(e) => selectProgram(Number(e.target.value))}>
              {PROGRAMS.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </Control>
          <button className={buttonClass} onClick={() => setPos((p) => Math.min(p + 1, program.events.length))} disabled={done}>
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
          Each frame occupies 0x{FRAME_SIZE.toString(16)} bytes; the stack grows toward lower
          addresses. Deepest so far: {run.maxDepth} frame(s) below main().
        </span>
      }
    >
      <div className="not-prose mx-auto grid max-w-lg gap-4 sm:grid-cols-[200px_1fr]">
        {/* the memory column */}
        <div className="rounded-md border border-hairline bg-card p-3">
          <p className="mb-2 text-center text-xs text-ink-3">stack region (RAM)</p>
          <div className="flex flex-col items-stretch gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-14 text-right font-mono text-[9px] text-ink-3">{hex(BASE_ADDR)}</span>
              <span className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-hairline font-mono text-xs text-ink-2">
                main()
              </span>
            </div>
            {run.frames.map((f, i) => {
              const isTop = i === run.frames.length - 1;
              return (
                <div key={`${f.name}-${i}`} className="flex items-center gap-1.5">
                  <span className="w-14 text-right font-mono text-[9px] text-ink-3">{hex(f.addr)}</span>
                  <span
                    className={`inline-flex h-8 flex-1 items-center justify-center rounded-md border font-mono text-xs ${
                      isTop ? "border-accent font-bold text-foreground" : "border-hairline text-ink-2"
                    }`}
                  >
                    {f.name}
                  </span>
                  {isTop && <span className="font-mono text-[9px] text-ink-3">← sp</span>}
                </div>
              );
            })}
            {/* free space + the limit */}
            <div className="ml-[62px] rounded-md border border-dashed border-hairline py-1 text-center text-[10px] text-ink-3">
              free
            </div>
            <div className="ml-[62px] border-t-2 border-dashed pt-0.5 text-center text-[10px]" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
              stack limit
            </div>
          </div>
        </div>

        {/* the narration */}
        <div className="flex flex-col justify-center gap-2 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wide text-ink-3">last action</span>
            <p className="font-mono text-[13px]">{run.action}</p>
          </div>
          {run.overflowed && (
            <p className="text-base font-bold" style={{ color: "var(--status-critical)" }}>
              ✗ STACK OVERFLOW
              <span className="ml-2 text-xs font-normal text-ink-2">(sp crossed the limit — program terminated)</span>
            </p>
          )}
          {done && !run.overflowed && program.result && (
            <p className="text-base font-semibold" style={{ color: GOOD, fontVariantNumeric: "tabular-nums" }}>
              ✓ {program.result}
              <span className="ml-2 text-xs font-normal text-ink-2">(back in main(), stack clean)</span>
            </p>
          )}
          {!done && (
            <p className="text-xs text-ink-3" style={{ fontVariantNumeric: "tabular-nums" }}>
              {program.events.length - pos} step(s) to go · current depth {run.frames.length}
            </p>
          )}
        </div>
      </div>
    </DemoCard>
  );
}
