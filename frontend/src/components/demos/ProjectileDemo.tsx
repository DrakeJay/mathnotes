"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DemoCard, { Control, buttonClass } from "./DemoCard";

const G = 9.8;
const DT = 1 / 240; // physics substep
const W = 560;
const H = 260;
const PAD = { left: 40, right: 16, top: 12, bottom: 28 };
const WORLD_X = 130; // metres
const WORLD_Y = 35;

type Pt = { x: number; y: number; t: number };

function simulate(v0: number, angleDeg: number, k: number): Pt[] {
  const th = (angleDeg * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let vx = v0 * Math.cos(th);
  let vy = v0 * Math.sin(th);
  let t = 0;
  const pts: Pt[] = [{ x, y, t }];
  let i = 0;
  while (y >= 0 && t < 20) {
    const speed = Math.hypot(vx, vy);
    // semi-implicit Euler with quadratic drag
    vx += -k * speed * vx * DT;
    vy += (-G - k * speed * vy) * DT;
    x += vx * DT;
    y += vy * DT;
    t += DT;
    if (++i % 4 === 0) pts.push({ x, y: Math.max(0, y), t });
  }
  pts.push({ x, y: 0, t });
  return pts;
}

export default function ProjectileDemo() {
  const [v0, setV0] = useState(25);
  const [angle, setAngle] = useState(45);
  const [k, setK] = useState(0);
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(true);
  const raf = useRef(0);

  const traj = useMemo(() => simulate(v0, angle, k), [v0, angle, k]);
  const noDrag = useMemo(() => simulate(v0, angle, 0), [v0, angle]);

  useEffect(() => {
    setFrame(0);
    setRunning(true);
  }, [v0, angle, k]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const tick = (now: number) => {
      const advance = Math.max(1, Math.round((now - last) / (1000 / 60)));
      last = now;
      setFrame((f) => {
        const next = f + advance;
        if (next >= traj.length - 1) {
          setRunning(false);
          return traj.length - 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, traj]);

  const sx = (x: number) => PAD.left + (x / WORLD_X) * (W - PAD.left - PAD.right);
  const sy = (y: number) => H - PAD.bottom - (y / WORLD_Y) * (H - PAD.top - PAD.bottom);

  const done = frame >= traj.length - 1;
  const shown = traj.slice(0, frame + 1);
  const ball = shown[shown.length - 1];
  const range = traj[traj.length - 1].x;
  const peak = Math.max(...traj.map((p) => p.y));
  const flight = traj[traj.length - 1].t;
  const analyticRange = (v0 * v0 * Math.sin((2 * angle * Math.PI) / 180)) / G;

  const path = (pts: Pt[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");

  return (
    <DemoCard
      title="Projectile flight, simulated"
      controls={
        <>
          <Control label={`Speed v₀ = ${v0} m/s`}>
            <input type="range" min={10} max={35} step={1} value={v0} onChange={(e) => setV0(Number(e.target.value))} className="w-32 accent-(--series-blue)" />
          </Control>
          <Control label={`Angle θ = ${angle}°`}>
            <input type="range" min={15} max={80} step={1} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-32 accent-(--series-blue)" />
          </Control>
          <Control label={`Drag k = ${k.toFixed(3)}`}>
            <input type="range" min={0} max={0.05} step={0.005} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-32 accent-(--series-blue)" />
          </Control>
          <button
            className={buttonClass}
            onClick={() => {
              setFrame(0);
              setRunning(true);
            }}
          >
            Launch
          </button>
        </>
      }
      footer={
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {done ? "range" : "so far"} {(done ? range : ball.x).toFixed(1)} m · peak {peak.toFixed(1)} m
          · flight {flight.toFixed(2)} s
          {k === 0 ? (
            <>
              {" "}
              · analytic no-drag range v₀²sin2θ/g = <strong>{analyticRange.toFixed(1)} m</strong> —
              the simulation agrees
            </>
          ) : (
            " — drag pulls the flight inside the gray no-drag arc; no formula exists for this curve"
          )}
        </span>
      }
    >
      <div className="not-prose">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-md"
          style={{ background: "var(--viz-surface)" }}
          role="img"
          aria-label={`Projectile trajectory at ${v0} metres per second, ${angle} degrees, drag ${k}; range ${range.toFixed(1)} metres`}
        >
          {/* ground + ticks */}
          <line x1={PAD.left} x2={W - PAD.right} y1={sy(0)} y2={sy(0)} stroke="var(--viz-axis)" strokeWidth="1.5" />
          {[0, 25, 50, 75, 100, 125].map((m) => (
            <g key={m}>
              <line x1={sx(m)} x2={sx(m)} y1={sy(0)} y2={sy(0) + 4} stroke="var(--viz-axis)" strokeWidth="1" />
              <text x={sx(m)} y={sy(0) + 16} textAnchor="middle" fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {m} m
              </text>
            </g>
          ))}
          {[10, 20, 30].map((m) => (
            <text key={m} x={PAD.left - 6} y={sy(m) + 3} textAnchor="end" fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {m}
            </text>
          ))}

          {/* no-drag reference */}
          {k > 0 && <path d={path(noDrag)} fill="none" stroke="var(--ink-muted)" strokeWidth="1.5" opacity="0.5" />}
          {/* simulated flight */}
          <path d={path(shown)} fill="none" stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
          <circle cx={sx(ball.x)} cy={sy(ball.y)} r="5" fill="var(--series-red)" stroke="var(--viz-surface)" strokeWidth="2" />
        </svg>
      </div>
    </DemoCard>
  );
}
