import { useId } from 'react';
import { type Scene, type StudioProject } from '@/lib/studio';
import { phaseOf } from '@/lib/reference-project';
import { sceneMotion } from '@/lib/project-file';

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

  return <svg xmlns="http://www.w3.org/2000/svg" className={`scene-art ${miniature ? 'miniature-art' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={miniature ? scene.title : 'Math video preview'}>
    <defs>
      <pattern id={`grid-${id}`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" className="art-grid" fill="none"/></pattern>
      {motion.wipeProgress < 1 && <clipPath id={`wipe-${id}`}><rect x="0" y="0" width={wipeWidth} height={height}/></clipPath>}
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
            <path d="M 20 140 H 370" className="art-axis"/>
            <path d="M 15 140 L 25 135 M 15 140 L 25 145 M 375 140 L 365 135 M 375 140 L 365 145" className="art-axis"/>
            {[-3,-2,-1,0,1,2,3].map(n => <g key={n}><path d={`M${195 + n * 48} 133v14`} className="art-axis"/><text x={195 + n * 48} y="166" textAnchor="middle" className="art-axis-label">{n}</text></g>)}
            <rect x="195" y="112" width="144" height="24" rx="3" className="art-interval"/>
            <path d="M 195 106 H 339" className="art-bracket"/>
            <text x="267" y="96" textAnchor="middle" className="art-function">(3 + 2) × 4 = 20</text>
          </g>
        ) : (
          <g>
            <path d="M 0 185 H 390 M 195 24 V 258" className="art-axis"/>
            {[-3,-2,-1,0,1,2,3].map(n => <g key={n}><path d={`M${195 + n * 57} 180v10`} className="art-axis"/><text x={195 + n * 57} y="207" textAnchor="middle" className="art-axis-label">{n || ''}</text></g>)}
            <text x="204" y="18" className="art-axis-label">y</text><text x="400" y="190" className="art-axis-label">x</text>

            {visual === 'integral' && <path d="M 120 185 L 120 178 Q 195 285 270 178 L 270 185 Z" className="art-area"/>}

            {visual === 'wave' ? (
              <path d="M 24 185 Q 66 100 110 185 T 195 185 T 280 185 T 366 185" className="art-wave" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.draw}/>
            ) : visual === 'exponential' ? (
              <path d="M 20 183 Q 195 183 225 145 T 305 38" className="art-exponential" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.draw}/>
            ) : (
              <path d="M 80 45 Q 195 325 310 45" className="art-curve" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.draw}/>
            )}

            {visual === 'tangent' && <path d="M65 67L245 247" className="art-tangent"/>}
            {visual === 'tangent' && <circle cx="138" cy="150" r="5" className="art-point"/>}
            {visual === 'exponential' && <circle cx="195" cy="165" r="4" className="art-point"/>}

            <text x="275" y="66" className="art-function">
              {visual === 'wave' ? 'f(x) = sin(x)' : visual === 'exponential' ? 'f(x) = eˣ' : visual === 'integral' ? '∫[a,b] f(x)dx' : visual === 'tangent' ? "f'(x) = 2x" : 'f(x) = x²'}
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
