/* Turtle-graphics interpreter shared by the turtle playground and the
   L-systems demo. Commands: draw symbols move forward one unit drawing a
   segment, `+` turns left, `-` turns right, `[` pushes the turtle's state,
   `]` pops it (starting a new subpath). Anything else is ignored, which is
   what lets L-system bookkeeping symbols like X pass through harmlessly. */

export type TurtleRun = {
  /** Polylines in math coordinates (y up); brackets split subpaths. */
  paths: [number, number][][];
  end: { x: number; y: number; heading: number }; // heading in radians
  segments: number;
};

export function runTurtle(
  commands: string,
  angleDeg: number,
  drawSymbols: string,
  startHeadingDeg = 0,
): TurtleRun {
  const turn = (angleDeg * Math.PI) / 180;
  const draw = new Set(drawSymbols);
  let x = 0;
  let y = 0;
  let h = (startHeadingDeg * Math.PI) / 180;
  const stack: [number, number, number][] = [];
  const paths: [number, number][][] = [];
  let current: [number, number][] = [[0, 0]];
  let segments = 0;

  for (const ch of commands) {
    if (draw.has(ch)) {
      x += Math.cos(h);
      y += Math.sin(h);
      current.push([x, y]);
      segments += 1;
    } else if (ch === "+") {
      h += turn;
    } else if (ch === "-") {
      h -= turn;
    } else if (ch === "[") {
      stack.push([x, y, h]);
    } else if (ch === "]") {
      const state = stack.pop();
      if (state) {
        if (current.length > 1) paths.push(current);
        [x, y, h] = state;
        current = [[x, y]];
      }
    }
  }
  if (current.length > 1) paths.push(current);
  return { paths, end: { x, y, heading: h }, segments };
}

/** Map math coordinates onto a W×H viewBox (y flipped), fitting the whole
 *  drawing with padding and preserving aspect ratio. */
export function makeFit(
  run: TurtleRun,
  W: number,
  H: number,
  pad: number,
): (p: [number, number]) => [number, number] {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  const consider = (px: number, py: number) => {
    if (px < xMin) xMin = px;
    if (px > xMax) xMax = px;
    if (py < yMin) yMin = py;
    if (py > yMax) yMax = py;
  };
  for (const path of run.paths) for (const [px, py] of path) consider(px, py);
  consider(run.end.x, run.end.y);
  if (!Number.isFinite(xMin)) {
    xMin = xMax = yMin = yMax = 0;
  }
  const bw = xMax - xMin || 1e-9;
  const bh = yMax - yMin || 1e-9;
  const s = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh);
  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;
  return ([px, py]) => [W / 2 + (px - cx) * s, H / 2 - (py - cy) * s];
}

export function toSvgPath(
  run: TurtleRun,
  fit: (p: [number, number]) => [number, number],
): string {
  return run.paths
    .map(
      (path) =>
        "M" +
        path
          .map((p) => {
            const [px, py] = fit(p);
            return `${px.toFixed(1)},${py.toFixed(1)}`;
          })
          .join("L"),
    )
    .join("");
}

/** Apply L-system rules to the axiom `n` times (parallel rewriting). */
export function expand(
  axiom: string,
  rules: Record<string, string>,
  n: number,
): string {
  let s = axiom;
  for (let i = 0; i < n; i++) {
    let next = "";
    for (const ch of s) next += rules[ch] ?? ch;
    s = next;
    if (s.length > 300_000) break; // safety valve; presets stay far below
  }
  return s;
}
