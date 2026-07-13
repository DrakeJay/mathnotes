"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { GradientDescentParams, GradientDescentResult } from "@/lib/types";
import DemoCard, { Control, selectClass } from "./DemoCard";
import HeatmapPlot from "../viz/HeatmapPlot";
import LineChart from "../viz/LineChart";
import { formatNum, sequential, useVizMode } from "../viz/color";

type SurfaceName = GradientDescentParams["surface"];

const SURFACE_CONFIG: Record<
  SurfaceName,
  { label: string; lr: number; lrMin: number; lrMax: number; lrStep: number; steps: number }
> = {
  bowl: { label: "Elongated bowl", lr: 0.1, lrMin: 0.01, lrMax: 1, lrStep: 0.01, steps: 60 },
  saddle: { label: "Saddle point", lr: 0.2, lrMin: 0.01, lrMax: 1, lrStep: 0.01, steps: 80 },
  rosenbrock: {
    label: "Rosenbrock valley",
    lr: 0.001,
    lrMin: 0.0002,
    lrMax: 0.006,
    lrStep: 0.0002,
    steps: 300,
  },
};

export default function GradientDescentDemo() {
  const mode = useVizMode();
  const [surface, setSurface] = useState<SurfaceName>("bowl");
  const [lr, setLr] = useState(SURFACE_CONFIG.bowl.lr);
  const [steps, setSteps] = useState(SURFACE_CONFIG.bowl.steps);
  const [result, setResult] = useState<GradientDescentResult | null>(null);
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
        setResult(await api.gradientDescent({ surface, learning_rate: lr, steps }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [surface, lr, steps]);

  // Log-normalize the loss grid so the valley structure is visible even on
  // surfaces whose values span several orders of magnitude.
  const { zNorm, zMin, zMax } = useMemo(() => {
    if (!result) return { zNorm: [], zMin: 0, zMax: 1 };
    const flat = result.grid.z.flat();
    const zMin = Math.min(...flat);
    const zMax = Math.max(...flat);
    const zNorm = result.grid.z.map((row) =>
      row.map((v) => Math.log1p(v - zMin) / Math.log1p(zMax - zMin || 1)),
    );
    return { zNorm, zMin, zMax };
  }, [result]);

  const colorFor = useCallback((t: number) => sequential(t, mode), [mode]);

  const last = result?.path[result.path.length - 1];

  return (
    <DemoCard
      title="Gradient descent, live"
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
              className="w-40 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Steps = ${steps}`}>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-32 accent-(--series-blue)"
            />
          </Control>
        </>
      }
      footer={
        error ? (
          <span style={{ color: "var(--status-critical)" }}>API error: {error}. Is the backend running?</span>
        ) : result?.diverged ? (
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M6 1 L11.5 11 H0.5 Z" fill="var(--status-critical)" />
            </svg>
            <span>
              <strong>Diverged</strong> after {result.path.length} steps — the learning rate is
              too large for this surface&apos;s curvature. Loss shown up to the blow-up.
            </span>
          </span>
        ) : last ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            Stopped at ({formatNum(last[0])}, {formatNum(last[1])}) · final loss{" "}
            {formatNum(result!.losses[result!.losses.length - 1])} · surface range{" "}
            {formatNum(zMin)}–{formatNum(zMax)}
          </span>
        ) : (
          "Running…"
        )
      }
    >
      {result && (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-ink-3">
              Loss surface (darker = higher loss) and the optimizer&apos;s path
            </p>
            <HeatmapPlot
              xs={result.grid.xs}
              ys={result.grid.ys}
              grid={zNorm}
              colorFor={colorFor}
              xlim={result.xlim}
              ylim={result.ylim}
              valueLabel="loss (normalized)"
              ariaLabel={`Loss surface heatmap for ${surface} with gradient descent path of ${result.path.length} steps`}
            >
              {(sx, sy) => (
                <g>
                  <path
                    d={result.path
                      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`)
                      .join("")}
                    fill="none"
                    stroke="var(--series-red)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {result.path.map((p, i) => (
                    <circle
                      key={i}
                      cx={sx(p[0])}
                      cy={sy(p[1])}
                      r={i === 0 || i === result.path.length - 1 ? 4 : 2}
                      fill="var(--series-red)"
                      stroke="var(--viz-surface)"
                      strokeWidth={i === 0 || i === result.path.length - 1 ? 2 : 0}
                    />
                  ))}
                  <text
                    x={sx(result.path[0][0]) + 7}
                    y={sy(result.path[0][1]) - 6}
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
              series={[
                {
                  name: "loss",
                  color: "var(--series-blue)",
                  points: result.losses.map((l, i) => [i, l]),
                },
              ]}
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
