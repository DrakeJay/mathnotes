/* Small helpers for the classical-geometry demos. Everything here works in
   SCREEN coordinates — callers convert world→screen first and pass screen
   direction vectors (the y-flip doesn't matter to any of these). */

export type Vec = [number, number];

export function unit(v: Vec): Vec {
  const n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n, v[1] / n];
}

/** Unsigned angle between two vectors, in degrees. */
export function angleDeg(u: Vec, v: Vec): number {
  const nu = Math.hypot(u[0], u[1]);
  const nv = Math.hypot(v[0], v[1]);
  if (!nu || !nv) return 0;
  const cos = Math.min(1, Math.max(-1, (u[0] * v[0] + u[1] * v[1]) / (nu * nv)));
  return (Math.acos(cos) * 180) / Math.PI;
}

const ang = (v: Vec) => Math.atan2(v[1], v[0]);

/** Directed arc from screen angle a0, sweeping `sweep` radians. */
export function arcSweep(vx: number, vy: number, a0: number, sweep: number, radius: number): string {
  const n = Math.max(8, Math.ceil(Math.abs(sweep) / 0.12));
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (sweep * i) / n;
    parts.push(
      `${i === 0 ? "M" : "L"}${(vx + radius * Math.cos(a)).toFixed(1)},${(vy + radius * Math.sin(a)).toFixed(1)}`,
    );
  }
  return parts.join("");
}

/** Arc marking the (short-way) angle between directions dirA and dirB. */
export function arcAt(vx: number, vy: number, dirA: Vec, dirB: Vec, radius: number): string {
  const a0 = ang(dirA);
  let sweep = ang(dirB) - a0;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  while (sweep < -Math.PI) sweep += 2 * Math.PI;
  return arcSweep(vx, vy, a0, sweep, radius);
}

/** Small square marking a right angle between dirA and dirB at the vertex. */
export function rightAngleMark(vx: number, vy: number, dirA: Vec, dirB: Vec, size: number): string {
  const u = unit(dirA);
  const v = unit(dirB);
  return [
    `M${vx + u[0] * size},${vy + u[1] * size}`,
    `L${vx + (u[0] + v[0]) * size},${vy + (u[1] + v[1]) * size}`,
    `L${vx + v[0] * size},${vy + v[1] * size}`,
  ].join(" ");
}

/** A point along the bisector of dirA/dirB at `dist` — for angle labels. */
export function bisectorPoint(vx: number, vy: number, dirA: Vec, dirB: Vec, dist: number): Vec {
  const u = unit(dirA);
  const v = unit(dirB);
  const b = unit([u[0] + v[0], u[1] + v[1]]);
  return [vx + b[0] * dist, vy + b[1] * dist];
}
