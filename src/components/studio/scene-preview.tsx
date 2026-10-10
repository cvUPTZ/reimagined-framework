import { useId, useMemo } from 'react';
import { type Scene, type StudioProject } from '@/lib/studio';
import { phaseOf } from '@/lib/reference-project';
import { sceneMotion } from '@/lib/project-file';
import { evaluateMathExpression, computeSlope, generatePlotData } from '@/lib/math-engine';

export function ScenePreview({ project, scene, safeZones = false, miniature = false, elapsed }: { project: StudioProject; scene: Scene; playing?: boolean; safeZones?: boolean; miniature?: boolean; elapsed?: number }) {
  const id = useId().replaceAll(':', '');
  const portrait = project.format === 'portrait';
  const width = portrait ? 540 : 960;
  const height = portrait ? 960 : 540;
  const lines = scene.body.split('\n');
  const fontSize = scene.fontSize ?? 42;
  const fontFamily = scene.fontFamily ?? 'Space Grotesk';
  const fontWeight = scene.fontWeight ?? 600;
  const textAlign = scene.textAlign ?? 'center';
  const lineHeight = scene.lineHeight ?? 1.25;
  const textColor = scene.textColor ?? 'default';
  const visual = scene.visual ?? 'curve';
  const baseTitleY = (portrait ? 224 : 125) + (scene.textY ?? 0);
  const visualY = (portrait ? 380 : 238) + (scene.visualY ?? 0);
  const visualScale = (portrait ? 1 : .65) * (scene.visualScale ?? 1);
  const expressionY = (portrait ? 790 : 480) + (scene.expressionY ?? 0);
  const textX = textAlign === 'center' ? width / 2 : textAlign === 'left' ? (portrait ? 36 : 48) : width - (portrait ? 36 : 48);
  const textAnchor = textAlign === 'center' ? 'middle' : textAlign === 'left' ? 'start' : 'end';
  const motion = sceneMotion(scene, elapsed);
  const wipeWidth = Math.max(0, Math.min(width, width * motion.wipeProgress));
  const brandName = project.brandKit?.brandName ?? 'QED';
  const tagline = project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.';
  const footnote = project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING';
  const accentColor = project.brandKit?.accentColor;
  const logoSymbol = project.brandKit?.logoStyle === 'circle' ? '●' : project.brandKit?.logoStyle === 'minimal' ? '' : '∎';

  // Math expression normalization and plotting bounds
  const rawExpr = scene.expression ?? project.expression ?? 'x^2';
  const cleanExpr = rawExpr
    .replace(/^f\(x\)\s*=\s*/i, '')
    .replace(/^f′\(x\)\s*=\s*/i, '')
    .replace(/^f'\(x\)\s*=\s*/i, '')
    .trim() || 'x^2';

  const plotMinX = visual === 'wave' ? -3.14 : -3;
  const plotMaxX = visual === 'wave' ? 3.14 : 3;
  const plotMinY = visual === 'wave' ? -1.6 : visual === 'exponential' ? -0.5 : -2;
  const plotMaxY = visual === 'wave' ? 1.6 : visual === 'exponential' ? 12 : 8;

  const plotData = useMemo(() => {
    return generatePlotData(cleanExpr, {
      minX: plotMinX,
      maxX: plotMaxX,
      minY: plotMinY,
      maxY: plotMaxY,
      steps: 64,
      viewWidth: 390,
      viewHeight: 240,
    });
  }, [cleanExpr, plotMinX, plotMaxX, plotMinY, plotMaxY]);

  const curvePath = !plotData.hasError && plotData.points.length >= 2
    ? plotData.pathD
    : visual === 'wave'
      ? 'M 24 185 Q 66 100 110 185 T 195 185 T 280 185 T 366 185'
      : visual === 'exponential'
        ? 'M 20 183 Q 195 183 225 145 T 305 38'
        : 'M 80 45 Q 195 325 310 45';

  const progress = elapsed !== undefined && scene.duration > 0
    ? Math.max(0, Math.min(1, elapsed / scene.duration))
    : 0.5;

  // 3B1B Moving Tangent dynamic calculation
  const travelT = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const x0 = -1.8 + 3.6 * travelT;
  const y0Val = evaluateMathExpression(cleanExpr, x0).value;
  const y0 = isNaN(y0Val) ? 0 : y0Val;
  const slope = computeSlope(cleanExpr, x0);

  const ptX = ((x0 - plotMinX) / (plotMaxX - plotMinX)) * 390;
  const ptY = Math.max(15, Math.min(235, 240 - ((y0 - plotMinY) / (plotMaxY - plotMinY)) * 240));

  const scaleFactorY = 240 / (plotMaxY - plotMinY);
  const scaleFactorX = 390 / (plotMaxX - plotMinX);
  const pixelSlope = -slope * (scaleFactorY / scaleFactorX);
  const angle = Math.atan(isFinite(pixelSlope) ? pixelSlope : 0);
  const tLen = 75;
  const tx1 = ptX - tLen * Math.cos(angle);
  const ty1 = ptY - tLen * Math.sin(angle);
  const tx2 = ptX + tLen * Math.cos(angle);
  const ty2 = ptY + tLen * Math.sin(angle);

  // 3B1B Riemann Sums for Definite Integral
  const numBars = Math.min(24, Math.max(4, Math.floor(4 + progress * 16)));
  const intA = -1.6;
  const intB = 1.6;
  const stepW = (intB - intA) / numBars;
  const riemannBars = useMemo(() => {
    const bars: { x: number; y: number; width: number; height: number }[] = [];
    const barPxW = (stepW / (plotMaxX - plotMinX)) * 390;
    for (let i = 0; i < numBars; i++) {
      const barMidX = intA + i * stepW + stepW / 2;
      const barMidY = Math.max(0, evaluateMathExpression(cleanExpr, barMidX).value);
      const canvasLeft = ((intA + i * stepW - plotMinX) / (plotMaxX - plotMinX)) * 390;
      const canvasTop = 240 - ((barMidY - plotMinY) / (plotMaxY - plotMinY)) * 240;
      const axisY = 240 - ((0 - plotMinY) / (plotMaxY - plotMinY)) * 240;
      const h = Math.max(0, axisY - canvasTop);
      bars.push({ x: canvasLeft, y: canvasTop, width: barPxW, height: h });
    }
    return bars;
  }, [numBars, cleanExpr, plotMinX, plotMaxX, plotMinY, plotMaxY, stepW]);

  // 3B1B Harmonic Phasor Unit Circle for Trigonometric Wave
  const phasorCenter = 50;
  const phasorY = 185;
  const phasorR = 26;
  const phasorTheta = progress * Math.PI * 4;
  const phasorTipX = phasorCenter + phasorR * Math.cos(phasorTheta);
  const phasorTipY = phasorY - phasorR * Math.sin(phasorTheta);

  return <svg xmlns="http://www.w3.org/2000/svg" className={`scene-art ${miniature ? 'miniature-art' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={miniature ? scene.title : 'Math video preview'}>
    <defs>
      <pattern id={`grid-${id}`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" className="art-grid" fill="none"/></pattern>
      {motion.wipeProgress < 1 && <clipPath id={`wipe-${id}`}><rect x="0" y="0" width={wipeWidth} height={height}/></clipPath>}
      <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`riemannGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    <rect width={width} height={height} className="art-background"/>
    {(scene.showGrid ?? true) && <rect width={width} height={height} fill={`url(#grid-${id})`}/>}
    {(scene.showBrand ?? true) && <>
      <text x="34" y="48" className="art-brand">{brandName} {logoSymbol && <tspan className="art-accent" style={accentColor ? { fill: accentColor } : {}}>{logoSymbol}</tspan>}</text>
      <text x={width - 34} y="44" textAnchor="end" className="art-tagline">{tagline}</text>
    </>}
    <g className="art-content" opacity={motion.opacity} transform={`translate(${motion.offsetX} ${motion.offsetY}) scale(${motion.scale})`} style={{ transformOrigin: `${width / 2}px ${height / 2}px` }} {...(motion.wipeProgress < 1 ? { clipPath: `url(#wipe-${id})` } : {})}>
      {(scene.showPhase ?? true) && <text x={textX} y={baseTitleY - 48} textAnchor={textAnchor} className="art-phase">{phaseOf(scene).toUpperCase()}</text>}
      {(scene.showText ?? true) && <text x={textX} y={baseTitleY + 20} textAnchor={textAnchor} fontSize={fontSize} fontWeight={fontWeight} fontFamily={fontFamily} className={`art-title ${textColor !== 'default' ? `art-text-${textColor}` : ''}`} style={{ fontFamily: `${fontFamily}, sans-serif`, fontWeight }} direction={/[\u0600-\u06ff]/.test(scene.body) ? 'rtl' : 'ltr'}>{lines.slice(0, 4).map((line, i) => <tspan key={i} x={textX} dy={i ? fontSize * lineHeight : 0}>{line}</tspan>)}</text>}
      {(scene.showVisual ?? true) && visual !== 'none' && <g transform={`translate(${width / 2 - 195},${visualY}) scale(${visualScale})`}>
        {visual === 'number-line' ? (
          <g>
            {/* Original Zip BAC Excellence Number Line & Transformation */}
            <path d="M 20 140 H 370" className="art-axis"/>
            <path d="M 15 140 L 25 135 M 15 140 L 25 145 M 375 140 L 365 135 M 375 140 L 365 145" className="art-axis"/>
            {[0, 5, 10, 15, 20].map(n => <g key={n}><path d={`M${30 + n * 16.5} 133v14`} className="art-axis"/><text x={30 + n * 16.5} y="166" textAnchor="middle" className="art-axis-label">{n}</text></g>)}
            {/* Interval for (3 + 2) = 5 */}
            <rect x="30" y="112" width="82.5" height="24" rx="3" className="art-interval"/>
            <path d="M 30 106 H 112.5" className="art-bracket"/>
            <text x="71" y="96" textAnchor="middle" className="art-function" fontSize="12">(3 + 2) = 5</text>
            {/* Step to 20 */}
            <path d="M 112.5 125 Q 235 60 360 125" fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 3"/>
            <circle cx="360" cy="140" r="6" fill="var(--gold)" filter={`url(#glow-${id})`}/>
            <text x="240" y="70" textAnchor="middle" fill="var(--gold)" fontSize="13" fontWeight="bold">× 4</text>
            <text x="195" y="196" textAnchor="middle" className="art-function" fontSize="16" fontWeight="bold">5 × 4 = 20</text>
            {project.mistake && (
              <g transform="translate(195, 25)">
                <rect x="-160" y="-14" width="320" height="28" rx="4" fill="color-mix(in oklab, var(--coral) 15%, var(--background))" stroke="var(--coral)" strokeWidth="1"/>
                <text x="0" y="4" textAnchor="middle" fill="var(--coral)" fontSize="10" fontWeight="600" dir="auto">⚠ فخ شائع: {project.mistake}</text>
              </g>
            )}
          </g>
        ) : (
          <g>
            {/* 3Blue1Brown Coordinate Axes & Real Mathematical Curve */}
            <path d="M 0 185 H 390 M 195 24 V 258" className="art-axis"/>
            {[-3,-2,-1,0,1,2,3].map(n => <g key={n}><path d={`M${195 + n * 57} 180v10`} className="art-axis"/><text x={195 + n * 57} y="207" textAnchor="middle" className="art-axis-label">{n || ''}</text></g>)}
            <text x="204" y="18" className="art-axis-label">y</text><text x="400" y="190" className="art-axis-label">x</text>

            {/* 3B1B Riemann Sum Definite Integral */}
            {visual === 'integral' && (
              <g>
                {riemannBars.map((bar, idx) => (
                  <rect key={idx} x={bar.x} y={bar.y} width={bar.width} height={bar.height} className="art-riemann-bar" fill={`url(#riemannGrad-${id})`} stroke="var(--primary)" strokeWidth="1" />
                ))}
                <path d={curvePath} className="art-curve art-glow-line" fill="none" />
                <g transform="translate(195, 230)">
                  <rect x="-85" y="-12" width="170" height="20" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="1"/>
                  <text x="0" y="2" textAnchor="middle" fontSize="9" fill="var(--primary)" fontWeight="bold">N = {numBars} bars → ∫[-1.6, 1.6] f(x)dx</text>
                </g>
              </g>
            )}

            {/* 3B1B Harmonic Phasor Unit Circle Projection */}
            {visual === 'wave' && (
              <g>
                <circle cx={phasorCenter} cy={phasorY} r={phasorR} stroke="var(--border)" fill="none" strokeWidth="1.2"/>
                <line x1={phasorCenter} y1={phasorY} x2={phasorTipX} y2={phasorTipY} stroke="var(--blue)" strokeWidth="2.5"/>
                <circle cx={phasorTipX} cy={phasorTipY} r="3" fill="var(--blue)"/>
                <line x1={phasorTipX} y1={phasorTipY} x2="380" y2={phasorTipY} className="art-laser" strokeDasharray="3 3"/>
                <text x={phasorCenter} y="148" textAnchor="middle" fontSize="8" fill="var(--muted-foreground)">e^(iθ)</text>
              </g>
            )}

            {/* Main Mathematical Function Curve */}
            {visual !== 'integral' && (
              <path d={curvePath} className={`art-curve ${visual === 'wave' ? 'art-wave' : visual === 'exponential' ? 'art-exponential' : ''}`} fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.draw} filter={`url(#glow-${id})`}/>
            )}

            {/* 3B1B Dynamic Sliding Tangent Line & Real Derivative Readout */}
            {visual === 'tangent' && (
              <g>
                {/* Projection drop lines */}
                <line x1={ptX} y1={ptY} x2={ptX} y2="185" className="art-laser" strokeDasharray="3 3"/>
                <line x1={ptX} y1={ptY} x2="195" y2={ptY} className="art-laser" strokeDasharray="3 3"/>
                {/* Tangent line */}
                <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--blue)" strokeWidth="2.5" strokeDasharray="6 3" filter={`url(#glow-${id})`}/>
                {/* Tangent point with pulsing halo */}
                <circle cx={ptX} cy={ptY} r="8" className="art-point-halo" fill="color-mix(in oklab, var(--blue) 35%, transparent)"/>
                <circle cx={ptX} cy={ptY} r="4" fill="#ffffff"/>
                {/* Real-time Calculus HUD */}
                <g transform={`translate(${Math.max(75, Math.min(315, ptX))}, ${Math.max(35, ptY - 24)})`}>
                  <rect x="-68" y="-12" width="136" height="20" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1"/>
                  <text x="0" y="2" textAnchor="middle" className="art-hud-text" fontSize="9" fill="var(--foreground)">
                    x={x0.toFixed(2)} · f'={slope.toFixed(2)}
                  </text>
                </g>
              </g>
            )}

            {visual === 'exponential' && <circle cx="195" cy="165" r="4" className="art-point"/>}

            <text x="275" y="66" className="art-function">
              {visual === 'wave' ? 'f(x) = sin(x)' : visual === 'exponential' ? 'f(x) = eˣ' : visual === 'integral' ? '∫[a,b] f(x)dx' : visual === 'tangent' ? `f'(x) = ${slope.toFixed(2)}` : (cleanExpr ? `f(x) = ${cleanExpr}` : 'f(x) = x²')}
            </text>
          </g>
        )}
      </g>}
      {(scene.showExpression ?? true) && (scene.expression ?? project.expression) && <text x={width / 2} y={expressionY} textAnchor="middle" className="art-expression">{scene.expression ?? project.expression}</text>}
    </g>
    {safeZones && <rect x={width * .08} y={height * .07} width={width * .84} height={height * .81} className="art-safe"/>}
    {(scene.showFootnote ?? true) && <>
      <text x="34" y={height - 30} className="art-footnote">{footnote}</text>
      <text x={width - 34} y={height - 30} textAnchor="end" className="art-footnote">{scene.label} / {String(project.scenes.length).padStart(2, '0')}</text>
    </>}
  </svg>;
}
