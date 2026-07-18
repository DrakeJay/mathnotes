"use client";

import { useState } from "react";
import DemoCard, { Control, buttonClass } from "./DemoCard";
import LineChart from "../viz/LineChart";
import { formatNum } from "../viz/color";

const MAX_FLIPS = 20000;

export default function CoinFlipsDemo() {
  const [p, setP] = useState(0.5);
  const [heads, setHeads] = useState(0);
  const [n, setN] = useState(0);
  const [points, setPoints] = useState<[number, number][]>([]);

  function reset(newP?: number) {
    if (newP !== undefined) setP(newP);
    setHeads(0);
    setN(0);
    setPoints([]);
  }

  function flip(k: number) {
    let h = heads;
    let count = n;
    const pts = [...points];
    const budget = Math.min(k, MAX_FLIPS - n);
    for (let i = 0; i < budget; i++) {
      if (Math.random() < p) h++;
      count++;
      pts.push([count, h / count]);
    }
    setHeads(h);
    setN(count);
    setPoints(pts);
  }

  // thin the recorded points for rendering
  const stride = Math.max(1, Math.ceil(points.length / 400));
  const sampled = points.filter((_, i) => i % stride === 0 || i === points.length - 1);

  const excess = heads - p * n;

  return (
    <DemoCard
      title="The law of large numbers, live"
      controls={
        <>
          <Control label={`P(heads) = ${p.toFixed(2)}`}>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={p}
              onChange={(e) => reset(Number(e.target.value))}
              className="w-36 accent-(--series-blue)"
            />
          </Control>
          <button className={buttonClass} onClick={() => flip(1)} disabled={n >= MAX_FLIPS}>
            Flip 1
          </button>
          <button className={buttonClass} onClick={() => flip(100)} disabled={n >= MAX_FLIPS}>
            Flip 100
          </button>
          <button className={buttonClass} onClick={() => flip(5000)} disabled={n >= MAX_FLIPS}>
            Flip 5,000
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 hover:text-foreground"
            onClick={() => reset()}
          >
            Reset
          </button>
        </>
      }
      footer={
        n === 0 ? (
          "Flip the coin — the chart tracks the running proportion of heads."
        ) : (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            n = {n.toLocaleString()} · heads = {heads.toLocaleString()} · proportion ={" "}
            <strong>{(heads / n).toFixed(4)}</strong> · excess over p·n = {formatNum(excess)} — the
            count wanders, the proportion converges.
          </span>
        )
      }
    >
      {n >= 2 ? (
        <LineChart
          series={[
            { name: "proportion of heads", color: "var(--series-blue)", points: sampled },
            {
              name: `true p = ${p.toFixed(2)}`,
              color: "var(--series-yellow)",
              points: [
                [1, p],
                [Math.max(n, 2), p],
              ],
            },
          ]}
          xLabel="flips"
          yLabel="proportion"
          height={260}
          endLabels={false}
        />
      ) : (
        <p className="not-prose py-10 text-center text-sm text-ink-3">
          No flips yet — small samples ahead will lie to you; large ones won&apos;t.
        </p>
      )}
    </DemoCard>
  );
}
