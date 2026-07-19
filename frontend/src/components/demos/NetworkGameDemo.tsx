"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DemoCard, { buttonClass } from "./DemoCard";
import HeatmapPlot from "../viz/HeatmapPlot";
import LineChart from "../viz/LineChart";
import { diverging, useVizMode } from "../viz/color";

/* ---------- the engine: a tiny MLP with a flat parameter vector ----------
   Layout: H = 0            -> [w1, w2, b]
           H hidden units   -> [w1x, w1y, b1, ..., wHx, wHy, bH, v1..vH, c]
   Hidden units are tanh; the output is a sigmoid; the score is mean
   binary cross-entropy. Mirrors the NumPy version in the lesson text. */

type Pt = [number, number, number]; // x, y, label

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function predict(p: number[], H: number, x: number, y: number): number {
  if (H === 0) return sigmoid(p[0] * x + p[1] * y + p[2]);
  let z = p[4 * H];
  for (let i = 0; i < H; i++) {
    z += p[3 * H + i] * Math.tanh(p[3 * i] * x + p[3 * i + 1] * y + p[3 * i + 2]);
  }
  return sigmoid(z);
}

function lossAndGrad(p: number[], H: number, pts: Pt[]): { loss: number; grad: number[] } {
  const g = new Array<number>(p.length).fill(0);
  let L = 0;
  const n = pts.length;
  for (const [x, y, t] of pts) {
    const hs: number[] = [];
    let z: number;
    if (H === 0) {
      z = p[0] * x + p[1] * y + p[2];
    } else {
      z = p[4 * H];
      for (let i = 0; i < H; i++) {
        const h = Math.tanh(p[3 * i] * x + p[3 * i + 1] * y + p[3 * i + 2]);
        hs.push(h);
        z += p[3 * H + i] * h;
      }
    }
    const prob = sigmoid(z);
    const pc = Math.min(1 - 1e-9, Math.max(1e-9, prob));
    L += -(t * Math.log(pc) + (1 - t) * Math.log(1 - pc)) / n;
    const dz = (prob - t) / n;
    if (H === 0) {
      g[0] += dz * x;
      g[1] += dz * y;
      g[2] += dz;
    } else {
      g[4 * H] += dz;
      for (let i = 0; i < H; i++) {
        g[3 * H + i] += dz * hs[i];
        const da = dz * p[3 * H + i] * (1 - hs[i] * hs[i]);
        g[3 * i] += da * x;
        g[3 * i + 1] += da * y;
        g[3 * i + 2] += da;
      }
    }
  }
  return { loss: L, grad: g };
}

/* ---------- fixed datasets (seeded, so every visit plays the same game) --- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGauss(rand: () => number) {
  return () => {
    const u = Math.max(rand(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
}

function blobs(): Pt[] {
  const g = makeGauss(mulberry32(11));
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) pts.push([1.2 + 0.55 * g(), 0.9 + 0.55 * g(), 1]);
  for (let i = 0; i < 16; i++) pts.push([-1.2 + 0.55 * g(), -0.9 + 0.55 * g(), 0]);
  return pts;
}

function xorQuadrants(): Pt[] {
  const g = makeGauss(mulberry32(22));
  const pts: Pt[] = [];
  for (const [cx, cy] of [[1.2, 1.2], [-1.2, -1.2], [-1.2, 1.2], [1.2, -1.2]] as const) {
    for (let i = 0; i < 8; i++) {
      pts.push([cx + 0.45 * g(), cy + 0.45 * g(), cx * cy > 0 ? 1 : 0]);
    }
  }
  return pts;
}

function ringPoints(): Pt[] {
  const rand = mulberry32(33);
  const g = makeGauss(rand);
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) pts.push([0.45 * g(), 0.45 * g(), 1]);
  for (let i = 0; i < 22; i++) {
    const a = rand() * 2 * Math.PI;
    const r = 2.0 + 0.2 * g();
    pts.push([r * Math.cos(a), r * Math.sin(a), 0]);
  }
  return pts;
}

type Level = {
  name: string;
  hidden: number;
  par: number;
  eta: number;
  init: number[];
  points: Pt[];
  blurb: string;
};

/* Starting weights are chosen to look untrained but sit in a basin gradient
   descent actually escapes — level 2's XOR surface has traps. */
const LEVELS: Level[] = [
  {
    name: "Two clusters",
    hidden: 0,
    par: 0.1,
    eta: 1.0,
    init: [-1.5, 1.0, 0.5],
    points: blobs(),
    blurb: "One neuron, three knobs. Find the separating line by hand — this one is winnable.",
  },
  {
    name: "XOR",
    hidden: 2,
    par: 0.25,
    eta: 1.0,
    init: [0.2, 0.25, -0.15, 0.25, 0.2, 0.15, 0.3, -0.3, 0.1],
    points: xorQuadrants(),
    blurb: "No single line works. Two hidden neurons, nine coupled knobs. Good luck.",
  },
  {
    name: "The ring",
    hidden: 3,
    par: 0.25,
    eta: 0.6,
    init: [0.6, 0.2, 0.3, -0.4, 0.5, -0.2, 0.1, -0.6, 0.4, 0.7, -0.5, 0.6, -0.1],
    points: ringPoints(),
    blurb: "Blue inside, red outside: 13 knobs must close a curve. This is the optimizer's job.",
  },
];

