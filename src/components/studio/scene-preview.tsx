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
  const visual = scene.visual ?? 'curve';
  const titleY = portrait ? 224 : 125;
  const motion = sceneMotion(scene, elapsed);
  return <svg xmlns="http://www.w3.org/2000/svg" className={`scene-art ${miniature ? 'miniature-art' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={miniature ? scene.title : 'Math video preview'}>
    <defs><pattern id={`grid-${id}`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" className="art-grid" fill="none"/></pattern></defs>
    <rect width={width} height={height} className="art-background"/>
    <rect width={width} height={height} fill={`url(#grid-${id})`}/>
    <text x="34" y="48" className="art-brand">QED <tspan className="art-accent">∎</tspan></text>
    <text x={width - 34} y="44" textAnchor="end" className="art-tagline">A LITTLE CLARITY. A BIG DIFFERENCE.</text>
    <g className="art-content" opacity={motion.opacity} transform={`translate(0 ${motion.offset})`}>
      <text x={width / 2} y={titleY - 48} textAnchor="middle" className="art-phase">{phaseOf(scene).toUpperCase()}</text>
      <text x={width / 2} y={titleY + 20} textAnchor="middle" fontSize={fontSize} fontWeight="600" className="art-title" direction={/[\u0600-\u06ff]/.test(scene.body) ? 'rtl' : 'ltr'}>{lines.slice(0, 4).map((line, i) => <tspan key={i} x={width / 2} dy={i ? fontSize * 1.25 : 0}>{line}</tspan>)}</text>
      {visual !== 'none' && <g transform={`translate(${width / 2 - 195},${portrait ? 380 : 238}) scale(${portrait ? 1 : .65})`}>
        <path d="M 0 185 H 390 M 195 24 V 258" className="art-axis"/>
        {[-3,-2,-1,0,1,2,3].map(n => <g key={n}><path d={`M${195 + n * 57} 180v10`} className="art-axis"/><text x={195 + n * 57} y="207" textAnchor="middle" className="art-axis-label">{n || ''}</text></g>)}
        <text x="204" y="18" className="art-axis-label">y</text><text x="400" y="190" className="art-axis-label">x</text>
        <path d="M 80 45 Q 195 325 310 45" className="art-curve" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - motion.draw}/>
        {visual === 'tangent' && <path d="M65 67L245 247" className="art-tangent"/>}
        <circle cx="138" cy="150" r="5" className="art-point"/>
        <text x="275" y="66" className="art-function">f(x) = x²</text>
      </g>}
      <text x={width / 2} y={portrait ? 790 : 480} textAnchor="middle" className="art-expression">{scene.expression ?? project.expression}</text>
    </g>
    {safeZones && <rect x={width * .08} y={height * .07} width={width * .84} height={height * .81} className="art-safe"/>}
    <text x="34" y={height - 30} className="art-footnote">MOMENTS OF UNDERSTANDING</text><text x={width - 34} y={height - 30} textAnchor="end" className="art-footnote">{scene.label} / {String(project.scenes.length).padStart(2, '0')}</text>
  </svg>;
}
