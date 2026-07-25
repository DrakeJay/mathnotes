"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

/* A direct-mapped cache watching a stream of memory accesses. 64-word memory,
   8 cache lines, 4 words per line (block). Each address maps to exactly one
   line, so a hit depends entirely on locality — which is the whole point. */

const LINES = 8;
const BLOCK = 4; // words per line
const MEMWORDS = 64;
const L1_CYCLES = 4;
const RAM_CYCLES = 200;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PATTERNS = [
  { value: "sequential", label: "sequential scan" },
  { value: "looping", label: "loop over a small array" },
  { value: "random", label: "random access" },
] as const;

function makeSeq(pattern: string): number[] {
  if (pattern === "sequential") return Array.from({ length: 64 }, (_, i) => i);
  if (pattern === "looping") {
    const out: number[] = [];
    for (let pass = 0; pass < 4; pass++) for (let i = 0; i < 16; i++) out.push(i);
    return out;
  }
  const rand = mulberry32(5);
  return Array.from({ length: 64 }, () => Math.floor(rand() * MEMWORDS));
}

type CacheState = {
  lines: (number | null)[]; // block number stored in each line
  idx: number;
  hits: number;
  misses: number;
  last: { addr: number; block: number; line: number; tag: number; hit: boolean } | null;
};

function initCache(): CacheState {
  return { lines: new Array(LINES).fill(null), idx: 0, hits: 0, misses: 0, last: null };
}

function stepCache(s: CacheState, seq: number[]): CacheState {
  if (s.idx >= seq.length) return s;
  const addr = seq[s.idx];
  const block = addr >> 2; // addr / BLOCK
  const line = block % LINES;
  const tag = Math.floor(block / LINES);
  const hit = s.lines[line] === block;
  const lines = s.lines.slice();
  if (!hit) lines[line] = block;
  return {
    lines,
    idx: s.idx + 1,
    hits: s.hits + (hit ? 1 : 0),
    misses: s.misses + (hit ? 0 : 1),
    last: { addr, block, line, tag, hit },
  };
}

