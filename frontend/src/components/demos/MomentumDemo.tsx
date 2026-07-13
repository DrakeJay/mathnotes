"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { MomentumParams, MomentumResult } from "@/lib/types";
import DemoCard, { Control, selectClass } from "./DemoCard";
import HeatmapPlot from "../viz/HeatmapPlot";
import LineChart from "../viz/LineChart";
import { formatNum, sequential, useVizMode } from "../viz/color";

type SurfaceName = MomentumParams["surface"];

const SURFACE_CONFIG: Record<
  SurfaceName,
  { label: string; lr: number; lrMin: number; lrMax: number; lrStep: number; steps: number }
> = {
  rosenbrock: {
    label: "Rosenbrock valley",
    lr: 0.001,
    lrMin: 0.0002,
    lrMax: 0.003,
    lrStep: 0.0002,
    steps: 300,
  },
  bowl: { label: "Elongated bowl", lr: 0.05, lrMin: 0.01, lrMax: 0.6, lrStep: 0.01, steps: 80 },
  saddle: { label: "Saddle point", lr: 0.1, lrMin: 0.01, lrMax: 0.6, lrStep: 0.01, steps: 80 },
};

const RUNS = [
  { key: "vanilla", name: "plain descent", color: "var(--series-red)" },
  { key: "momentum", name: "momentum", color: "var(--series-violet)" },
] as const;

export default function MomentumDemo() {
  const mode = useVizMode();
  const [surface, setSurface] = useState<SurfaceName>("rosenbrock");
  const [lr, setLr] = useState(SURFACE_CONFIG.rosenbrock.lr);
  const [beta, setBeta] = useState(0.9);
  const [steps, setSteps] = useState(SURFACE_CONFIG.rosenbrock.steps);
  const [result, setResult] = useState<MomentumResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function changeSurface(s: SurfaceName) {
    setSurface(s);
    setLr(SURFACE_CONFIG[s].lr);
    setSteps(SURFACE_CONFIG[s].steps);
  }

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setResult(await api.momentum({ surface, learning_rate: lr, beta, steps }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [surface, lr, beta, steps]);

  const zNorm = useMemo(() => {
    if (!result) return [];
    const flat = result.grid.z.flat();
    const zMin = Math.min(...flat);
    const zMax = Math.max(...flat);
    return result.grid.z.map((row) =>
      row.map((v) => Math.log1p(v - zMin) / Math.log1p(zMax - zMin || 1)),
    );
  }, [result]);

  const colorFor = useCallback((t: number) => sequential(t, mode), [mode]);

  return (
    <DemoCard
      title="Plain gradient descent vs. momentum"
      controls={
        <>
          <Control label="Surface">
            <select
              className={selectClass}
              value={surface}
              onChange={(e) => changeSurface(e.target.value as SurfaceName)}
            >
              {Object.entries(SURFACE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label={`Learning rate η = ${lr}`}>
            <input
              type="range"
              min={SURFACE_CONFIG[surface].lrMin}
              max={SURFACE_CONFIG[surface].lrMax}
              step={SURFACE_CONFIG[surface].lrStep}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Momentum β = ${beta}`}>
            <input
              type="range"
              min={0}
              max={0.99}
              step={0.01}
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Steps = ${steps}`}>
            <input
              type="range"
              min={20}
              max={500}
              step={20}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
            />
          </Control>
        </>
      }
      footer={
        error ? (
          <span style={{ color: "var(--status-critical)" }}>
            API error: {error}. Is the backend running?
          </span>
        ) : result ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {RUNS.map(({ key, name }) => {
              const run = result[key];
              return (
                <span key={key} className="mr-4">
                  {name}:{" "}
                  {run.diverged ? (
                    <strong style={{ color: "var(--status-critical)" }}>diverged</strong>
                  ) : (
                    <>
                      final loss <strong>{formatNum(run.losses[run.losses.length - 1])}</strong>
                    </>
                  )}
                </span>
              );
            })}
            <span className="text-ink-3">
              — same start, same η; momentum keeps a velocity v ← βv + ∇L
            </span>
          </span>
        ) : (
          "Running…"
        )
      }
    >
      {result && (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="mb-1 flex flex-wrap gap-4 text-xs text-ink-2">
              {RUNS.map((r) => (
                <span key={r.key} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 rounded" style={{ background: r.color }} />
                  {r.name}
                </span>
              ))}
            </div>
            <HeatmapPlot
              xs={result.grid.xs}
              ys={result.grid.ys}
              grid={zNorm}
              colorFor={colorFor}
              xlim={result.xlim}
              ylim={result.ylim}
              valueLabel="loss (normalized)"
              ariaLabel={`Loss surface for ${surface} comparing plain gradient descent and momentum trajectories`}
            >
              {(sx, sy) => (
                <g>
                  {RUNS.map(({ key, color }) => {
                    const run = result[key];
                    const end = run.path[run.path.length - 1];
                    return (
                      <g key={key}>
                        <path
                          d={run.path
                            .map(
                              (p, i) =>
                                `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`,
                            )
                            .join("")}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={sx(end[0])}
                          cy={sy(end[1])}
                          r="4"
                          fill={color}
                          stroke="var(--viz-surface)"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                  <circle
                    cx={sx(result.vanilla.path[0][0])}
                    cy={sy(result.vanilla.path[0][1])}
                    r="4"
                    fill="var(--foreground)"
                    stroke="var(--viz-surface)"
                    strokeWidth="2"
                  />
                  <text
                    x={sx(result.vanilla.path[0][0]) + 7}
                    y={sy(result.vanilla.path[0][1]) - 6}
                    fontSize="10"
                    fill="var(--foreground)"
                  >
                    start
                  </text>
                </g>
              )}
            </HeatmapPlot>
          </div>
          <div>
            <p className="mb-1 text-xs text-ink-3">Loss at each step</p>
            <LineChart
              series={RUNS.map(({ key, name, color }) => ({
                name,
                color,
                points: result[key].losses.map((l, i) => [i, l] as [number, number]),
              }))}
              xLabel="step"
              yLabel="loss"
              height={310}
              showTable
            />
          </div>
        </div>
      )}
    </DemoCard>
  );
}
