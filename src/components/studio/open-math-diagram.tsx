import { useId } from 'react';
import { computeSlope, evaluateMathExpression, extractPlottableExpression, generatePlotData } from '@/lib/math-engine';
import { clipDiagramLine, diagramReveal, openDiagramPath, type DiagramPoint } from '@/lib/diagram-geometry';
import type { Scene } from '@/lib/studio';

const bounds = { left: 18, top: 48, right: 372, bottom: 292 };
const green = 'var(--primary)', gold = 'var(--gold)', ink = 'var(--foreground)';

/** Unframed, scene-local artwork shared by the editor, thumbnails and downloads. */
export function OpenMathDiagram({ visual, expression, elapsed, duration }: {
  visual: Scene['visual']; expression: string; elapsed: number; duration: number;
}) {
  const clipId = `open-math-${useId().replaceAll(':', '')}`;
  const barCount = 4 + Math.floor(20 * Math.max(0, Math.min(1, elapsed / Math.max(0.5, duration))));
  const curveQ = diagramReveal(elapsed, duration);
  const pointQ = diagramReveal(elapsed, duration, 0.22);
  const tangentQ = diagramReveal(elapsed, duration, 0.36);
  const annotationQ = diagramReveal(elapsed, duration, 0.5);
  const u = Math.max(0, Math.min(1, elapsed / Math.max(0.5, duration)));
  const expr = visual === 'wave' ? 'sin(x)' : extractPlottableExpression(expression);
  const exponential = visual === 'exponential' || expr.startsWith('exp(');
  const logarithm = expr.startsWith('ln(') || expr.startsWith('log(');
  const minX = logarithm ? 0.05 : -3, maxX = logarithm ? 6 : 3;
  const minY = visual === 'wave' ? -1.5 : exponential ? -0.5 : logarithm ? -3 : -2;
  const maxY = visual === 'wave' ? 1.5 : exponential ? 12 : logarithm ? 3 : 8;
  const X = (x: number) => bounds.left + (x - minX) / (maxX - minX) * (bounds.right - bounds.left);
  const Y = (y: number) => bounds.bottom - (y - minY) / (maxY - minY) * (bounds.bottom - bounds.top);
  const axisX = X(Math.max(minX, 0)), axisY = Y(0);
  const plot = generatePlotData(expr, { minX, maxX, minY, maxY, steps: 120 });
  const samples: Array<DiagramPoint | null> = plot.points.map(p => [X(p.x), Y(p.y)]);
  // A missing domain sample breaks the path rather than bridging an asymptote.
  for (let i = plot.points.length - 1; i > 0; i--) {
    const current = plot.points[i], previous = plot.points[i - 1];
    if (current && previous && (current.x - previous.x > (maxX - minX) / 100 || Math.abs(Y(current.y) - Y(previous.y)) > 400)) samples.splice(i, 0, null);
  }
  const path = openDiagramPath(samples, bounds);
  const x0 = minX + (maxX - minX) * (0.3 + 0.4 * u);
  const evaluated = evaluateMathExpression(expr, x0), y0 = evaluated.value;
  const px = X(x0), py = Y(y0), slope = computeSlope(expr, x0);
  const pointVisible = !evaluated.error && py >= bounds.top && py <= bounds.bottom;
  const tangent = clipDiagramLine([X(minX), Y(y0 + slope * (minX - x0))], [X(maxX), Y(y0 + slope * (maxX - x0))], bounds);
  const rightX = x0 + 0.65, riseY = y0 + slope * 0.65;
  const labelX = Math.max(68, Math.min(320, px));

  if (visual === 'number-line') {
    const pos = 5 + 15 * Math.min(1, u / 0.75), N = (n: number) => 24 + n * 17;
    return <g>
      <path d="M24 180 H370 M362 175 L370 180 L362 185" fill="none" stroke="var(--axis)" strokeWidth={2}/>
      {[0, 5, 10, 15, 20].map(n => <g key={n}><path d={`M${N(n)} 174v12`} stroke="var(--axis)"/><text x={N(n)} y={208} textAnchor="middle" fill={ink} fontSize={16}>{n}</text></g>)}
      <path d="M24 154H109" stroke={green} fill="none" strokeWidth={3} opacity={curveQ}/>
      <text x={67} y={132} textAnchor="middle" fontSize={17} fill={green} opacity={curveQ}>(3 + 2) = 5</text>
      <path d="M109 168 Q236 56 364 168" fill="none" stroke={gold} strokeWidth={2.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - tangentQ}/>
      <circle cx={N(pos)} cy={180 - Math.sin((pos - 5) / 15 * Math.PI) * 56} r={6} fill={gold} opacity={pointQ}/>
      <text x={236} y={78} textAnchor="middle" fill={gold} fontSize={18} opacity={annotationQ}>× 4</text>
      <text x={195} y={266} textAnchor="middle" fill={ink} fontSize={20} opacity={annotationQ}>5 × 4 = 20</text>
    </g>;
  }

  return <g fontFamily="Tajawal, Space Grotesk, sans-serif">
    <defs><clipPath id={clipId}><rect x={bounds.left} y={bounds.top} width={bounds.right - bounds.left} height={bounds.bottom - bounds.top}/></clipPath></defs>
    <path d={`M${bounds.left} ${axisY}H${bounds.right} M${bounds.right - 7} ${axisY - 4}L${bounds.right} ${axisY}L${bounds.right - 7} ${axisY + 4} M${axisX} ${bounds.bottom}V${bounds.top} M${axisX - 4} ${bounds.top + 7}L${axisX} ${bounds.top}L${axisX + 4} ${bounds.top + 7}`} fill="none" stroke="var(--axis)" strokeWidth={1.6}/>
    <text x={bounds.right - 4} y={axisY - 12} textAnchor="end" fill={ink} fontSize={17}>x</text>
    <text x={axisX + 14} y={bounds.top + 8} fill={ink} fontSize={17}>y</text>
    {[-2, -1, 1, 2, 4].filter(x => x > minX && x < maxX).map(x => <g key={x}><path d={`M${X(x)} ${axisY - 4}v8`} stroke="var(--axis)"/><text x={X(x)} y={axisY + 22} textAnchor="middle" fill="var(--muted-foreground)" fontSize={14}>{x}</text></g>)}
    <g clipPath={`url(#${clipId})`}>
      {visual === 'integral' && Array.from({ length: barCount }, (_, i) => {
        const dx = 3.2 / barCount, x = -1.6 + i * dx;
        const value = evaluateMathExpression(expr, x + dx / 2);
        if (value.error) return null;
        return <rect key={i} x={X(x)} y={Math.min(Y(value.value), axisY)} width={X(x + dx) - X(x)} height={Math.abs(Y(value.value) - axisY)} fill="color-mix(in oklab, var(--primary) 18%, transparent)" stroke={gold} strokeWidth={1} opacity={tangentQ}/>;
      })}
      <path d={path} fill="none" stroke={green} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - curveQ} className="art-glow-line"/>
      {visual === 'tangent' && tangent && <line x1={tangent[0][0]} y1={tangent[0][1]} x2={tangent[1][0]} y2={tangent[1][1]} stroke={gold} strokeWidth={2.6} opacity={tangentQ} className="art-glow-gold"/>}
      {visual === 'tangent' && pointVisible && <g opacity={annotationQ}>
        <path d={`M${px} ${py}H${X(rightX)}`} stroke={green} strokeWidth={2.2} fill="none"/>
        <path d={`M${X(rightX)} ${py}V${Y(riseY)}`} stroke={gold} strokeWidth={2.2} fill="none"/>
      </g>}
      {pointVisible && visual !== 'integral' && <circle cx={px} cy={py} r={5.5} fill={gold} opacity={pointQ}/>}
    </g>
    {visual === 'tangent' && pointVisible && <g opacity={annotationQ}>
      <text x={(px + X(rightX)) / 2} y={Math.min(316, py + 24)} textAnchor="middle" fill={green} fontSize={16}>Δx</text>
      <text x={Math.min(356, X(rightX) + 18)} y={Math.max(70, Math.min(276, (py + Y(riseY)) / 2))} textAnchor="middle" fill={gold} fontSize={16}>Δy</text>
      <text x={195} y={26} textAnchor="middle" fill={gold} fontSize={20}>f′({x0.toFixed(1)}) = {slope.toFixed(2)}</text>
    </g>}
    {visual === 'curve' && pointVisible && <text x={labelX} y={Math.max(72, py - 22)} textAnchor="middle" fill={gold} fontSize={17} opacity={annotationQ}>({x0.toFixed(1)}, {y0.toFixed(1)})</text>}
    <text x={195} y={350} textAnchor="middle" fill={visual === 'tangent' ? gold : green} fontSize={18} opacity={annotationQ}>
      {visual === 'tangent' ? 'f′(x₀) = Δy / Δx' : visual === 'integral' ? 'Σ f(xᵢ) Δx → ∫ f(x) dx' : `f(x) = ${expr}`}
    </text>
  </g>;
}