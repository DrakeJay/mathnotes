"use client";

import { useEffect, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

const GOOD = "#0ca30c";
const N = 21;
const VALUES = Array.from({ length: N }, (_, i) => 3 * i + 4); // 4, 7, …, 64

function linearTrace(target: number): { probes: number[]; foundAt: number | null } {
  const probes: number[] = [];
  for (let i = 0; i < N; i++) {
    probes.push(i);
    if (VALUES[i] === target) return { probes, foundAt: i };
  }
  return { probes, foundAt: null };
}

function binaryTrace(target: number): {
  probes: { lo: number; hi: number; mid: number }[];
  foundAt: number | null;
} {
  const probes: { lo: number; hi: number; mid: number }[] = [];
  let lo = 0;
  let hi = N - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    probes.push({ lo, hi, mid });
    if (VALUES[mid] === target) return { probes, foundAt: mid };
    if (VALUES[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { probes, foundAt: null };
}

export default function BinarySearchDemo() {
  const [target, setTarget] = useState(58);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  const lin = useMemo(() => linearTrace(target), [target]);
  const bin = useMemo(() => binaryTrace(target), [target]);
  const total = Math.max(lin.probes.length, bin.probes.length);
  const done = pos >= total;

  const linPos = Math.min(pos, lin.probes.length);
  const binPos = Math.min(pos, bin.probes.length);
  const linDone = pos >= lin.probes.length;
  const binDone = pos >= bin.probes.length;

  // binary's surviving interval after binPos probes
  const binState = useMemo(() => {
    let lo = 0;
    let hi = N - 1;
    let found: number | null = null;
    for (let k = 0; k < binPos; k++) {
      const { mid } = bin.probes[k];
      if (VALUES[mid] === target) {
        found = mid;
        break;
      }
      if (VALUES[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return { lo, hi, found };
  }, [bin, binPos, target]);

  const lastLinProbe = linPos > 0 ? lin.probes[linPos - 1] : null;
  const lastBinProbe = binPos > 0 ? bin.probes[binPos - 1].mid : null;

  function reset(t?: number) {
    if (t !== undefined) setTarget(t);
    setPos(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (pos >= total) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setPos((p) => p + 1), 350);
    return () => clearTimeout(timer);
  }, [running, pos, total]);

  const cellBase =
    "inline-flex h-8 w-7 items-center justify-center rounded-md border font-mono text-[11px]";

  const linCell = (i: number) => {
    if (lin.foundAt === i && linPos > lin.foundAt)
      return { cls: "font-bold", style: { borderColor: GOOD, color: GOOD } };
    if (i === lastLinProbe && !linDone) return { cls: "border-accent font-bold text-foreground", style: {} };
    if (i < linPos) return { cls: "border-hairline text-ink-3 opacity-45", style: {} };
    return { cls: "border-hairline text-foreground", style: {} };
  };

  const binCell = (i: number) => {
    if (binState.found === i) return { cls: "font-bold", style: { borderColor: GOOD, color: GOOD } };
    if (i === lastBinProbe && !binDone) return { cls: "border-accent font-bold text-foreground", style: {} };
    if (binPos > 0 && (i < binState.lo || i > binState.hi))
      return { cls: "border-hairline text-ink-3 opacity-45", style: {} };
    return { cls: "border-hairline text-foreground", style: {} };
  };

  const verdict = done
    ? lin.foundAt !== null
      ? `found ${target} at index ${lin.foundAt} — linear: ${lin.probes.length} comparison(s), binary: ${bin.probes.length}`
      : `${target} is not in the array — linear needed ${lin.probes.length} comparisons to give up, binary only ${bin.probes.length}`
    : null;

  return (
    <DemoCard
      title="Linear vs. binary search: a race"
      controls={
        <>
          <Control label={`Target (array holds 4…64)`}>
            <input
              type="number"
              min={0}
              max={99}
              value={target}
              onChange={(e) => reset(Number(e.target.value))}
              className={`${selectClass} w-20`}
            />
          </Control>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => reset(VALUES[Math.floor(Math.random() * N)])}
          >
            Random target
          </button>
          <button className={buttonClass} onClick={() => setPos((p) => Math.min(p + 1, total))} disabled={done}>
            Step
          </button>
          <button className={buttonClass} onClick={() => setRunning((r) => !r)} disabled={done}>
            {running ? "Pause" : "Run"}
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
        verdict ? (
          <span style={{ fontVariantNumeric: "tabular-nums", color: lin.foundAt !== null ? GOOD : undefined }}>
            {verdict}
          </span>
        ) : (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            comparisons so far — linear: {linPos}
            {linDone ? " (done)" : ""} · binary: {binPos}
            {binDone ? " (done)" : ""} · with a million items the score would be ~500,000 vs ≤ 20
          </span>
        )
      }
    >
      <div className="not-prose flex flex-col gap-4">
        <div>
          <p className="mb-1 text-xs text-ink-3">
            linear search — check every cell, left to right
          </p>
          <div className="flex flex-wrap gap-1">
            {VALUES.map((v, i) => {
              const { cls, style } = linCell(i);
              return (
                <span key={i} className={`${cellBase} ${cls}`} style={style}>
                  {v}
                </span>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-ink-3">
            binary search — probe the middle of what survives, discard half
          </p>
          <div className="flex flex-wrap gap-1">
            {VALUES.map((v, i) => {
              const { cls, style } = binCell(i);
              return (
                <span key={i} className={`${cellBase} ${cls}`} style={style}>
                  {v}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </DemoCard>
  );
}
