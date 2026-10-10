import { useEffect, useId, useMemo, useState } from 'react';
import { type Scene, type StudioProject } from '@/lib/studio';
import { phaseOf } from '@/lib/reference-project';
import { sceneMotion } from '@/lib/project-file';
import { evaluateMathExpression, computeSlope, generatePlotData, extractPlottableExpression } from '@/lib/math-engine';
import { hasLegacyRenderer, renderLegacyVisual, type VisualParams, type VisualStage } from '@/lib/legacy-visuals';
import { TELEGRAM_QR_SRC, TELEGRAM_BOT_HANDLE, TELEGRAM_BOT_URL } from '@/assets/telegram-qr';

/**
 * Intelligent text-wrapping helper that respects word boundaries, punctuation,
 * and maximum line length for Arabic and multilingual typography.
 */
export function wrapSceneText(text: string, maxChars = 32): string[] {
  if (!text) return [];
  const rawLines = text.split('\n');
  const result: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxChars) {
      result.push(trimmed);
      continue;
    }

    const words = trimmed.split(/\s+/);
    let cur = '';
    for (const w of words) {
      if (!cur) {
        cur = w;
      } else if ((cur + ' ' + w).length <= maxChars) {
        cur += ' ' + w;
      } else {
        result.push(cur);
        cur = w;
      }
    }
    if (cur) result.push(cur);
  }
  return result;
}

