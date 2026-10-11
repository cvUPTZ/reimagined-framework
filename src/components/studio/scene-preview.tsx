import { useEffect, useId, useMemo, useState } from 'react';
import { type Scene, type StudioProject } from '@/lib/studio';
import { phaseOf } from '@/lib/reference-project';
import { sceneMotion } from '@/lib/project-file';
import { OpenMathDiagram } from './open-math-diagram';
import { hasLegacyRenderer, renderLegacyVisual, type VisualParams, type VisualStage } from '@/lib/legacy-visuals';
import { TELEGRAM_QR_SRC, TELEGRAM_BOT_HANDLE, TELEGRAM_BOT_URL } from '@/assets/telegram-qr';
import { PromoMarketingScene } from './promo-marketing-scene';

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
  const promoLayout = typeof scene.legacy?.['promoLayout'] === 'string' ? (scene.legacy['promoLayout'] as string) : '';

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
  const isScrubbingOrPlaying = playing || elapsed !== undefined;
  const animTime = isScrubbingOrPlaying
    ? (elapsed ?? 0)
    : miniature
      ? (scene.duration || 5) * 0.4
      : (ambientSec * 0.85) % (scene.duration || 5);

  const legacyNode = legacyModel && hasLegacyRenderer(legacyModel)
    ? renderLegacyVisual({ model: legacyModel, params: scene.legacy?.['visualParams'] as VisualParams | undefined, stage: scene.legacy?.['visualStage'] as VisualStage | undefined, elapsed: animTime, duration: scene.duration })
    : null;

  const motion = sceneMotion(scene, isScrubbingOrPlaying ? elapsed : undefined);
  const wipeWidth = Math.max(0, Math.min(width, width * motion.wipeProgress));
  const brandName = project.brandKit?.brandName ?? 'QED';
  const tagline = project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.';
  const footnote = project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING';
  const accentColor = project.brandKit?.accentColor;
  const logoSymbol = project.brandKit?.logoStyle === 'circle' ? '●' : project.brandKit?.logoStyle === 'minimal' ? '' : '∎';

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
          <text x={width - 94} y="44" textAnchor="end" className="art-tagline" style={{ unicodeBidi: "plaintext" }}>
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
        {promoLayout ? (
          <PromoMarketingScene
            layout={promoLayout}
            project={project}
            scene={scene}
            width={width}
            height={height}
            elapsed={animTime}
            filterId={id}
          />
        ) : (
          <>
            {/* Phase Header */}
            {(scene.showPhase ?? true) && (
              <text x={textX} y={baseTitleY - 48} textAnchor={textAnchor} className="art-phase" style={{ unicodeBidi: "plaintext" }}>
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
              <tspan key={i} x={textX} dy={i ? fontSize * lineHeight : 0} textAnchor={textAnchor} style={{ unicodeBidi: "plaintext" }}>
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
            <OpenMathDiagram visual={visual} expression={scene.expression ?? project.expression ?? 'x^2'} elapsed={animTime} duration={scene.duration}/>

          </g>
        )}

        {/* Lower Mathematical Formula Display (Only when distinct from body and not suppressed) */}
        {(scene.showExpression ?? true) && !legacyNode && (() => {
          const expr = (scene.expression ?? project.expression ?? '').trim();
          if (!expr) return null;
          // Avoid duplicate math rendering if the exact formula is already in the scene body text
          const isDupOfBody = lines.some(l => l.trim().toLowerCase() === expr.toLowerCase());
          if (isDupOfBody) return null;
          return (
            <text x={width / 2} y={expressionY + (visual === 'tangent' || visual === 'integral' ? 26 : 0)} textAnchor="middle" className="art-expression" fill="var(--foreground)">
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
              style={{ unicodeBidi: "plaintext" }}
            >
              امسح الكود واشترك في بوت التمارين والحلول
            </text>
          </g>
        ))}
          </>
        )}
      </g>

      {/* Telegram QR Watermark Corner Badge (rendered across all scenes in safe corner) */}
      {(project.qrWatermark ?? (scene.showQrBadge ?? true)) && !promoLayout && (
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
          <text x="34" y={height - 30} className="art-footnote" style={{ unicodeBidi: "plaintext" }}>
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
