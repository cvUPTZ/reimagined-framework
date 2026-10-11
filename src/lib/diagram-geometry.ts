export type DiagramPoint = readonly [number, number];
export interface DiagramBounds { left: number; top: number; right: number; bottom: number }
export const DIAGRAM_BOUNDS: DiagramBounds = { left: 10, top: 48, right: 380, bottom: 326 };

/** Liang–Barsky clipping preserves slope rather than clamping endpoints independently. */
export function clipDiagramLine(start: DiagramPoint, end: DiagramPoint, bounds = DIAGRAM_BOUNDS): [DiagramPoint, DiagramPoint] | null {
  if (![...start, ...end].every(Number.isFinite)) return null;
  const dx = end[0] - start[0], dy = end[1] - start[1];
  let lo = 0, hi = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [start[0] - bounds.left, bounds.right - start[0], start[1] - bounds.top, bounds.bottom - start[1]];
  for (let i = 0; i < 4; i++) {
    const pi = p[i], qi = q[i];
    if (pi === undefined || qi === undefined) return null;
    if (pi === 0) { if (qi < 0) return null; continue; }
    const ratio = qi / pi;
    if (pi < 0) lo = Math.max(lo, ratio); else hi = Math.min(hi, ratio);
    if (lo > hi) return null;
  }
  return [[start[0] + lo * dx, start[1] + lo * dy], [start[0] + hi * dx, start[1] + hi * dy]];
}

export function diagramReveal(elapsed: number, duration: number, delay = 0): number {
  const u = Math.max(0, Math.min(1, (elapsed / Math.max(0.5, duration) - delay) / 0.28));
  return u * u * (3 - 2 * u);
}

/** Split discontinuities and clip each segment without closing a mathematical curve. */
export function openDiagramPath(points: ReadonlyArray<DiagramPoint | null>, bounds = DIAGRAM_BOUNDS): string {
  const commands: string[] = [];
  let previous: DiagramPoint | undefined;
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1], end = points[i];
    const segment = start && end ? clipDiagramLine(start, end, bounds) : null;
    if (!segment) { previous = undefined; continue; }
    const [from, to] = segment;
    if (!previous || Math.abs(previous[0] - from[0]) > 0.01 || Math.abs(previous[1] - from[1]) > 0.01) commands.push(`M ${from.join(' ')}`);
    commands.push(`L ${to.join(' ')}`);
    previous = to;
  }
  return commands.join(' ');
}