export default function CacheDemo() {
  const [pattern, setPattern] = useState("sequential");
  const seq = useMemo(() => makeSeq(pattern), [pattern]);
  const [c, setC] = useState<CacheState>(initCache);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(8);

  const cRef = useRef(c);
  cRef.current = c;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const seqRef = useRef(seq);
  seqRef.current = seq;

  function reset(p: string) {
    setPattern(p);
    setC(initCache());
    setRunning(false);
  }

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
        if (cRef.current.idx >= seqRef.current.length) {
          setRunning(false);
          return;
        }
        const next = stepCache(cRef.current, seqRef.current);
        cRef.current = next;
        setC(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const done = c.idx >= seq.length;
  const total = c.hits + c.misses;
  const rate = total > 0 ? c.hits / total : 0;
  const effLatency = total > 0 ? (c.hits * L1_CYCLES + c.misses * RAM_CYCLES) / total : 0;
  const speedup = effLatency > 0 ? RAM_CYCLES / effLatency : 1;

  // windowed view of the access stream
  const windowStart = Math.max(0, c.idx - 12);
  const streamWindow = seq.slice(windowStart, windowStart + 16);

  return (
    <DemoCard
      title="Why cache exists: locality, live"
      controls={
        <>
          <Control label="Access pattern">
            <select
              className={selectClass}
              value={pattern}
              aria-label="access pattern"
              onChange={(e) => reset(e.target.value)}
            >
              {PATTERNS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label={`Speed = ${speed}/s`}>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={speed}
              aria-label="stream speed"
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-(--series-blue)"
            />
          </Control>
          <button className={buttonClass} onClick={() => setRunning(true)} disabled={running || done}>
            Run
          </button>
          <button
            className={buttonClass}
            onClick={() => setC((cur) => stepCache(cur, seq))}
            disabled={running || done}
          >
            Step
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => reset(pattern)}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span>
          Each address maps to <em>one</em> cache line (block = address ÷ 4, line =
          block mod 8). A hit costs {L1_CYCLES} cycles; a miss must fetch from RAM at
          ~{RAM_CYCLES}. Nothing here is smart — the cache only wins when your
          accesses have locality, which is why how you loop over data can matter more
          than the code inside the loop.
        </span>
      }
    >
      {/* current access decode */}
      <div
        className="mb-3 min-h-[1.5rem] text-sm"
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label="current access"
      >
        {c.last ? (
          <span>
            address <strong>{c.last.addr}</strong> → block {c.last.block} → line{" "}
            {c.last.line} ·{" "}
            <span
              className="font-semibold"
              style={{ color: c.last.hit ? "var(--series-aqua)" : "var(--series-red)" }}
            >
              {c.last.hit ? "HIT" : "MISS"}
            </span>
          </span>
        ) : (
          <span className="text-ink-3">press Step or Run to stream memory accesses</span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* cache lines */}
        <div>
          <div className="mb-1 text-xs text-ink-3">Cache — 8 lines, 4 words each</div>
          <div className="overflow-hidden rounded-md border border-hairline" style={{ fontVariantNumeric: "tabular-nums" }}>
            {Array.from({ length: LINES }, (_, line) => {
              const block = c.lines[line];
              const isCurrent = c.last?.line === line;
              const bg = isCurrent
                ? c.last!.hit
                  ? "color-mix(in srgb, var(--series-aqua) 20%, transparent)"
                  : "color-mix(in srgb, var(--series-red) 18%, transparent)"
                : "transparent";
              return (
                <div
                  key={line}
                  className="flex items-center gap-2 px-2 py-1 font-mono text-[11px]"
                  style={{ background: bg, borderTop: line > 0 ? "1px solid var(--viz-grid)" : "none" }}
                >
                  <span className="w-10 text-ink-3">line {line}</span>
                  {block === null ? (
                    <span className="text-ink-3">empty</span>
                  ) : (
                    <span className="font-semibold">
                      block {block}
                      <span className="ml-1.5 font-normal text-ink-3">
                        (words {block * BLOCK}–{block * BLOCK + BLOCK - 1})
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* access stream window */}
          <div className="mt-2 text-xs text-ink-3">Access stream</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {streamWindow.map((addr, i) => {
              const globalIdx = windowStart + i;
              const isCurrent = globalIdx === c.idx - 1;
              const processed = globalIdx < c.idx;
              return (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    background: isCurrent ? "var(--series-blue)" : "var(--viz-surface)",
                    color: isCurrent ? "#fff" : processed ? "var(--ink-3)" : "var(--ink-2)",
                    border: "1px solid var(--viz-axis)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {addr}
                </span>
              );
            })}
          </div>
        </div>

        {/* stats */}
        <div>
          <div className="mb-1 text-xs text-ink-3">Running statistics</div>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <Stat label="accesses" value={`${c.idx} / ${seq.length}`} ariaLabel="accesses" />
            <Stat label="hit rate" value={`${(rate * 100).toFixed(1)}%`} accent="var(--series-aqua)" ariaLabel="hit rate" />
            <Stat label="hits" value={String(c.hits)} />
            <Stat label="misses" value={String(c.misses)} accent="var(--series-red)" />
          </div>
          <div className="mt-3 rounded-md border border-hairline p-3 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="text-xs text-ink-3">Average time per access</div>
            <div className="mt-1 text-2xl font-semibold" aria-label="effective latency">
              {effLatency.toFixed(1)} <span className="text-sm font-normal text-ink-2">cycles</span>
            </div>
            <div className="mt-1 text-xs text-ink-2">
              {total > 0 ? (
                <>
                  {speedup.toFixed(1)}× faster than always going to RAM ({RAM_CYCLES} cycles)
                </>
              ) : (
                "— run the stream to measure"
              )}
            </div>
            {/* hit vs miss bar */}
            <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-hairline">
              <div style={{ width: `${rate * 100}%`, background: "var(--series-aqua)" }} />
              <div style={{ width: `${(1 - rate) * 100}%`, background: "var(--series-red)" }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-ink-3">
              <span>hits (fast)</span>
              <span>misses (slow)</span>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function Stat({
  label,
  value,
  accent,
  ariaLabel,
}: {
  label: string;
  value: string;
  accent?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="rounded-md border border-hairline px-3 py-2" aria-label={ariaLabel}>
      <div className="text-xs text-ink-3">{label}</div>
      <div className="text-lg font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
