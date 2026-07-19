"use client";

import { useEffect, useRef, useState } from "react";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";

const W = 420;
const LIM = 2.4;
const E0 = -0.5; // specific orbital energy of the circular start
const TRAIL_MAX = 900;
const SIM_SPEED = 2.5; // time units per real second

type Vec = { x: number; y: number };

export default function OrbitDemo() {
  const [integrator, setIntegrator] = useState<"euler" | "symplectic">("euler");
  const [dt, setDt] = useState(0.06);
  const [playing, setPlaying] = useState(true);
  const [, setTick] = useState(0);

  const pos = useRef<Vec>({ x: 1, y: 0 });
  const vel = useRef<Vec>({ x: 0, y: 1 });
  const trail = useRef<Vec[]>([{ x: 1, y: 0 }]);
  const raf = useRef(0);

  function reset() {
    pos.current = { x: 1, y: 0 };
    vel.current = { x: 0, y: 1 };
    trail.current = [{ x: 1, y: 0 }];
    setTick((t) => t + 1);
  }

  useEffect(reset, [integrator, dt]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (now: number) => {
      const steps = Math.min(300, Math.round(((now - last) / 1000) * (SIM_SPEED / dt)));
      last = now;
      for (let i = 0; i < steps; i++) {
        const p = pos.current;
        const v = vel.current;
        const r3 = Math.pow(Math.hypot(p.x, p.y), 3);
        const ax = -p.x / r3;
        const ay = -p.y / r3;
        if (integrator === "euler") {
          // naive: position steps with the OLD velocity
          const nx = p.x + v.x * dt;
          const ny = p.y + v.y * dt;
          v.x += ax * dt;
          v.y += ay * dt;
          p.x = nx;
          p.y = ny;
        } else {
          // symplectic: velocity first, then move with the NEW velocity
          v.x += ax * dt;
          v.y += ay * dt;
          p.x += v.x * dt;
          p.y += v.y * dt;
        }
        trail.current.push({ x: p.x, y: p.y });
        if (trail.current.length > TRAIL_MAX) trail.current.shift();
      }
      setTick((t) => t + 1);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, integrator, dt]);

  const sx = (x: number) => W / 2 + (x / LIM) * (W / 2 - 14);
  const sy = (y: number) => W / 2 - (y / LIM) * (W / 2 - 14);

  const p = pos.current;
  const v = vel.current;
  const r = Math.hypot(p.x, p.y);
  const energy = 0.5 * (v.x * v.x + v.y * v.y) - 1 / r;
  const drift = ((energy - E0) / Math.abs(E0)) * 100;
  const escaped = r > LIM * 1.6;

  return (
    <DemoCard
      title="One planet, two integrators"
      controls={
        <>
          <Control label="Integrator">
            <select
              className={selectClass}
              value={integrator}
              onChange={(e) => setIntegrator(e.target.value as "euler" | "symplectic")}
            >
              <option value="euler">naive Euler</option>
              <option value="symplectic">symplectic Euler</option>
            </select>
          </Control>
          <Control label={`dt = ${dt.toFixed(2)}`}>
            <input type="range" min={0.01} max={0.12} step={0.01} value={dt} onChange={(e) => setDt(Number(e.target.value))} className="w-32 accent-(--series-blue)" />
          </Control>
          <button className={buttonClass} onClick={() => setPlaying((x) => !x)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={reset}
          >
            Reset
          </button>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          specific energy E = {energy.toFixed(3)} (true −0.500 · drift {drift >= 0 ? "+" : ""}
          {drift.toFixed(1)}%) —{" "}
          {escaped
            ? "the planet has escaped: naive Euler fed it energy every step"
            : integrator === "euler"
              ? "watch the spiral widen as the energy climbs"
              : "the energy breathes around its true value; the orbit stays closed"}
        </span>
      }
    >
      <div className="not-prose mx-auto max-w-md">
        <svg
          viewBox={`0 0 ${W} ${W}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Orbit simulation with ${integrator === "euler" ? "naive" : "symplectic"} Euler at dt ${dt}; energy drift ${drift.toFixed(1)} percent`}
        >
          {/* the true circular orbit, for reference */}
          <circle cx={sx(0)} cy={sy(0)} r={sx(1) - sx(0)} fill="none" stroke="var(--viz-grid)" strokeWidth="1" />
          {/* trail */}
          <path
            d={trail.current
              .map((q, i) => `${i === 0 ? "M" : "L"}${sx(q.x).toFixed(1)},${sy(q.y).toFixed(1)}`)
              .join("")}
            fill="none"
            stroke="var(--series-blue)"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* star + planet */}
          <circle cx={sx(0)} cy={sy(0)} r="9" fill="var(--series-yellow)" stroke="var(--viz-surface)" strokeWidth="2" />
          {!escaped && (
            <circle cx={sx(p.x)} cy={sy(p.y)} r="5.5" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
          )}
        </svg>
      </div>
    </DemoCard>
  );
}
