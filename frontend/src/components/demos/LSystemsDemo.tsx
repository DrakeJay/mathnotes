"use client";

import { useMemo, useState } from "react";
import DemoCard, { Control, selectClass } from "./DemoCard";
import { expand, makeFit, runTurtle, toSvgPath } from "./turtle";

const W = 520;
const H = 380;

type Preset = {
  label: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  startHeading: number;
  draw: string;
  defaultIter: number;
  maxIter: number;
  color: string;
  note: string;
};

const PRESETS: Record<string, Preset> = {
  koch: {
    label: "Koch snowflake",
    axiom: "F++F++F",
    rules: { F: "F-F++F-F" },
    angle: 60,
    startHeading: 0,
    draw: "F",
    defaultIter: 3,
    maxIter: 5,
    color: "var(--series-blue)",
    note: "Every segment becomes 4 at 1/3 the size: dimension log 4 / log 3 ≈ 1.26.",
  },
  dragon: {
    label: "Dragon curve",
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    startHeading: 0,
    draw: "F",
    defaultIter: 10,
    maxIter: 13,
    color: "var(--series-blue)",
    note: "The crease pattern of a strip of paper folded in half n times — it tiles the plane.",
  },
  sierpinski: {
    label: "Sierpiński arrowhead",
    axiom: "A",
    rules: { A: "B-A-B", B: "A+B+A" },
    angle: 60,
    startHeading: 0,
    draw: "AB",
    defaultIter: 6,
    maxIter: 8,
    color: "var(--series-blue)",
    note: "One unbroken line that fills the Sierpiński triangle: dimension log 3 / log 2 ≈ 1.585.",
  },
  plant: {
    label: "Fractal plant",
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    startHeading: 65,
    draw: "F",
    defaultIter: 5,
    maxIter: 6,
    color: "var(--series-aqua)",
    note: "The brackets are the whole trick: [ saves the turtle on a stack, ] restores it — that's a branch.",
  },
};

export default function LSystemsDemo() {
  const [presetKey, setPresetKey] = useState("koch");
  const preset = PRESETS[presetKey];
  const [iter, setIter] = useState(PRESETS.koch.defaultIter);
  const [angle, setAngle] = useState(PRESETS.koch.angle);

  function loadPreset(key: string) {
    setPresetKey(key);
    setIter(PRESETS[key].defaultIter);
    setAngle(PRESETS[key].angle);
  }

  const commands = useMemo(
    () => expand(preset.axiom, preset.rules, iter),
    [preset, iter],
  );
  const run = useMemo(
    () => runTurtle(commands, angle, preset.draw, preset.startHeading),
    [commands, angle, preset],
  );
  const d = useMemo(() => toSvgPath(run, makeFit(run, W, H, 22)), [run]);

  const rulesText = Object.entries(preset.rules)
    .map(([k, v]) => `${k} → ${v}`)
    .join("   ");
  const preview =
    commands.length > 90 ? `${commands.slice(0, 90)}…` : commands;

  return (
    <DemoCard
      title="Grow a fractal from a rewriting rule"
      controls={
        <>
          <Control label="System">
            <select
              className={selectClass}
              value={presetKey}
              aria-label="l-system preset"
              onChange={(e) => loadPreset(e.target.value)}
            >
              {Object.entries(PRESETS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.label}
                </option>
              ))}
            </select>
          </Control>
          <Control label={`Iterations = ${iter}`}>
            <input
              type="range"
              min={0}
              max={preset.maxIter}
              step={1}
              value={iter}
              aria-label="iterations"
              onChange={(e) => setIter(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
            />
          </Control>
          <Control label={`Angle = ${angle}°`}>
            <input
              type="range"
              min={5}
              max={160}
              step={1}
              value={angle}
              aria-label="turn angle"
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-28 accent-(--series-blue)"
            />
          </Control>
          <button
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent"
            onClick={() => loadPreset(presetKey)}
          >
            Reset
          </button>
        </>
      }
      footer={<span>{preset.note}</span>}
    >
      <div className="mb-1 font-mono text-xs text-ink-2">
        axiom {preset.axiom} <span className="text-ink-3">·</span> {rulesText}
      </div>
      <div
        className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span aria-label="segments">
          segments <strong>{run.segments}</strong>
        </span>
        <span aria-label="string length">string length {commands.length}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-md"
        style={{ background: "var(--viz-surface)" }}
        role="img"
        aria-label={`The ${preset.label} after ${iter} rewriting iterations, drawn by the turtle`}
      >
        {d && (
          <path
            d={d}
            fill="none"
            stroke={preset.color}
            strokeWidth={run.segments > 2000 ? 1 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <p
        className="mt-2 truncate font-mono text-[11px] text-ink-3"
        aria-label="current string"
      >
        {preview || "(empty)"}
      </p>
    </DemoCard>
  );
}
