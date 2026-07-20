"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

/* Four sorts race on the same array. Each algorithm's run is precomputed as a
   trace of operations (compare / swap / write); the race replays all four
   traces in lockstep, one budget of ops per frame, so the visual finishing
   order is exactly the operation-count order. */

const N = 32;

type Op = { t: "c" | "s" | "w"; i: number; j: number; v?: number };

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DATASETS = [
  { value: "random", label: "shuffled" },
  { value: "nearly", label: "nearly sorted" },
  { value: "reversed", label: "reversed" },
] as const;

function makeData(kind: string): number[] {
  const a = Array.from({ length: N }, (_, i) => i + 1);
  if (kind === "reversed") return a.reverse();
  if (kind === "random") {
    const rand = mulberry32(7);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const rand = mulberry32(21);
  for (let k = 0; k < 4; k++) {
    const i = Math.floor(rand() * (N - 3));
    [a[i], a[i + 2]] = [a[i + 2], a[i]];
  }
  return a;
}

function traceBubble(start: number[]): Op[] {
  const a = start.slice();
  const ops: Op[] = [];
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      ops.push({ t: "c", i, j: i + 1 });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        ops.push({ t: "s", i, j: i + 1 });
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return ops;
}

function traceInsertion(start: number[]): Op[] {
  const a = start.slice();
  const ops: Op[] = [];
  for (let k = 1; k < a.length; k++) {
    const x = a[k];
    let i = k - 1;
    while (i >= 0) {
      ops.push({ t: "c", i, j: i + 1 });
      if (a[i] > x) {
        a[i + 1] = a[i];
        ops.push({ t: "w", i: i + 1, j: i, v: a[i] });
        i--;
      } else break;
    }
    if (i + 1 !== k) {
      a[i + 1] = x;
      ops.push({ t: "w", i: i + 1, j: k, v: x });
    }
  }
  return ops;
}

function traceMerge(start: number[]): Op[] {
  const a = start.slice();
  const ops: Op[] = [];
  function ms(lo: number, hi: number) {
    if (hi - lo < 2) return;
    const mid = (lo + hi) >> 1;
    ms(lo, mid);
    ms(mid, hi);
    const merged: number[] = [];
    let i = lo;
    let j = mid;
    while (i < mid && j < hi) {
      ops.push({ t: "c", i, j });
      merged.push(a[i] <= a[j] ? a[i++] : a[j++]);
    }
    while (i < mid) merged.push(a[i++]);
    while (j < hi) merged.push(a[j++]);
    for (let k = 0; k < merged.length; k++) {
      a[lo + k] = merged[k];
      ops.push({ t: "w", i: lo + k, j: lo + k, v: merged[k] });
    }
  }
  ms(0, a.length);
  return ops;
}

function traceQuick(start: number[]): Op[] {
  const a = start.slice();
  const ops: Op[] = [];
  function qs(lo: number, hi: number) {
    if (lo >= hi) return;
    const p = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      ops.push({ t: "c", i: j, j: hi });
      if (a[j] < p) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          ops.push({ t: "s", i, j });
        }
        i++;
      }
    }
    if (i !== hi) {
      [a[i], a[hi]] = [a[hi], a[i]];
      ops.push({ t: "s", i, j: hi });
    }
    qs(lo, i - 1);
    qs(i + 1, hi);
  }
  qs(0, a.length - 1);
  return ops;
}

const ALGOS = [
  { key: "bubble", name: "Bubble sort", tag: "O(n²)", trace: traceBubble },
  { key: "insertion", name: "Insertion sort", tag: "O(n²), adaptive", trace: traceInsertion },
  { key: "merge", name: "Merge sort", tag: "O(n log n)", trace: traceMerge },
  { key: "quick", name: "Quicksort", tag: "O(n log n) avg", trace: traceQuick },
];

/** Replay the first `pos` ops onto a copy of the start array. */
function replay(start: number[], ops: Op[], pos: number): { arr: number[]; last: Op | null } {
  const arr = start.slice();
  for (let k = 0; k < pos; k++) {
    const op = ops[k];
    if (op.t === "s") [arr[op.i], arr[op.j]] = [arr[op.j], arr[op.i]];
    else if (op.t === "w") arr[op.i] = op.v as number;
  }
  return { arr, last: pos > 0 ? ops[pos - 1] : null };
}

