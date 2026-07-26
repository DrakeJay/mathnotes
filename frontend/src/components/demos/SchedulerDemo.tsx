"use client";

import { useEffect, useMemo, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

/* A tick-by-tick scheduler. Three processes share one CPU under three
   policies; every change of process costs `cost` ticks of pure overhead —
   the context switch. The point of the demo is the trade: a small quantum
   answers the interactive jobs fast but pays the switch tax over and over. */

type Proc = {
  id: string;
  name: string;
  color: string;
  arrival: number;
  burst: number;
};

const PROCS: Proc[] = [
  { id: "P1", name: "compile", color: "var(--series-blue)", arrival: 0, burst: 12 },
  { id: "P2", name: "browser", color: "var(--series-aqua)", arrival: 2, burst: 5 },
  { id: "P3", name: "editor", color: "var(--series-violet)", arrival: 4, burst: 3 },
];

const USEFUL = PROCS.reduce((a, p) => a + p.burst, 0);

type Policy = "fifo" | "rr" | "sjf";

type Seg = { kind: "run" | "switch" | "idle"; pid?: string; start: number; end: number };

type Stats = {
  segs: Seg[];
  total: number;
  overhead: number;
  switches: number;
  efficiency: number; // fraction of wall time doing useful work
  avgResponse: number;
  avgTurnaround: number;
  per: { id: string; finish: number; response: number; turnaround: number; wait: number }[];
};

function simulate(policy: Policy, quantum: number, cost: number): Stats {
  const order = [...PROCS].sort((a, b) => a.arrival - b.arrival);
  const remaining = new Map(PROCS.map((p) => [p.id, p.burst]));
  const first = new Map<string, number>();
  const finish = new Map<string, number>();
  const segs: Seg[] = [];
  const ready: string[] = [];
  let admitted = 0;
  let prev: string | null = null;
  let t = 0;

  const admit = (now: number) => {
    while (admitted < order.length && order[admitted].arrival <= now) {
      ready.push(order[admitted].id);
      admitted += 1;
    }
  };
  const push = (kind: Seg["kind"], start: number, end: number, pid?: string) => {
    if (end <= start) return;
    const last = segs[segs.length - 1];
    if (last && last.kind === kind && last.pid === pid && last.end === start) {
      last.end = end; // merge a re-selected process into one continuous block
      return;
    }
    segs.push({ kind, pid, start, end });
  };

  let guard = 0;
  while ([...remaining.values()].some((r) => r > 0) && guard++ < 500) {
    admit(t);
    if (ready.length === 0) {
      const next = order[admitted].arrival;
      push("idle", t, next);
      t = next;
      continue;
    }

    // Pick the next process: FIFO and round robin take the head of the queue,
    // shortest-job-first scans it for the smallest remaining burst.
    let idx = 0;
    if (policy === "sjf") {
      ready.forEach((id, i) => {
        if (remaining.get(id)! < remaining.get(ready[idx])!) idx = i;
      });
    }
    const pid = ready.splice(idx, 1)[0];

    // The switch tax: only charged when the CPU actually changes hands.
    if (prev !== null && prev !== pid) {
      push("switch", t, t + cost);
      t += cost;
      admit(t);
    }

    const left = remaining.get(pid)!;
    const slice = policy === "rr" ? Math.min(quantum, left) : left;
    if (!first.has(pid)) first.set(pid, t);
    push("run", t, t + slice, pid);
    t += slice;
    remaining.set(pid, left - slice);
    admit(t); // arrivals during the slice queue up ahead of the preempted job
    if (left - slice > 0) ready.push(pid);
    else finish.set(pid, t);
    prev = pid;
  }

  const per = PROCS.map((p) => ({
    id: p.id,
    finish: finish.get(p.id) ?? t,
    response: (first.get(p.id) ?? 0) - p.arrival,
    turnaround: (finish.get(p.id) ?? 0) - p.arrival,
    wait: (finish.get(p.id) ?? 0) - p.arrival - p.burst,
  }));
  const overhead = segs.filter((s) => s.kind === "switch").reduce((a, s) => a + (s.end - s.start), 0);
  return {
    segs,
    total: t,
    overhead,
    switches: segs.filter((s) => s.kind === "switch").length,
    efficiency: USEFUL / t,
    avgResponse: per.reduce((a, x) => a + x.response, 0) / per.length,
    avgTurnaround: per.reduce((a, x) => a + x.turnaround, 0) / per.length,
    per,
  };
}

const POLICY_LABELS: Record<Policy, string> = {
  fifo: "First come, first served",
  rr: "Round robin",
  sjf: "Shortest job first",
};

const fmt = (x: number) => x.toFixed(1);

export default function SchedulerDemo() {
  const [policy, setPolicy] = useState<Policy>("rr");
  const [quantum, setQuantum] = useState(2);
  const [cost, setCost] = useState(1);
  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);

  const sim = useMemo(() => simulate(policy, quantum, cost), [policy, quantum, cost]);
  const all = useMemo(
    () =>
      (["fifo", "rr", "sjf"] as Policy[]).map((p) => ({
        policy: p,
        stats: simulate(p, quantum, cost),
      })),
    [quantum, cost],
  );

  // Changing any parameter reschedules from scratch, so rewind the playhead.
  const restart = () => {
    setPlaying(false);
    setNow(0);
  };

  useEffect(() => {
    if (!playing) return;
    const total = sim.total;
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      setNow((cur) => {
        const next = cur + dt * 6; // 6 ticks per second
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, sim.total]);

  const W = 720;
  const PAD_L = 62;
  const PAD_R = 12;
  const innerW = W - PAD_L - PAD_R;
  const maxTotal = Math.max(...all.map((a) => a.stats.total));
  const x = (t: number) => PAD_L + (t / maxTotal) * innerW;
  const ROW_H = 26;
  const TOP = 20;
  const H = TOP + PROCS.length * ROW_H + 42;

  const current = sim.segs.find((s) => now >= s.start && now < s.end);
  const currentProc = current?.pid ? PROCS.find((p) => p.id === current.pid) : undefined;
  const label =
    now <= 0
      ? "Press Play to run the schedule."
      : current?.kind === "switch"
        ? `t = ${Math.floor(now)} — context switch: the CPU is doing no useful work.`
        : current?.kind === "idle"
          ? `t = ${Math.floor(now)} — CPU idle, nothing has arrived yet.`
          : currentProc
            ? `t = ${Math.floor(now)} — running ${currentProc.name} (${currentProc.id}).`
            : `Done at t = ${sim.total}.`;

  return (
    <DemoCard
      title="One CPU, three processes, and the cost of switching between them"
      controls={
        <>
          <Control label="scheduling policy">
            <select
              className={selectClass}
              value={policy}
              aria-label="scheduling policy"
              onChange={(e) => {
                setPolicy(e.target.value as Policy);
                restart();
              }}
            >
              <option value="fifo">First come, first served</option>
              <option value="rr">Round robin</option>
              <option value="sjf">Shortest job first</option>
            </select>
          </Control>
          <Control label={`time slice = ${quantum} tick${quantum === 1 ? "" : "s"}`}>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={quantum}
              aria-label="time slice"
              disabled={policy !== "rr"}
              onChange={(e) => {
                setQuantum(Number(e.target.value));
                restart();
              }}
              className="w-28 accent-(--series-blue) disabled:opacity-40"
            />
          </Control>
          <Control label={`switch cost = ${cost} tick${cost === 1 ? "" : "s"}`}>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={cost}
              aria-label="switch cost"
              onChange={(e) => {
                setCost(Number(e.target.value));
                restart();
              }}
              className="w-28 accent-(--series-red)"
            />
          </Control>
          <button
            className={buttonClass}
            onClick={() => {
              if (now >= sim.total) setNow(0);
              setPlaying(true);
            }}
            disabled={playing}
          >
            Play
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => {
              setPlaying(false);
              setNow(0);
            }}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span>
          Three processes want the CPU: a 12-tick <strong>compile</strong>, a 5-tick{" "}
          <strong>browser</strong> render, a 3-tick <strong>editor</strong> keystroke.
          Only one can run at a time, so the kernel interleaves them — and every
          change of hands costs <strong>{cost}</strong> tick{cost === 1 ? "" : "s"} of
          pure overhead (the red blocks), spent saving one process&apos;s registers and
          loading another&apos;s.
        </span>
      }
    >
      <p className="mb-3 min-h-[1.5rem] text-sm text-ink-2" aria-label="narration">
        {label}
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="schedule timeline">
        {/* tick grid */}
        {Array.from({ length: maxTotal + 1 }, (_, t) => t).map((t) =>
          t % 5 === 0 ? (
            <g key={t}>
              <line
                x1={x(t)}
                y1={TOP - 6}
                x2={x(t)}
                y2={TOP + PROCS.length * ROW_H}
                stroke="var(--viz-grid)"
                strokeWidth="1"
              />
              <text
                x={x(t)}
                y={TOP + PROCS.length * ROW_H + 14}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ink-muted)"
              >
                {t}
              </text>
            </g>
          ) : null,
        )}

        {PROCS.map((p, i) => {
          const y = TOP + i * ROW_H;
          const revealed = now > 0;
          return (
            <g key={p.id}>
              <text x={PAD_L - 8} y={y + 15} textAnchor="end" fontSize="11" fill="var(--ink-2)">
                {p.name}
              </text>
              {/* lifetime bar: from arrival to finish, the process exists but mostly waits */}
              <rect
                x={x(p.arrival)}
                y={y + 8}
                width={Math.max(0, x(sim.per[i].finish) - x(p.arrival))}
                height="4"
                fill="var(--viz-grid)"
              />
              {sim.segs
                .filter((s) => s.pid === p.id)
                .map((s, k) => (
                  <rect
                    key={k}
                    x={x(s.start)}
                    y={y + 2}
                    width={Math.max(1, x(s.end) - x(s.start))}
                    height="16"
                    rx="2"
                    fill={p.color}
                    opacity={!revealed || now >= s.end ? 1 : now > s.start ? 0.85 : 0.22}
                  />
                ))}
              {/* arrival marker */}
              <path
                d={`M ${x(p.arrival)} ${y + 1} l -4 -6 l 8 0 z`}
                fill="var(--ink-muted)"
              />
            </g>
          );
        })}

        {/* switch overhead, drawn across all rows */}
        {sim.segs
          .filter((s) => s.kind === "switch")
          .map((s, k) => (
            <rect
              key={k}
              x={x(s.start)}
              y={TOP}
              width={Math.max(1.5, x(s.end) - x(s.start))}
              height={PROCS.length * ROW_H - 6}
              fill="var(--series-red)"
              opacity={now === 0 || now >= s.start ? 0.55 : 0.18}
            />
          ))}

        {/* playhead */}
        {now > 0 && (
          <line
            x1={x(Math.min(now, sim.total))}
            y1={TOP - 8}
            x2={x(Math.min(now, sim.total))}
            y2={TOP + PROCS.length * ROW_H}
            stroke="var(--foreground)"
            strokeWidth="1.5"
          />
        )}

        <text x={PAD_L} y={H - 6} fontSize="10" fill="var(--ink-muted)">
          ▲ arrival · colored = running · red = context switch · gray = waiting
        </text>
      </svg>

      {/* headline metrics for the selected policy */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "cpu efficiency", v: `${(sim.efficiency * 100).toFixed(1)}%`, s: `${sim.overhead} of ${sim.total} ticks lost` },
          { k: "context switches", v: String(sim.switches), s: `${cost} tick${cost === 1 ? "" : "s"} each` },
          { k: "avg response", v: fmt(sim.avgResponse), s: "ticks until first run" },
          { k: "avg turnaround", v: fmt(sim.avgTurnaround), s: "arrival to finish" },
        ].map((m) => (
          <div key={m.k} className="rounded-md border border-hairline p-2">
            <div className="text-[11px] text-ink-3">{m.k}</div>
            <div
              className="text-lg font-semibold"
              style={{ fontVariantNumeric: "tabular-nums" }}
              aria-label={m.k}
            >
              {m.v}
            </div>
            <div className="text-[10px] text-ink-3">{m.s}</div>
          </div>
        ))}
      </div>

      {/* all three policies at the current settings */}
      <table className="mt-4 w-full text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
        <thead className="text-ink-3">
          <tr>
            <th className="py-1 text-left font-medium">policy</th>
            <th className="py-1 text-right font-medium">switches</th>
            <th className="py-1 text-right font-medium">overhead</th>
            <th className="py-1 text-right font-medium">efficiency</th>
            <th className="py-1 text-right font-medium">avg response</th>
            <th className="py-1 text-right font-medium">avg turnaround</th>
          </tr>
        </thead>
        <tbody>
          {all.map(({ policy: p, stats }) => (
            <tr
              key={p}
              aria-label={`row ${p}`}
              className="border-t border-hairline"
              style={{
                background:
                  p === policy ? "color-mix(in srgb, var(--series-blue) 10%, transparent)" : undefined,
              }}
            >
              <td className="py-1">{POLICY_LABELS[p]}</td>
              <td className="py-1 text-right">{stats.switches}</td>
              <td className="py-1 text-right">{stats.overhead}</td>
              <td className="py-1 text-right">{(stats.efficiency * 100).toFixed(1)}%</td>
              <td className="py-1 text-right">{fmt(stats.avgResponse)}</td>
              <td className="py-1 text-right">{fmt(stats.avgTurnaround)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DemoCard>
  );
}