const MACHINE_STEPS = 400;
const STEPS_PER_FRAME = 8;
const GRID_N = 56;
const LIM = 3;

const gridAxis = Array.from({ length: GRID_N }, (_, i) => -LIM + (2 * LIM * i) / (GRID_N - 1));

function paramGroups(H: number): { title: string; idxs: number[]; labels: string[] }[] {
  if (H === 0) return [{ title: "The neuron", idxs: [0, 1, 2], labels: ["w1", "w2", "b"] }];
  const groups = Array.from({ length: H }, (_, i) => ({
    title: `Hidden neuron ${i + 1}`,
    idxs: [3 * i, 3 * i + 1, 3 * i + 2],
    labels: ["wx", "wy", "b"],
  }));
  groups.push({
    title: "Output neuron",
    idxs: [...Array.from({ length: H }, (_, i) => 3 * H + i), 4 * H],
    labels: [...Array.from({ length: H }, (_, i) => `v${i + 1}`), "c"],
  });
  return groups;
}

export default function NetworkGameDemo() {
  const mode = useVizMode();
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  /* The heatmap rasterizes to a canvas dataURL, which exists on the client
     but not in the server-rendered HTML — render it only after mount. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [params, setParams] = useState<number[]>(level.init);
  const [history, setHistory] = useState<number[]>([
    lossAndGrad(level.init, level.hidden, level.points).loss,
  ]);
  const [gradSteps, setGradSteps] = useState(0);
  const [machineOn, setMachineOn] = useState(false);
  const [solved, setSolved] = useState<boolean[]>(LEVELS.map(() => false));

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const remainingRef = useRef(0);

  const { loss, grad } = useMemo(
    () => lossAndGrad(params, level.hidden, level.points),
    [params, level],
  );
  const accuracy = useMemo(
    () =>
      level.points.filter(
        ([x, y, t]) => (predict(params, level.hidden, x, y) > 0.5 ? 1 : 0) === t,
      ).length / level.points.length,
    [params, level],
  );

  const probGrid = useMemo(
    () =>
      gridAxis.map((y) => gridAxis.map((x) => predict(params, level.hidden, x, y))),
    [params, level],
  );
  const colorFor = useCallback((p: number) => diverging(p, mode), [mode]);

  const loadLevel = useCallback((idx: number) => {
    const lv = LEVELS[idx];
    setLevelIdx(idx);
    setParams(lv.init);
    setHistory([lossAndGrad(lv.init, lv.hidden, lv.points).loss]);
    setGradSteps(0);
    setMachineOn(false);
    remainingRef.current = 0;
  }, []);

  const onSlider = (idx: number, value: number) => {
    if (machineOn) return;
    const next = params.slice();
    next[idx] = value;
    setParams(next);
    setHistory((h) => [...h, lossAndGrad(next, level.hidden, level.points).loss]);
  };

  const nudge = () => {
    const { grad: g } = lossAndGrad(params, level.hidden, level.points);
    const next = params.map((v, i) => v - level.eta * g[i]);
    setParams(next);
    setGradSteps((n) => n + 1);
    setHistory((h) => [...h, lossAndGrad(next, level.hidden, level.points).loss]);
  };

  useEffect(() => {
    if (!machineOn) return;
    let raf = 0;
    const tick = () => {
      let p = paramsRef.current.slice();
      let done = 0;
      while (done < STEPS_PER_FRAME && remainingRef.current > 0) {
        const { grad: g } = lossAndGrad(p, level.hidden, level.points);
        p = p.map((v, i) => v - level.eta * g[i]);
        remainingRef.current -= 1;
        done += 1;
      }
      setParams(p);
      setGradSteps((n) => n + done);
      setHistory((h) => [...h, lossAndGrad(p, level.hidden, level.points).loss]);
      if (remainingRef.current > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        setMachineOn(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [machineOn, level]);

  useEffect(() => {
    if (loss <= level.par) {
      setSolved((s) => (s[levelIdx] ? s : s.map((v, i) => (i === levelIdx ? true : v))));
    }
  }, [loss, level.par, levelIdx]);

  const maxAbsGrad = Math.max(1e-9, ...grad.map(Math.abs));
  const isSolved = loss <= level.par;

  return (
    <DemoCard
      title="Beat par: train a network by hand"
      controls={
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="level select">
            {LEVELS.map((lv, i) => (
              <button
                key={lv.name}
                aria-pressed={i === levelIdx}
                onClick={() => loadLevel(i)}
                className={
                  i === levelIdx
                    ? "rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
                }
              >
                {`${i + 1} · ${lv.name}`}
                {solved[i] ? " ✓" : ""}
              </button>
            ))}
          </div>
          <button className={buttonClass} onClick={nudge} disabled={machineOn}>
            Nudge downhill
          </button>
          <button
            className={buttonClass}
            onClick={() => {
              remainingRef.current = MACHINE_STEPS;
              setMachineOn(true);
            }}
            disabled={machineOn}
          >
            {machineOn ? "Descending…" : "Let gradient descent play"}
          </button>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => loadLevel(levelIdx)}
          >
            Reset level
          </button>
        </>
      }
      footer={
        <span>
          The arrows beside the sliders are the gradient: each points the way downhill
          for its own knob, and fades where the surface is flat. Nudge follows all of
          them at once — one step of θ ← θ − η∇L. Par is the loss gradient descent
          reaches comfortably; beat it however you like.
        </span>
      }
    >
      <p className="mb-3 text-xs text-ink-2">{level.blurb}</p>

      <div
        className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span aria-label="current loss">
          loss <strong>{loss.toFixed(3)}</strong>
        </span>
        <span className="text-ink-2">par {level.par.toFixed(2)}</span>
        <span className="text-ink-2" aria-label="accuracy">
          accuracy {(accuracy * 100).toFixed(0)}%
        </span>
        <span className="text-ink-2" aria-label="gradient steps">
          gradient steps {gradSteps}
        </span>
        {isSolved && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ background: "var(--series-aqua)" }}
          >
            Solved!
          </span>
        )}
      </div>

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
            <span className="text-ink-3">background = your network&apos;s P(class 1)</span>
          </div>
          {!mounted && (
            <div
              className="aspect-square w-full rounded-md"
              style={{ background: "var(--viz-surface)" }}
            />
          )}
          {mounted && (
          <HeatmapPlot
            xs={gridAxis}
            ys={gridAxis}
            grid={probGrid}
            colorFor={colorFor}
            xlim={[-LIM, LIM]}
            ylim={[-LIM, LIM]}
            valueLabel="P(class 1) ="
            ariaLabel={`Your network's current decision boundary on the ${level.name} level, with the data points overlaid`}
          >
            {(sx, sy) => (
              <g>
                {level.points.map(([x, y, t], i) => (
                  <circle
                    key={i}
                    cx={sx(x)}
                    cy={sy(y)}
                    r="3.5"
                    fill={t === 1 ? "var(--series-blue)" : "var(--series-red)"}
                    stroke="var(--viz-surface)"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}
          </HeatmapPlot>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {paramGroups(level.hidden).map((group) => (
            <fieldset key={group.title}>
              <legend className="mb-1 text-xs font-medium text-ink-3">{group.title}</legend>
              <div className="flex flex-col gap-1">
                {group.idxs.map((idx, j) => {
                  const flat = Math.abs(grad[idx]) < 1e-4;
                  const arrow = flat ? "·" : grad[idx] > 0 ? "←" : "→";
                  const strength = Math.min(1, Math.abs(grad[idx]) / maxAbsGrad);
                  return (
                    <label key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-7 shrink-0 font-mono text-ink-3">
                        {group.labels[j]}
                      </span>
                      <input
                        type="range"
                        min={-6}
                        max={6}
                        step={0.05}
                        value={params[idx]}
                        disabled={machineOn}
                        aria-label={`parameter ${group.labels[j]} of ${group.title}`}
                        onChange={(e) => onSlider(idx, Number(e.target.value))}
                        className="min-w-0 flex-1 accent-(--series-blue)"
                      />
                      <span
                        className="w-11 shrink-0 text-right text-ink-2"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {params[idx].toFixed(2)}
                      </span>
                      <span
                        aria-hidden="true"
                        className="w-3 shrink-0 text-center font-semibold"
                        style={{
                          color: "var(--series-blue)",
                          opacity: flat ? 0.35 : 0.35 + 0.65 * strength,
                        }}
                      >
                        {arrow}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-1 text-xs text-ink-3">
          Loss after each move — slider drags, nudges, and the machine&apos;s steps alike
        </p>
        <LineChart
          series={[
            {
              name: "your loss",
              color: "var(--series-blue)",
              points: history.map((l, i) => [i, l]),
            },
            {
              name: "par",
              color: "var(--series-violet)",
              points: [
                [0, level.par],
                [Math.max(1, history.length - 1), level.par],
              ],
            },
          ]}
          xLabel="move"
          yLabel="loss"
          height={200}
          endLabels={false}
        />
      </div>
    </DemoCard>
  );
}
