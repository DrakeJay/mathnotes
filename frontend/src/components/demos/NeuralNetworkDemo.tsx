"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TrainNetworkParams, TrainNetworkResult } from "@/lib/types";
import DemoCard, { Control, buttonClass, selectClass } from "./DemoCard";
import HeatmapPlot from "../viz/HeatmapPlot";
import LineChart from "../viz/LineChart";
import { diverging, useVizMode } from "../viz/color";

const LAYER_PRESETS = ["2", "4", "8", "4,4", "8,8", "16,16"];

const DATASETS: { value: TrainNetworkParams["dataset"]; label: string }[] = [
  { value: "circles", label: "Circles" },
  { value: "xor", label: "XOR quadrants" },
  { value: "moons", label: "Two moons" },
  { value: "spiral", label: "Spiral" },
];

export default function NeuralNetworkDemo() {
  const mode = useVizMode();
  const [dataset, setDataset] = useState<TrainNetworkParams["dataset"]>("circles");
  const [layers, setLayers] = useState("8");
  const [activation, setActivation] = useState<"tanh" | "relu">("tanh");
  const [lr, setLr] = useState(0.5);
  const [epochs, setEpochs] = useState(400);
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<TrainNetworkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const train = useCallback(async () => {
    setLoading(true);
    try {
      setResult(
        await api.trainNetwork({
          dataset,
          hidden_layers: layers.split(",").map(Number),
          activation,
          learning_rate: lr,
          epochs,
          seed,
        }),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [dataset, layers, activation, lr, epochs, seed]);

  // Train once on mount with the defaults; afterwards only on demand.
  useEffect(() => {
    void train();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorFor = useCallback((p: number) => diverging(p, mode), [mode]);

  const lim = result ? result.boundary.xs[result.boundary.xs.length - 1] : 1.5;

  return (
    <DemoCard
      title="Train a neural network with backprop, live"
      controls={
        <>
          <Control label="Dataset">
            <select
              className={selectClass}
              value={dataset}
              onChange={(e) => setDataset(e.target.value as TrainNetworkParams["dataset"])}
            >
              {DATASETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label="Hidden layers">
            <select className={selectClass} value={layers} onChange={(e) => setLayers(e.target.value)}>
              {LAYER_PRESETS.map((p) => (
                <option key={p} value={p}>
                  [{p}]
                </option>
              ))}
            </select>
          </Control>
          <Control label="Activation">
            <select
              className={selectClass}
              value={activation}
              onChange={(e) => setActivation(e.target.value as "tanh" | "relu")}
            >
              <option value="tanh">tanh</option>
              <option value="relu">ReLU</option>
            </select>
          </Control>
          <Control label={`η = ${lr}`}>
            <input
              type="range"
              min={0.05}
              max={3}
              step={0.05}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Epochs = ${epochs}`}>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
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
          <button className={buttonClass} onClick={train} disabled={loading}>
            {loading ? "Training…" : "Train"}
          </button>
        </>
      }
      footer={
        error ? (
          <span style={{ color: "var(--status-critical)" }}>
            API error: {error}. Is the backend running?
          </span>
        ) : result ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            Training accuracy <strong>{(result.accuracy * 100).toFixed(1)}%</strong> · architecture{" "}
            {result.architecture.join(" → ")} · {activation} hidden units, sigmoid output,
            cross-entropy loss, full-batch gradient descent
          </span>
        ) : (
          "Training…"
        )
      }
    >
      {result && (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-4 text-xs text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--series-blue)" }}
                />
                class 1
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--series-red)" }}
                />
                class 0
              </span>
              <span className="text-ink-3">background = predicted P(class 1)</span>
            </div>
            <HeatmapPlot
              xs={result.boundary.xs}
              ys={result.boundary.ys}
              grid={result.boundary.prob}
              colorFor={colorFor}
              xlim={[-lim, lim]}
              ylim={[-lim, lim]}
              valueLabel="P(class 1) ="
              ariaLabel={`Decision boundary learned on the ${dataset} dataset, with training points overlaid`}
            >
              {(sx, sy) => (
                <g>
                  {result.points.map(([x, y, label], i) => (
                    <circle
                      key={i}
                      cx={sx(x)}
                      cy={sy(y)}
                      r="3.5"
                      fill={label === 1 ? "var(--series-blue)" : "var(--series-red)"}
                      stroke="var(--viz-surface)"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              )}
            </HeatmapPlot>
          </div>
          <div>
            <p className="mb-1 text-xs text-ink-3">Cross-entropy loss per epoch</p>
            <LineChart
              series={[
                {
                  name: "loss",
                  color: "var(--series-blue)",
                  points: result.loss_curve.map((d) => [d.epoch, d.loss]),
                },
              ]}
              xLabel="epoch"
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