const PANEL_W = 240;
const PANEL_H = 96;
const BAR_W = PANEL_W / N;

export default function SortingRaceDemo() {
  const [dataset, setDataset] = useState<string>("random");
  const [speed, setSpeed] = useState(4);
  const [pos, setPos] = useState<number[]>(ALGOS.map(() => 0));
  const [running, setRunning] = useState(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const race = useMemo(() => {
    const start = makeData(dataset);
    return { start, traces: ALGOS.map((a) => a.trace(start)) };
  }, [dataset]);
  const totals = race.traces.map((t) => t.length);

  function reset(kind: string) {
    setDataset(kind);
    setPos(ALGOS.map(() => 0));
    setRunning(false);
  }

  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const next = posRef.current.map((p, idx) =>
        Math.min(totals[idx], p + speedRef.current),
      );
      posRef.current = next;
      setPos(next);
      if (next.some((p, idx) => p < totals[idx])) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const allDone = pos.every((p, idx) => p >= totals[idx]);
  const ranked = ALGOS.map((a, idx) => ({ name: a.name, ops: totals[idx] })).sort(
    (x, y) => x.ops - y.ops,
  );

  return (
    <DemoCard
      title="Four sorts race on the same array"
      controls={
        <>
          <Control label="Starting order">
            <select
              className={selectClass}
              value={dataset}
              aria-label="starting order"
              onChange={(e) => reset(e.target.value)}
            >
              {DATASETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label={`Speed = ${speed} ops/frame`}>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={speed}
              aria-label="race speed"
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
            />
          </Control>
          <button
            className={buttonClass}
            onClick={() => setRunning(true)}
            disabled={running || allDone}
          >
            Race
          </button>
          <button
            className={buttonClass}
            onClick={() =>
              setPos((prev) => prev.map((p, idx) => Math.min(totals[idx], p + 1)))
            }
            disabled={running || allDone}
          >
            Step
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => reset(dataset)}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span>
          The cost being raced is <em>operations</em> — comparisons plus element
          moves — not wall-clock time, and every panel replays its algorithm on
          the identical starting array. Quicksort here picks the last element
          as pivot on purpose: try the reversed order and watch that choice
          backfire.
        </span>
      }
    >
      <div
        className="mb-3 h-4 text-xs text-ink-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label="race result"
      >
        {allDone ? (
          <span>
            fastest here: <strong>{ranked[0].name}</strong> ({ranked[0].ops} ops) ·
            slowest: {ranked[3].name} ({ranked[3].ops} ops)
          </span>
        ) : (
          <span className="text-ink-3">
            red bars are the elements each algorithm is touching right now
          </span>
        )}
      </div>
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {ALGOS.map((algo, idx) => {
          const { arr, last } = replay(race.start, race.traces[idx], pos[idx]);
          const done = pos[idx] >= totals[idx];
          return (
            <div key={algo.key}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">{algo.name}</span>
                <span className="font-mono text-[10px] text-ink-3">{algo.tag}</span>
              </div>
              <svg
                viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
                className="w-full rounded-md"
                style={{ background: "var(--viz-surface)" }}
                role="img"
                aria-label={`${algo.name} sorting the array as bars`}
              >
                {arr.map((v, i) => {
                  const h = (v / N) * (PANEL_H - 10);
                  const active = !done && last !== null && (last.i === i || last.j === i);
                  return (
                    <rect
                      key={i}
                      x={i * BAR_W + 0.5}
                      y={PANEL_H - h}
                      width={BAR_W - 1}
                      height={h}
                      fill={
                        done
                          ? "var(--series-aqua)"
                          : active
                            ? "var(--series-red)"
                            : "var(--series-blue)"
                      }
                    />
                  );
                })}
              </svg>
              <div
                className="mt-1 text-xs text-ink-2"
                style={{ fontVariantNumeric: "tabular-nums" }}
                aria-label={`${algo.name} progress`}
              >
                {done ? `✓ sorted · ${totals[idx]} ops` : `${pos[idx]} / ${totals[idx]} ops`}
              </div>
            </div>
          );
        })}
      </div>
    </DemoCard>
  );
}
