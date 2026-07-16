"use client";

import { useEffect, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

const GOOD = "#0ca30c";

type Machine = {
  name: string;
  hint: string;
  sample: string;
  clean: (raw: string) => string;
  tokenize: (raw: string) => string[];
  step: (stack: string[], token: string, prev: string | null) => {
    stack: string[];
    action: string;
    error?: string;
  };
  finish: (stack: string[]) => { ok: boolean; verdict: string; note: string };
};

const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

const MACHINES: Machine[] = [
  {
    name: "Balanced brackets",
    hint: "Opening brackets are pushed; a closing bracket must match the most recent opener.",
    sample: "([{}]())",
    clean: (raw) => raw.split("").filter((c) => "()[]{}".includes(c)).slice(0, 14).join(""),
    tokenize: (raw) => raw.split(""),
    step: (stack, t) => {
      if ("([{".includes(t)) return { stack: [...stack, t], action: `push ${t}` };
      if (stack.length === 0)
        return { stack, action: `read ${t}`, error: `nothing on the stack to match ${t}` };
      const top = stack[stack.length - 1];
      if (PAIRS[t] === top)
        return { stack: stack.slice(0, -1), action: `pop ${top} — matched by ${t}` };
      return { stack, action: `read ${t}`, error: `${t} can't close ${top} — wrong nesting order` };
    },
    finish: (stack) =>
      stack.length === 0
        ? { ok: true, verdict: "✓ balanced", note: "stack empty" }
        : { ok: false, verdict: "✗ unbalanced", note: `${stack.length} unclosed bracket(s) left` },
  },
  {
    name: "aⁿbⁿ (needs the stack!)",
    hint: "Push on every a, pop on every b — the language no finite automaton can recognize.",
    sample: "aaabbb",
    clean: (raw) => raw.split("").filter((c) => "ab".includes(c)).slice(0, 12).join(""),
    tokenize: (raw) => raw.split(""),
    step: (stack, t, prev) => {
      if (t === "a") {
        if (prev === "b")
          return { stack, action: "read a", error: "an a after a b — not of the form aⁿbⁿ" };
        return { stack: [...stack, "a"], action: "push a" };
      }
      if (stack.length === 0)
        return { stack, action: "read b", error: "pop on empty stack — more b's than a's" };
      return { stack: stack.slice(0, -1), action: "pop a — matched by b" };
    },
    finish: (stack) =>
      stack.length === 0
        ? { ok: true, verdict: "✓ accepted", note: "every a matched" }
        : { ok: false, verdict: "✗ rejected", note: `${stack.length} unmatched a(s)` },
  },
  {
    name: "Postfix (RPN) calculator",
    hint: "Numbers are pushed; an operator pops two values and pushes the result.",
    sample: "3 4 + 2 *",
    clean: (raw) => raw.split("").filter((c) => "0123456789+-*/ ".includes(c)).slice(0, 24).join(""),
    tokenize: (raw) => raw.trim().split(/\s+/).filter(Boolean),
    step: (stack, t) => {
      if (/^\d+$/.test(t)) return { stack: [...stack, t], action: `push ${t}` };
      if (!"+-*/".includes(t) || t.length !== 1)
        return { stack, action: `read ${t}`, error: `${t} is not a number or operator` };
      if (stack.length < 2)
        return { stack, action: `read ${t}`, error: `${t} needs two operands on the stack` };
      const b = Number(stack[stack.length - 1]);
      const a = Number(stack[stack.length - 2]);
      if (t === "/" && b === 0) return { stack, action: `read ${t}`, error: "division by zero" };
      const r = t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b;
      const rs = String(Math.round(r * 10000) / 10000);
      return { stack: [...stack.slice(0, -2), rs], action: `${a} ${t} ${b} = ${rs} — pop twice, push result` };
    },
    finish: (stack) =>
      stack.length === 1
        ? { ok: true, verdict: `= ${stack[0]}`, note: "one value left: the result" }
        : { ok: false, verdict: "✗ invalid", note: stack.length === 0 ? "empty stack — no result" : `${stack.length} values left — missing operator(s)` },
  },
];

export default function StackMachineDemo() {
  const [machineIdx, setMachineIdx] = useState(0);
  const machine = MACHINES[machineIdx];
  const [input, setInput] = useState(MACHINES[0].sample);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  const tokens = useMemo(() => machine.tokenize(input), [machine, input]);

  // Replay the machine over the consumed prefix (halting at the first error).
  const run = useMemo(() => {
    let stack: string[] = [];
    let action = "start — stack empty";
    for (let i = 0; i < pos && i < tokens.length; i++) {
      const out = machine.step(stack, tokens[i], i > 0 ? tokens[i - 1] : null);
      stack = out.stack;
      action = out.action;
      if (out.error) return { stack, action, error: out.error, haltAt: i };
    }
    return { stack, action, error: null as string | null, haltAt: null as number | null };
  }, [machine, tokens, pos]);

  const maxPos = run.haltAt !== null ? run.haltAt + 1 : tokens.length;
  const done = pos >= maxPos;
  const failed = run.error !== null;
  const verdict = failed
    ? { ok: false, verdict: "✗ rejected", note: run.error! }
    : pos >= tokens.length
      ? machine.finish(run.stack)
      : null;

  function selectMachine(i: number) {
    setMachineIdx(i);
    setInput(MACHINES[i].sample);
    setPos(0);
    setRunning(false);
  }

  function editInput(raw: string) {
    setInput(MACHINES[machineIdx].clean(raw));
    setPos(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (pos >= maxPos) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setPos((p) => p + 1), 550);
    return () => clearTimeout(t);
  }, [running, pos, maxPos]);

  return (
    <DemoCard
      title="Stack machines, step by step"
      controls={
        <>
          <Control label="Machine">
            <select className={selectClass} value={machineIdx} onChange={(e) => selectMachine(Number(e.target.value))}>
              {MACHINES.map((m, i) => (
                <option key={m.name} value={i}>
                  {m.name}
                </option>
              ))}
            </select>
          </Control>
          <Control label="Input">
            <input
              className={`${selectClass} w-44 font-mono`}
              value={input}
              onChange={(e) => editInput(e.target.value)}
              spellCheck={false}
            />
          </Control>
          <button className={buttonClass} onClick={() => setPos((p) => Math.min(p + 1, maxPos))} disabled={done}>
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
      footer={machine.hint}
    >
      <div className="not-prose">
        {/* the tape */}
        <div className="flex flex-wrap items-center justify-center gap-1" aria-label="input tokens">
          {tokens.length === 0 && <span className="text-xs text-ink-3">ε (empty input)</span>}
          {tokens.map((t, i) => (
            <span
              key={i}
              className={`inline-flex h-8 min-w-7 items-center justify-center rounded-md border px-1.5 font-mono text-sm ${
                run.haltAt === i && pos > i
                  ? "border-(--status-critical) font-bold"
                  : i < pos
                    ? "border-hairline text-ink-3"
                    : i === pos
                      ? "border-accent font-bold text-foreground"
                      : "border-hairline text-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-4 grid max-w-md gap-4 sm:grid-cols-[150px_1fr]">
          {/* the stack */}
          <div className="rounded-md border border-hairline bg-card p-3">
            <p className="mb-2 text-center text-xs text-ink-3">the stack</p>
            <div className="flex min-h-[240px] flex-col-reverse items-center justify-start gap-1">
              {run.stack.length === 0 ? (
                <span className="rounded-md border border-dashed border-hairline px-4 py-1.5 font-mono text-sm text-ink-3">
                  ∅
                </span>
              ) : (
                run.stack.map((item, i) => (
                  <span
                    key={i}
                    className={`inline-flex h-8 w-20 items-center justify-center rounded-md border font-mono text-sm ${
                      i === run.stack.length - 1
                        ? "border-accent font-bold text-foreground"
                        : "border-hairline text-ink-2"
                    }`}
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
            <p className="mt-2 text-center text-xs text-ink-3" style={{ fontVariantNumeric: "tabular-nums" }}>
              {run.stack.length === 0 ? "empty" : `top: ${run.stack[run.stack.length - 1]} · depth ${run.stack.length}`}
            </p>
          </div>

          {/* the narration */}
          <div className="flex flex-col justify-center gap-2 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wide text-ink-3">last action</span>
              <p className="font-mono text-[13px]">{run.action}</p>
            </div>
            {failed && pos > run.haltAt! && (
              <p className="text-[13px]" style={{ color: "var(--status-critical)" }}>
                halted: {run.error}
              </p>
            )}
            {verdict && (
              <p
                className="text-base font-semibold"
                style={{ color: verdict.ok ? GOOD : "var(--status-critical)", fontVariantNumeric: "tabular-nums" }}
              >
                {verdict.verdict}
                <span className="ml-2 text-xs font-normal text-ink-2">({verdict.note})</span>
              </p>
            )}
            {!verdict && !failed && (
              <p className="text-xs text-ink-3">
                {tokens.length - pos} token(s) to go — step or run.
              </p>
            )}
          </div>
        </div>
      </div>
    </DemoCard>
  );
}
