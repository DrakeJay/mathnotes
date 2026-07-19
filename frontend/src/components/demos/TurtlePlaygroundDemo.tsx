"use client";

import { useMemo, useState } from "react";
import DemoCard, { Control, selectClass } from "./DemoCard";
import { makeFit, runTurtle, toSvgPath } from "./turtle";

const W = 520;
const H = 320;

const KEYS = ["F", "+", "-", "[", "]"] as const;

const EXAMPLES: { label: string; program: string; angle: number }[] = [
  { label: "square", program: "F+F+F+F", angle: 90 },
  { label: "triangle", program: "F+F+F", angle: 120 },
  { label: "star", program: "F+F+F+F+F", angle: 144 },
  { label: "staircase", program: "F+F-F+F-F+F-", angle: 90 },
  { label: "branch", program: "F[+F][-F]F", angle: 30 },
  { label: "almost-circle", program: "F+".repeat(24).slice(0, -1), angle: 15 },
];

export default function TurtlePlaygroundDemo() {
  const [program, setProgram] = useState("F+F+F+F");
  const [angle, setAngle] = useState(90);

  const run = useMemo(() => runTurtle(program, angle, "F", 90), [program, angle]);
  const fit = useMemo(() => makeFit(run, W, H, 26), [run]);
  const d = useMemo(() => toSvgPath(run, fit), [run, fit]);

  const [ex, ey] = fit([run.end.x, run.end.y]);
  const headingScreenDeg = (-run.end.heading * 180) / Math.PI;
  const headingDeg =
    ((Math.round((run.end.heading * 180) / Math.PI) % 360) + 360) % 360;
  const [sxp, syp] = fit([0, 0]);

  return (
    <DemoCard
      title="Drive the turtle"
      controls={
        <>
          <Control label="Program">
            <input
              type="text"
              value={program}
              spellCheck={false}
              aria-label="turtle program"
              onChange={(e) => setProgram(e.target.value.toUpperCase())}
              className={`${selectClass} w-56 font-mono`}
            />
          </Control>
          <div className="flex gap-1 pb-px" role="group" aria-label="append command">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setProgram((p) => p + k)}
                className="w-7 rounded-md border border-hairline bg-background py-1.5 font-mono text-xs text-foreground transition-colors hover:border-accent"
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => setProgram((p) => p.slice(0, -1))}
              aria-label="delete last command"
              className="w-7 rounded-md border border-hairline bg-background py-1.5 font-mono text-xs text-ink-2 transition-colors hover:border-accent"
            >
              ⌫
            </button>
          </div>
          <Control label={`Turn angle = ${angle}°`}>
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
          <Control label="Examples">
            <select
              className={selectClass}
              value=""
              aria-label="example programs"
              onChange={(e) => {
                const found = EXAMPLES.find((x) => x.label === e.target.value);
                if (found) {
                  setProgram(found.program);
                  setAngle(found.angle);
                }
              }}
            >
              <option value="" disabled>
                load…
              </option>
              {EXAMPLES.map((x) => (
                <option key={x.label} value={x.label}>
                  {x.label}
                </option>
              ))}
            </select>
          </Control>
        </>
      }
      footer={
        <span>
          F = one step forward (drawing), + = turn left, − = turn right by the
          turn angle; [ remembers the turtle&apos;s position and heading, ]
          teleports back to it — a stack of saved states. The turtle never
          knows where it is, only what to do next.
        </span>
      }
    >
      <div
        className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span aria-label="path segments">
          path segments <strong>{run.segments}</strong>
        </span>
        <span aria-label="turtle heading">final heading {headingDeg}°</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-md"
        style={{ background: "var(--viz-surface)" }}
        role="img"
        aria-label="The path drawn by the turtle program"
      >
        <circle cx={sxp} cy={syp} r="3" fill="var(--ink-muted)" />
        {d && (
          <path
            d={d}
            fill="none"
            stroke="var(--series-blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <g transform={`translate(${ex},${ey}) rotate(${headingScreenDeg})`}>
          <path d="M10,0 L-5,5.5 L-2,0 L-5,-5.5 Z" fill="var(--series-red)" />
        </g>
      </svg>
    </DemoCard>
  );
}
