"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { GradientFlowResult } from "@/lib/types";
import DemoCard, { Control, selectClass } from "./DemoCard";
import LineChart from "../viz/LineChart";

/* Categorical slots in fixed order: sigmoid, tanh, relu. Yellow's light-mode
   contrast is sub-3:1, so the chart's direct end labels + legend carry it. */
const SERIES_STYLE = [
  { key: "sigmoid", color: "var(--series-blue)" },
  { key: "tanh", color: "var(--series-aqua)" },
  { key: "relu", color: "var(--series-yellow)" },
] as const;

export default function VanishingGradientsDemo() {
  const [depth, setDepth] = useState(6);
  const [width, setWidth] = useState(8);
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<GradientFlowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setResult(await api.gradientFlow({ depth, width, seed }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [depth, width, seed]);

  const ratio =
    result &&
    result.norms.sigmoid[result.norms.sigmoid.length - 1] /
      Math.max(result.norms.sigmoid[0], 1e-30);

  return (
    <DemoCard
      title="Gradient magnitude by layer, at initialization"
      controls={
        <>
          <Control label={`Depth = ${depth} hidden layers`}>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-40 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Width = ${width} units`}>
            <input
              type="range"
              min={2}
              max={32}
              step={2}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-32 accent-(--series-blue)"
            />
          </Control>
          <Control label="Seed">
            <input
              type="number"
              min={0}
              max={9999}
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className={`${selectClass} w-16`}
            />
          </Control>
        </>
      }
      footer={
        error ? (
          <span style={{ color: "var(--status-critical)" }}>
            API error: {error}. Is the backend running?
          </span>
        ) : result && ratio ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            One backward pass through a fresh {result.depth}-hidden-layer network (width{" "}
            {result.width}). With sigmoid, the first layer&apos;s gradient is{" "}
            <strong>~{ratio >= 10 ? `${Math.round(ratio).toLocaleString()}×` : `${ratio.toFixed(1)}×`}</strong>{" "}
            smaller than the last layer&apos;s — layer 1 is the x-axis&apos;s left edge, and the
            y-axis is log₁₀, so each unit down is 10× smaller.
          </span>
        ) : (
          "Running…"
        )
      }
    >
      {result && (
        <LineChart
          series={SERIES_STYLE.map(({ key, color }) => ({
            name: key,
            color,
            points: result.norms[key].map(
              (n, i) => [result.layers[i], Math.log10(Math.max(n, 1e-30))] as [number, number],
            ),
          }))}
          xLabel="layer (1 = closest to input)"
          yLabel="log₁₀ mean |∂L/∂W|"
          height={280}
          showTable
        />
      )}
    </DemoCard>
  );
}