export function ScenePreview({
  project,
  scene,
  playing = false,
  safeZones = false,
  miniature = false,
  elapsed,
}: {
  project: StudioProject;
  scene: Scene;
  playing?: boolean;
  safeZones?: boolean;
  miniature?: boolean;
  elapsed?: number;
}) {
  const id = useId().replaceAll(':', '');
  const portrait = project.format === 'portrait';
  const width = portrait ? 540 : 960;
  const height = portrait ? 960 : 540;
  const isArabic = /[\u0600-\u06ff]/.test(scene.body) || /[\u0600-\u06ff]/.test(scene.title);

  // Responsive font sizing & intelligent multi-line wrapping:
  // prevents wide sentences from overflowing the canvas bounds or truncating.
  const baseSize = scene.fontSize ?? 42;
  const bodyLen = scene.body?.trim().length ?? 0;
  const maxLineLen = Math.max(...(scene.body || '').split('\n').map(l => l.trim().length), 0);

  // Scale down font size smoothly if text is long or single line is wide
  const fontSize = portrait
    ? (maxLineLen > 48 || bodyLen > 75)
      ? Math.min(baseSize, 28)
      : (maxLineLen > 32 || bodyLen > 45)
        ? Math.min(baseSize, 33)
        : baseSize
    : (maxLineLen > 65 || bodyLen > 90)
      ? Math.min(baseSize, 30)
      : baseSize;

  const maxCharsPerLine = portrait
    ? fontSize <= 30 ? 36 : fontSize <= 35 ? 30 : 25
    : fontSize <= 30 ? 55 : 44;

  const lines = useMemo(() => wrapSceneText(scene.body, maxCharsPerLine), [scene.body, maxCharsPerLine]);

  const fontFamily = scene.fontFamily ?? (isArabic ? 'Tajawal' : 'Space Grotesk');
  const fontWeight = scene.fontWeight ?? 600;
  const textAlign = scene.textAlign ?? 'center';
  const lineHeight = scene.lineHeight ?? 1.25;
  const textColor = scene.textColor ?? 'default';
  const visual = scene.visual ?? 'curve';

  // Dynamic vertical layout: when lines increase, push title slightly up and visual card down
  // ensuring zero overlap between Arabic title text and visual intuition cards
  const textLineCount = lines.length || 1;
  const extraLines = Math.max(0, textLineCount - 2);
  const titleOffset = extraLines * (fontSize * 0.4);
  const visualPush = extraLines * (fontSize * 0.9);

  const baseTitleY = (portrait ? 218 : 120) + (scene.textY ?? 0) - (portrait ? titleOffset : 0);
  const visualY = (portrait ? 376 : 230) + (scene.visualY ?? 0) + (portrait ? visualPush : 0);
  const visualScale = (portrait ? 1 : 0.68) * (scene.visualScale ?? 1);
  const expressionY = (portrait ? 795 : 485) + (scene.expressionY ?? 0);
  const textX = textAlign === 'center' ? width / 2 : textAlign === 'left' ? (portrait ? 36 : 48) : width - (portrait ? 36 : 48);
  const textAnchor = textAlign === 'center' ? 'middle' : textAlign === 'left' ? 'start' : 'end';
  const legacyModel = typeof scene.legacy?.['visualModel'] === 'string' ? (scene.legacy['visualModel'] as string) : '';

  // Ambient continuous clock for studio canvas (skipped in miniature & SSR)
  const [ambientSec, setAmbientSec] = useState(0);
  useEffect(() => {
    if (miniature) return;
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      setAmbientSec((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [miniature]);
  // Unify timeline playback, manual scrubbing, and ambient idle animation
  const isScrubbingOrPlaying = playing || (elapsed !== undefined && elapsed > 0);
  const animTime = isScrubbingOrPlaying
    ? (elapsed ?? 0)
    : miniature
      ? (scene.duration || 5) * 0.4
      : (ambientSec * 0.85) % (scene.duration || 5);

  const legacyNode = legacyModel && hasLegacyRenderer(legacyModel)
    ? renderLegacyVisual({ model: legacyModel, params: scene.legacy?.['visualParams'] as VisualParams | undefined, stage: scene.legacy?.['visualStage'] as VisualStage | undefined, elapsed: animTime, duration: scene.duration })
    : null;

  const progress = scene.duration > 0
    ? Math.max(0, Math.min(1, animTime / scene.duration))
    : 0.5;

  const motion = sceneMotion(scene, isScrubbingOrPlaying ? elapsed : undefined);
  const wipeWidth = Math.max(0, Math.min(width, width * motion.wipeProgress));
  const brandName = project.brandKit?.brandName ?? 'QED';
  const tagline = project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.';
  const footnote = project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING';
  const accentColor = project.brandKit?.accentColor;
  const logoSymbol = project.brandKit?.logoStyle === 'circle' ? '●' : project.brandKit?.logoStyle === 'minimal' ? '' : '∎';

  // Math expression normalization and plotting bounds
  const rawExpr = scene.expression ?? project.expression ?? 'x^2';
  const cleanExpr = extractPlottableExpression(rawExpr);
  const isExp = visual === 'exponential' || cleanExpr.startsWith('exp(');
  const isLn = cleanExpr.startsWith('ln(');

  const plotMinX = visual === 'wave' ? -3.14 : isLn ? 0.05 : -3;
  const plotMaxX = visual === 'wave' ? 3.14 : isLn ? 4.5 : 3;
  const plotMinY = visual === 'wave' ? -1.6 : isExp ? -0.5 : isLn ? -3.5 : -2.5;
  const plotMaxY = visual === 'wave' ? 1.6 : isExp ? 12 : isLn ? 3.5 : 7.5;

  // 1. Static/Base Curve Plot Data
  const basePlotData = useMemo(() => {
    return generatePlotData(cleanExpr, {
      minX: plotMinX,
      maxX: plotMaxX,
      minY: plotMinY,
      maxY: plotMaxY,
      steps: 72,
      viewWidth: 390,
      viewHeight: 240,
    });
  }, [cleanExpr, plotMinX, plotMaxX, plotMinY, plotMaxY]);

  // 2. Dynamic 3B1B Traveling Sine Wave (propagating through space)
  const waveSpeed = 2.5;
  const wavePhase = (animTime * waveSpeed) % (Math.PI * 2);
  const wavePlotPath = useMemo(() => {
    if (visual !== 'wave') return '';
    let d = '';
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const xMath = plotMinX + (i / steps) * (plotMaxX - plotMinX);
      const yMath = Math.sin(xMath - wavePhase);
      const cx = ((xMath - plotMinX) / (plotMaxX - plotMinX)) * 390;
      const cy = 240 - ((yMath - plotMinY) / (plotMaxY - plotMinY)) * 240;
      d += i === 0 ? `M ${cx.toFixed(1)} ${cy.toFixed(1)}` : ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }
    return d;
  }, [visual, plotMinX, plotMaxX, plotMinY, plotMaxY, wavePhase]);

  const curvePath = visual === 'wave' && wavePlotPath
    ? wavePlotPath
    : (!basePlotData.hasError && basePlotData.points.length >= 2)
      ? basePlotData.pathD
      : visual === 'exponential'
        ? 'M 20 183 Q 195 183 225 145 T 305 38'
        : 'M 80 45 Q 195 325 310 45';

  // 3. 3B1B Tangent calculus calculations
  const travelT = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const x0 = -1.85 + 3.7 * travelT;
  const y0Val = evaluateMathExpression(cleanExpr, x0).value;
  const y0 = isNaN(y0Val) ? 0 : y0Val;
  const slope = computeSlope(cleanExpr, x0);

  const ptX = ((x0 - plotMinX) / (plotMaxX - plotMinX)) * 390;
  const ptY = Math.max(15, Math.min(225, 240 - ((y0 - plotMinY) / (plotMaxY - plotMinY)) * 240));

  const scaleFactorY = 240 / (plotMaxY - plotMinY);
  const scaleFactorX = 390 / (plotMaxX - plotMinX);
  const pixelSlope = -slope * (scaleFactorY / scaleFactorX);
  const angle = Math.atan(isFinite(pixelSlope) ? pixelSlope : 0);
  const tLen = 95;
  const tx1 = ptX - tLen * Math.cos(angle);
  const ty1 = ptY - tLen * Math.sin(angle);
  const tx2 = ptX + tLen * Math.cos(angle);
  const ty2 = ptY + tLen * Math.sin(angle);

  // Slope Triangle (Delta X & Delta Y)
  const dxMath = 0.75;
  const dxPx = (dxMath / (plotMaxX - plotMinX)) * 390;
  const dyMath = slope * dxMath;
  const dyPx = -dyMath * scaleFactorY;

  // 4. 3B1B Riemann Sums for Definite Integral
  const riemannCycle = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const numBars = Math.min(28, Math.max(4, Math.floor(4 + riemannCycle * 24)));
  const intA = -1.6;
  const intB = 1.6;
  const stepW = (intB - intA) / numBars;
  const riemannBars = useMemo(() => {
    const bars: { x: number; y: number; width: number; height: number; midVal: number }[] = [];
    const barPxW = (stepW / (plotMaxX - plotMinX)) * 390;
    for (let i = 0; i < numBars; i++) {
      const barMidX = intA + i * stepW + stepW / 2;
      const barMidY = Math.max(0, evaluateMathExpression(cleanExpr, barMidX).value);
      const canvasLeft = ((intA + i * stepW - plotMinX) / (plotMaxX - plotMinX)) * 390;
      const canvasTop = 240 - ((barMidY - plotMinY) / (plotMaxY - plotMinY)) * 240;
      const axisY = 240 - ((0 - plotMinY) / (plotMaxY - plotMinY)) * 240;
      const h = Math.max(0, axisY - canvasTop);
      bars.push({ x: canvasLeft, y: canvasTop, width: barPxW, height: h, midVal: barMidY });
    }
    return bars;
  }, [numBars, cleanExpr, plotMinX, plotMaxX, plotMinY, plotMaxY, stepW]);

  // 5. 3B1B Complex Phasor Unit Circle for Trigonometry
  const phasorCenter = 50;
  const phasorY = 185;
  const phasorR = 26;
  const phasorTheta = wavePhase;
  const phasorTipX = phasorCenter + phasorR * Math.cos(phasorTheta);
  const phasorTipY = phasorY - phasorR * Math.sin(phasorTheta);
  const waveContactY = 240 - ((Math.sin(0 - wavePhase) - plotMinY) / (plotMaxY - plotMinY)) * 240;

  // 6. Number Line Animated Calculations
  const numLineCycle = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const jumpStartX = 112.5;
  const jumpEndX = 360;
  const jumpBeadX = jumpStartX + (jumpEndX - jumpStartX) * numLineCycle;
  const jumpBeadY = 140 - Math.sin(numLineCycle * Math.PI) * 75;

  // 7. Curve Traveling Probe Point
  const curveProbeT = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const curveProbeX = -2.5 + 5.0 * curveProbeT;
  const curveProbeYVal = evaluateMathExpression(cleanExpr, curveProbeX).value;
  const curveProbeY = isNaN(curveProbeYVal) ? 0 : curveProbeYVal;
  const probePxX = ((curveProbeX - plotMinX) / (plotMaxX - plotMinX)) * 390;
  const probePxY = Math.max(15, Math.min(225, 240 - ((curveProbeY - plotMinY) / (plotMaxY - plotMinY)) * 240));

  // 8. Local Extrema and Zero Detection for Curve
  const extremaPoints = useMemo(() => {
    if (visual !== 'curve' || basePlotData.points.length < 5) return [];
    const res: { x: number; y: number; canvasX: number; canvasY: number; type: 'max' | 'min' }[] = [];
    for (let i = 2; i < basePlotData.points.length - 2; i++) {
      const prev = basePlotData.points[i - 1]!;
      const curr = basePlotData.points[i]!;
      const next = basePlotData.points[i + 1]!;
      if (curr.y > prev.y && curr.y > next.y && curr.y > 0.5) {
        res.push({ x: curr.x, y: curr.y, canvasX: curr.canvasX, canvasY: curr.canvasY, type: 'max' });
      } else if (curr.y < prev.y && curr.y < next.y && curr.y < 5) {
        res.push({ x: curr.x, y: curr.y, canvasX: curr.canvasX, canvasY: curr.canvasY, type: 'min' });
      }
    }
    return res;
  }, [visual, basePlotData.points]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`scene-art ${miniature ? 'miniature-art' : ''} ${playing ? 'is-playing' : 'is-idle'} animation-${(scene.animation ?? 'Fade').toLowerCase().replaceAll(' ', '-')}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={miniature ? scene.title : 'Math video preview'}
    >
      <defs>
        {/* Luminous 3B1B Bloom Filters */}
        <filter id={`neonGlow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`softBloom-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Multi-Colored Gradients */}
        <linearGradient id={`curveGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id={`tangentGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={`riemannGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`areaGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
        </linearGradient>

        {/* Markers */}
        <marker id={`arrowX-${id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--axis)" />
        </marker>
        <marker id={`arrowY-${id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--axis)" />
        </marker>

        {/* Coordinate Grid Pattern */}
        <pattern id={`grid-${id}`} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" className="art-grid" fill="none" opacity="0.6" />
          <circle cx="30" cy="30" r="0.6" fill="var(--border-strong)" opacity="0.5" />
        </pattern>
        {motion.wipeProgress < 1 && (
          <clipPath id={`wipe-${id}`}>
            <rect x="0" y="0" width={wipeWidth} height={height} />
          </clipPath>
        )}
      </defs>

      <rect width={width} height={height} className="art-background" />
      {(scene.showGrid ?? true) && <rect width={width} height={height} fill={`url(#grid-${id})`} />}

      {/* Brand Watermark & Tagline */}
      {(scene.showBrand ?? true) && (
        <>
          <text x="34" y="48" className="art-brand">
            {brandName}{' '}
            {logoSymbol && (
              <tspan className="art-accent" style={accentColor ? { fill: accentColor } : {}}>
                {logoSymbol}
              </tspan>
            )}
          </text>
          <text x={width - 94} y="44" textAnchor="end" className="art-tagline" dir="auto">
            {tagline}
          </text>
        </>
      )}

      <g
        className="art-content"
        opacity={motion.opacity}
        transform={`translate(${motion.offsetX} ${motion.offsetY}) scale(${motion.scale})`}
        style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
        {...(motion.wipeProgress < 1 ? { clipPath: `url(#wipe-${id})` } : {})}
      >
        {/* Phase Header */}
        {(scene.showPhase ?? true) && (
          <text x={textX} y={baseTitleY - 48} textAnchor={textAnchor} className="art-phase" dir="auto">
            {phaseOf(scene).toUpperCase()}
          </text>
        )}

        {/* Main Text Content */}
        {(scene.showText ?? true) && (
          <text
            x={textX}
            y={baseTitleY + 20}
            textAnchor={textAnchor}
            fontSize={fontSize}
            fontWeight={fontWeight}
            fontFamily={fontFamily}
            className={`art-title ${textColor !== 'default' ? `art-text-${textColor}` : ''}`}
            style={{ fontFamily: `${fontFamily}, sans-serif`, fontWeight, unicodeBidi: 'plaintext' }}
            direction={isArabic ? 'rtl' : 'ltr'}
          >
            {lines.slice(0, 5).map((line, i) => (
              <tspan key={i} x={textX} dy={i ? fontSize * lineHeight : 0} textAnchor={textAnchor} dir="auto">
                {line}
              </tspan>
            ))}
          </text>
        )}

        {/* Sophisticated 3Blue1Brown Math Models */}
        {(scene.showVisual ?? true) && legacyNode && (
          <g transform={`translate(${width / 2 - 195},${visualY - 20}) scale(${visualScale})`}>{legacyNode}</g>
        )}
        {(scene.showVisual ?? true) && !legacyNode && visual !== 'none' && (
          <g transform={`translate(${width / 2 - 195},${visualY}) scale(${visualScale})`}>
            {visual === 'number-line' ? (
              <g>
                {/* 3B1B Number Line & BAC Priority Hierarchy in Arabic */}
                <path d="M 15 140 H 375" className="art-axis" markerEnd={`url(#arrowX-${id})`} />
                <path d="M 15 140 L 25 135 M 15 140 L 25 145" className="art-axis" />
                {[0, 5, 10, 15, 20].map(n => (
                  <g key={n}>
                    <path d={`M${30 + n * 16.5} 133v14`} className="art-axis" />
                    <text x={30 + n * 16.5} y="166" textAnchor="middle" className="art-axis-label" fontWeight="600">
                      {n}
                    </text>
                  </g>
                ))}

                {/* Sub-ticks */}
                {[1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19].map(n => (
                  <path key={n} d={`M${30 + n * 16.5} 137v6`} className="art-axis-subtick" />
                ))}

                {/* Interval for (3 + 2) = 5 */}
                <rect x="30" y="112" width="82.5" height="24" rx="4" className="art-interval" filter={`url(#softBloom-${id})`} />
                <path d="M 30 106 H 112.5" className="art-bracket" />
                <text x="71" y="94" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">
                  (3 + 2) = 5
                </text>
                <text x="71" y="80" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8" dir="auto">
                  الأولوية 1: القوس أولاً
                </text>

                {/* Animated Jump Arc: Multiply by 4 */}
                <path d="M 112.5 125 Q 235 55 360 125" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6 4" filter={`url(#softBloom-${id})`} />
                <circle cx="360" cy="140" r="7" fill="#fbbf24" filter={`url(#neonGlow-${id})`} />
                <circle cx="360" cy="140" r="14" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className="art-point-halo" />

                {/* Flying Jump Bead along the arc */}
                <circle cx={jumpBeadX} cy={jumpBeadY} r="6.5" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" filter={`url(#neonGlow-${id})`} />

                <g transform="translate(235, 65)">
                  <rect x="-35" y="-12" width="70" height="20" rx="4" fill="var(--surface)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="0" y="2" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">
                    × 4 (الضرب)
                  </text>
                </g>

                {/* Target 20 Banner (glows as bead arrives) */}
                <g transform="translate(195, 200)">
                  <rect x="-95" y="-14" width="190" height="28" rx="5" fill="var(--surface)" stroke={numLineCycle > 0.6 ? '#34d399' : 'var(--primary)'} strokeWidth={numLineCycle > 0.6 ? 2 : 1.2} filter={numLineCycle > 0.6 ? `url(#softBloom-${id})` : undefined} />
                  <text x="0" y="4" textAnchor="middle" fill={numLineCycle > 0.6 ? '#34d399' : 'var(--primary)'} fontSize="14" fontWeight="bold">
                    5 × 4 = 20 (الناتج الصحيح)
                  </text>
                </g>

                {/* Misconception Alert Banner in Arabic */}
                {project.mistake && (
                  <g transform="translate(195, 25)">
                    <rect x="-175" y="-14" width="350" height="28" rx="5" fill="color-mix(in oklab, var(--coral) 16%, var(--surface))" stroke="var(--coral)" strokeWidth="1.2" filter={`url(#softBloom-${id})`} />
                    <text x="0" y="4" textAnchor="middle" fill="var(--coral)" fontSize="10.5" fontWeight="600" dir="auto">
                      ⚠ فخ شائع: {project.mistake}
                    </text>
                  </g>
                )}
              </g>
            ) : (
              <g>
                {/* 3Blue1Brown High-Precision Coordinate System */}
                <path d="M 0 185 H 390" className="art-axis" markerEnd={`url(#arrowX-${id})`} />
                <path d="M 195 24 V 258" className="art-axis" markerStart={`url(#arrowY-${id})`} />

                {/* Ticks and Sub-ticks */}
                {[-3, -2, -1, 1, 2, 3].map(n => (
                  <g key={n}>
                    <path d={`M${195 + n * 57} 180v10`} className="art-axis" />
                    <text x={195 + n * 57} y="206" textAnchor="middle" className="art-axis-label" fontWeight="500">
                      {n}
                    </text>
                  </g>
                ))}

                {/* Origin Marker */}
                <circle cx="195" cy="185" r="3" className="art-origin-dot" />
                <text x="186" y="201" textAnchor="end" fontSize="8" fill="var(--muted-foreground)">
                  O(0,0)
                </text>

                {/* Axis Labels in Arabic and Latin */}
                <text x="382" y="174" textAnchor="end" className="art-axis-label" fontWeight="bold" fill="var(--primary)">
                  x (الفواصل)
                </text>
                <text x="210" y="20" className="art-axis-label" fontWeight="bold" fill="var(--primary)">
                  y = f(x)
                </text>

                {/* 3B1B Riemann Sum Integral Area with Arabic Callouts */}
                {visual === 'integral' && (
                  <g>
                    {/* Riemann Rectangles with gradient & luminous borders */}
                    {riemannBars.map((bar, idx) => (
                      <g key={idx}>
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          className="art-riemann-bar"
                          fill={`url(#riemannGrad-${id})`}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                        />
                        {idx === 0 && (
                          <text x={bar.x + bar.width / 2} y={bar.y - 6} textAnchor="middle" fontSize="7" fill="#38bdf8">
                            f(xᵢ)
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Smooth Continuous Integral Area */}
                    <path d={curvePath} className="art-curve" fill="none" stroke="#38bdf8" strokeWidth="2.5" filter={`url(#neonGlow-${id})`} />

                    {/* Boundary limits a and b */}
                    <path d="M 93 175v20 M 297 175v20" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
                    <text x="93" y="214" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="bold">
                      a = -1.6
                    </text>
                    <text x="297" y="214" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="bold">
                      b = 1.6
                    </text>

                    {/* Arabic Riemann Convergence Card */}
                    <g transform="translate(195, 232)">
                      <rect x="-140" y="-12" width="280" height="22" rx="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.2" />
                      <text x="0" y="3" textAnchor="middle" fontSize="9.5" fill="var(--primary)" fontWeight="bold" dir="auto">
                        مجموع ريمان: N = {numBars} مستطيل ⟶ ∫[a,b] f(x)dx
                      </text>
                    </g>
                  </g>
                )}

                {/* 3B1B Dynamic Traveling Sine Wave & Phasor Unit Circle */}
                {visual === 'wave' && (
                  <g>
                    {/* Unit Circle with Angle Arc */}
                    <circle cx={phasorCenter} cy={phasorY} r={phasorR} stroke="#818cf8" fill="none" strokeWidth="1.4" opacity="0.8" />
                    {/* Cosine component (horizontal gold) */}
                    <line x1={phasorCenter} y1={phasorY} x2={phasorTipX} y2={phasorY} stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 2" />
                    {/* Sine component (vertical cyan) */}
                    <line x1={phasorTipX} y1={phasorY} x2={phasorTipX} y2={phasorTipY} stroke="#38bdf8" strokeWidth="2.5" />
                    {/* Rotating radius vector */}
                    <line x1={phasorCenter} y1={phasorY} x2={phasorTipX} y2={phasorTipY} stroke="#ffffff" strokeWidth="2" />
                    <circle cx={phasorTipX} cy={phasorTipY} r="4" fill="#38bdf8" filter={`url(#neonGlow-${id})`} />

                    {/* Dynamic Laser Projection Line Across to Wave at x=0 */}
                    <line x1={phasorTipX} y1={phasorTipY} x2="195" y2={waveContactY} className="art-laser" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="195" cy={waveContactY} r="4.5" fill="#38bdf8" filter={`url(#neonGlow-${id})`} />

                    {/* Arabic Phasor Callout */}
                    <text x={phasorCenter} y="146" textAnchor="middle" fontSize="8" fill="#818cf8" fontWeight="bold" dir="auto">
                      الدائرة المثلثية (e^{'{iθ}'})
                    </text>
                    <text x={phasorCenter} y="224" textAnchor="middle" fontSize="7.5" fill="#38bdf8" dir="auto">
                      sin(θ) = {(-Math.sin(wavePhase)).toFixed(2)}
                    </text>
                  </g>
                )}

                {/* Main Mathematical Curve with Glowing Bloom */}
                {visual !== 'integral' && (
                  <path
                    d={curvePath}
                    className={`art-curve ${visual === 'wave' ? 'art-wave' : visual === 'exponential' ? 'art-exponential' : ''}`}
                    fill="none"
                    stroke={`url(#curveGrad-${id})`}
                    strokeWidth="3.2"
                    filter={`url(#neonGlow-${id})`}
                  />
                )}

                {/* 3B1B Sliding Tangent, Slope Triangle & Arabic HUD */}
                {visual === 'tangent' && (
                  <g>
                    {/* Drop lines to axes */}
                    <line x1={ptX} y1={ptY} x2={ptX} y2="185" className="art-laser" strokeDasharray="3 3" opacity="0.65" />
                    <line x1={ptX} y1={ptY} x2="195" y2={ptY} className="art-laser" strokeDasharray="3 3" opacity="0.65" />

                    {/* 3B1B Delta X and Delta Y Slope Triangle */}
                    <line x1={ptX} y1={ptY} x2={ptX + dxPx} y2={ptY} stroke="#34d399" strokeWidth="2.5" />
                    <line x1={ptX + dxPx} y1={ptY} x2={ptX + dxPx} y2={ptY + dyPx} stroke="#f87171" strokeWidth="2.5" />
                    <text x={ptX + dxPx / 2} y={ptY + (dyPx > 0 ? -6 : 14)} textAnchor="middle" fontSize="8" fill="#34d399" fontWeight="bold">
                      Δx
                    </text>
                    <text x={ptX + dxPx + 12} y={ptY + dyPx / 2} textAnchor="start" fontSize="8" fill="#f87171" fontWeight="bold">
                      Δy
                    </text>

                    {/* Tangent Line with Gold Bloom */}
                    <line
                      x1={tx1}
                      y1={ty1}
                      x2={tx2}
                      y2={ty2}
                      stroke={`url(#tangentGrad-${id})`}
                      strokeWidth="2.8"
                      strokeDasharray="6 3"
                      filter={`url(#neonGlow-${id})`}
                    />

                    {/* Tangent point with pulsing beacon */}
                    <circle cx={ptX} cy={ptY} r="10" className="art-point-halo" fill="color-mix(in oklab, var(--gold) 25%, transparent)" />
                    <circle cx={ptX} cy={ptY} r="4.5" fill="#ffffff" filter={`url(#softBloom-${id})`} />
                    <text x={ptX} y={ptY - 12} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" dir="auto">
                      M(x₀, f(x₀))
                    </text>

                    {/* Live Arabic Calculus HUD Card */}
                    <g transform={`translate(${Math.max(90, Math.min(300, ptX))}, ${Math.max(30, ptY - 26)})`}>
                      <rect x="-85" y="-14" width="170" height="24" rx="4" fill="var(--surface)" stroke="#fbbf24" strokeWidth="1.2" className="art-callout-pill" />
                      <text x="0" y="2" textAnchor="middle" className="art-hud-text" fontSize="9" fill="var(--foreground)" dir="auto">
                        المشتقة: f'({x0.toFixed(2)}) = {slope.toFixed(2)} {slope > 0.05 ? '↗ تزايد' : slope < -0.05 ? '↘ تناقص' : '↔ ذروة'}
                      </text>
                    </g>
                  </g>
                )}

                {/* Dynamic Curve Probe Point (when in generic curve mode) */}
                {visual === 'curve' && (
                  <g>
                    {/* Animated probe point sliding continuously along curve */}
                    <circle cx={probePxX} cy={probePxY} r="10" className="art-point-halo" fill="color-mix(in oklab, #38bdf8 25%, transparent)" />
                    <circle cx={probePxX} cy={probePxY} r="4.5" fill="#38bdf8" filter={`url(#neonGlow-${id})`} />
                    <g transform={`translate(${probePxX}, ${Math.max(25, probePxY - 16)})`}>
                      <rect x="-35" y="-10" width="70" height="18" rx="3" fill="var(--surface)" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="2" textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold">
                        P({curveProbeX.toFixed(1)}, {curveProbeY.toFixed(1)})
                      </text>
                    </g>

                    {/* Local Extrema Markers on Curve */}
                    {extremaPoints.map((ext, idx) => (
                      <g key={idx} transform={`translate(${ext.canvasX}, ${ext.canvasY})`}>
                        <circle cx="0" cy="0" r="5" fill={ext.type === 'max' ? '#fbbf24' : '#34d399'} filter={`url(#neonGlow-${id})`} />
                        <g transform="translate(0, -14)">
                          <rect x="-42" y="-9" width="84" height="16" rx="3" fill="var(--surface)" stroke={ext.type === 'max' ? '#fbbf24' : '#34d399'} strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fontSize="7.5" fill={ext.type === 'max' ? '#fbbf24' : '#34d399'} fontWeight="bold" dir="auto">
                            {ext.type === 'max' ? 'ذروة عظمى f\'=0' : 'قيمة صغرى f\'=0'}
                          </text>
                        </g>
                      </g>
                    ))}
                  </g>
                )}

                {/* Exponential Asymptote & Anchor */}
                {visual === 'exponential' && (
                  <g>
                    <line x1="0" y1="240" x2="195" y2="240" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
                    <text x="25" y="234" fontSize="8" fill="#f87171" dir="auto">
                      المستقيم المقارب y = 0
                    </text>
                    <circle cx="195" cy="185" r="4.5" fill="#fbbf24" filter={`url(#neonGlow-${id})`} />
                    <circle cx="195" cy="185" r="9" className="art-point-halo" fill="color-mix(in oklab, #fbbf24 25%, transparent)" />
                    <text x="204" y="180" fontSize="8" fill="#fbbf24" fontWeight="bold">
                      (0, 1)
                    </text>
                  </g>
                )}

                {/* Equation Ribbon at Top */}
                <g transform="translate(290, 48)">
                  <rect x="-85" y="-12" width="170" height="20" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                  <text x="0" y="2" textAnchor="middle" className="art-function" fontSize="10" fontWeight="bold">
                    {visual === 'wave'
                      ? 'f(x) = sin(x)'
                      : isExp
                        ? 'f(x) = eˣ'
                        : isLn
                          ? 'f(x) = ln(x)'
                          : visual === 'integral'
                            ? '∫[a,b] f(x)dx'
                            : visual === 'tangent'
                              ? `(T): y = ${slope.toFixed(2)}x + ...`
                              : `(C_f) : y = ${cleanExpr.replace(/exp\(x\)/g, 'eˣ').replace(/\*/g, '')}`}
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* Lower Mathematical Formula Display (Only when distinct from body and not suppressed) */}
        {(scene.showExpression ?? true) && (() => {
          const expr = (scene.expression ?? project.expression ?? '').trim();
          if (!expr) return null;
          // Avoid duplicate math rendering if the exact formula is already in the scene body text
          const isDupOfBody = lines.some(l => l.trim().toLowerCase() === expr.toLowerCase());
          if (isDupOfBody) return null;
          return (
            <text x={width / 2} y={expressionY} textAnchor="middle" className="art-expression" fill="var(--foreground)">
              {expr}
            </text>
          );
        })()}

        {/* 3B1B Final Scene / CTA Big Central Telegram QR Code Card */}
        {((scene.showQrCta ?? (scene.kind === 'cta' || scene.phase === 'End card')) && (
          <g transform={`translate(${width / 2}, ${portrait ? 540 : 285})`} className="art-qr-cta-card">
            {/* Luminous Glow Frame */}
            <rect
              x={-125}
              y={-145}
              width={250}
              height={290}
              rx={24}
              fill="rgba(11, 18, 30, 0.94)"
              stroke={accentColor ?? '#38bdf8'}
              strokeWidth={2}
              filter={`url(#neonGlow-${id})`}
            />
            {/* Crisp white backdrop for camera scannability */}
            <rect
              x={-95}
              y={-125}
              width={190}
              height={190}
              rx={16}
              fill="#ffffff"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={1}
            />
            {/* Telegram QR Image */}
            <image
              href={TELEGRAM_QR_SRC}
              x={-85}
              y={-115}
              width={170}
              height={170}
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Telegram Bot Handle Badge */}
            <g transform="translate(0, 92)">
              <rect
                x={-85}
                y={-14}
                width={170}
                height={28}
                rx={8}
                fill="rgba(15, 23, 42, 0.92)"
                stroke={accentColor ?? '#38bdf8'}
                strokeWidth={1.2}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
                fill={accentColor ?? '#38bdf8'}
                fontFamily="ui-monospace, monospace"
              >
                {project.qrBotHandle ?? TELEGRAM_BOT_HANDLE}
              </text>
            </g>
            {/* Arabic Scan Callout */}
            <text
              x={0}
              y={130}
              textAnchor="middle"
              fontSize={11.5}
              fontWeight="bold"
              fill="#f8fafc"
              fontFamily="Tajawal, sans-serif"
              dir="auto"
            >
              امسح الكود واشترك في بوت التمارين والحلول
            </text>
          </g>
        ))}
      </g>

      {/* Telegram QR Watermark Corner Badge (rendered across all scenes in safe corner) */}
      {(project.qrWatermark ?? (scene.showQrBadge ?? true)) && (
        <g
          transform={
            portrait
              ? `translate(${width - 76}, 28)`
              : `translate(${width - 82}, 24)`
          }
          className="art-qr-corner-badge"
          opacity={0.96}
        >
          {/* Pure white backing for instant camera scannability */}
          <rect
            x={0}
            y={0}
            width={48}
            height={48}
            rx={8}
            fill="#ffffff"
            stroke={accentColor ?? '#38bdf8'}
            strokeWidth={1.2}
            filter={`url(#softBloom-${id})`}
          />
          {/* QR Code image */}
          <image
            href={TELEGRAM_QR_SRC}
            x={3}
            y={3}
            width={42}
            height={42}
            preserveAspectRatio="xMidYMid meet"
          />
          {/* Telegram pill handle under the QR code */}
          <g transform="translate(24, 56)">
            <rect
              x={-34}
              y={-7}
              width={68}
              height={14}
              rx={4}
              fill="rgba(8, 14, 24, 0.9)"
              stroke={accentColor ?? '#38bdf8'}
              strokeWidth={0.8}
            />
            <text
              x={0}
              y={3}
              textAnchor="middle"
              fontSize={7.5}
              fontWeight="bold"
              fill={accentColor ?? '#38bdf8'}
              fontFamily="ui-monospace, monospace"
            >
              {project.qrBotHandle ?? TELEGRAM_BOT_HANDLE}
            </text>
          </g>
        </g>
      )}

      {safeZones && <rect x={width * 0.08} y={height * 0.07} width={width * 0.84} height={height * 0.81} className="art-safe" />}

      {/* Footnote Bar */}
      {(scene.showFootnote ?? true) && (
        <>
          <text x="34" y={height - 30} className="art-footnote" dir="auto">
            {footnote}
          </text>
          <text x={width - 34} y={height - 30} textAnchor="end" className="art-footnote">
            {scene.label} / {String(project.scenes.length).padStart(2, '0')}
          </text>
        </>
      )}
    </svg>
  );
}
