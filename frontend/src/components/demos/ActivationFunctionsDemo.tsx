"use client";

import { useMemo, useState } from "react";
import DemoCard from "./DemoCard";
import LineChart from "../viz/LineChart";

type FnName = "sigmoid" | "tanh" | "relu";

const FNS: Record<
  FnName,
  { label: string; f: (z: number) => number; df: (z: number) => number; note: string }
> = {
  sigmoid: {
    label: "Sigmoid",
    f: (z) => 1 / (1 + Math.exp(-z)),
    df: (z) => {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    },
    note: "The derivative peaks at just 0.25 — stack many layers and gradients vanish.",
  },
  tanh: {
    label: "Tanh",
    f: Math.tanh,
    df: (z) => 1 - Math.tanh(z) ** 2,
    note: "Zero-centered, derivative peaks at 1 — but still saturates for large |z|.",
  },
  relu: {
    label: "ReLU",
    f: (z) => Math.max(0, z),
    df: (z) => (z > 0 ? 1 : 0),
    note: "Derivative is exactly 1 when active — gradients pass through undiminished.",
  },
};

export default function ActivationFunctionsDemo() {
  const [fn, setFn] = useState<FnName>("sigmoid");

  const series = useMemo(() => {
    const { f, df } = FNS[fn];
    const fPoints: [number, number][] = [];
    const dfPoints: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const z = -5 + (10 * i) / 120;
      fPoints.push([z, f(z)]);
      dfPoints.push([z, df(z)]);
    }
    return [
      { name: `${fn}(z)`, color: "var(--series-blue)", points: fPoints },
      { name: `${fn}′(z)`, color: "var(--series-aqua)", points: dfPoints },
    ];
  }, [fn]);

  return (
    <DemoCard
      title="Activation functions and their derivatives"
      controls={
        <div className="flex gap-1.5">
          {(Object.keys(FNS) as FnName[]).map((name) => (
            <button
              key={name}
              onClick={() => setFn(name)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                fn === name
                  ? "border-accent bg-accent text-white"
                  : "border-hairline bg-background text-ink-2 hover:text-foreground"
              }`}
            >
              {FNS[name].label}
            </button>
          ))}
        </div>
      }
      footer={FNS[fn].note}
    >
      <LineChart series={series} xLabel="z" yLabel="value" height={280} showTable />
    </DemoCard>
  );
}
