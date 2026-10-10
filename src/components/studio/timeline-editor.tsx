import { useEffect, useRef, useState } from 'react';
import { AudioLines, ChevronLeft, ChevronRight, Film, Plus, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type StudioProject } from '@/lib/studio';
import { timelineMetrics } from '@/lib/timeline';
import { phaseClass, phaseOf, timecode } from '@/lib/reference-project';

interface Props {
  project: StudioProject; selected: number; time: number; audioName: string; hasAudio: boolean;
  onSelect: (index: number) => void; onSeek: (time: number) => void; onAdd: () => void;
  onAudio: () => void; onMove: (from: number, to: number) => void; onTrim: (id: string, duration: number) => void;
}

export function TimelineEditor({ project, selected, time, audioName, hasAudio, onSelect, onSeek, onAdd, onAudio, onMove, onTrim }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [trim, setTrim] = useState<{ id: string; duration: number } | null>(null);
  const trimRef = useRef<{ id: string; x: number; duration: number; value: number; scale: number } | null>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(entry.contentRect.width); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const metrics = timelineMetrics(project.scenes, width, zoom);
  return <section className="timeline" aria-label="Timeline">
    <div className="timeline-toolbar"><div><Film size={15}/><h2>Timeline</h2><span className="timeline-total">{timecode(metrics.duration)}</span></div><div>
      <label className="timeline-zoom"><ZoomIn size={14}/><input aria-label="Timeline zoom" type="range" min="1" max="8" step=".5" value={zoom} onChange={e => setZoom(Number(e.target.value))}/><span>{zoom}×</span></label>
      <Button variant="ghost" size="icon" title="Previous scene" aria-label="Previous scene" onClick={() => onSelect(selected - 1)}><ChevronLeft size={16}/></Button>
      <Button variant="ghost" size="icon" title="Next scene" aria-label="Next scene" onClick={() => onSelect(selected + 1)}><ChevronRight size={16}/></Button>
      <Button variant="ghost" size="icon" title="Add scene" aria-label="Add timeline scene" onClick={onAdd}><Plus size={16}/></Button>
    </div></div>
    <div className="timeline-body"><div className="track-labels"><span>VIDEO<Film size={12}/></span><span>AUDIO<AudioLines size={12}/></span></div>
      <div className="timeline-tracks" ref={viewport}><div className="timeline-content" style={{ width: metrics.width }}>
        <div className="precise-ruler">{Array.from({ length: Math.ceil(metrics.duration / metrics.interval) }, (_, i) => <span key={i} style={{ left: i * metrics.interval * metrics.pixelsPerSecond }}>{timecode(i * metrics.interval)}</span>)}</div>
        <input className="precise-scrubber" type="range" aria-label="Video playhead" min="0" max={metrics.duration} step=".01" value={time} onChange={e => onSeek(Number(e.target.value))}/>
        <div className="precise-video-track">{project.scenes.map((scene, index) => {
          const geometry = metrics.clips[index];
          if (!geometry) return null;
          return <div key={scene.id} className={`precise-clip ${phaseClass(phaseOf(scene))} ${index === selected ? 'clip-active' : ''}`} style={{ left: geometry.left, width: geometry.width }} draggable={!trim} onDragStart={e => e.dataTransfer.setData('application/qed-scene', String(index))} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const value = e.dataTransfer.getData('application/qed-scene'); if (value !== '') onMove(Number(value), index); }}>
            <Button variant="ghost" className="precise-clip-select" aria-label={`Timeline scene ${index + 1}: ${scene.title}`} aria-pressed={index === selected} onClick={() => onSelect(index)}><span>{scene.label}</span><strong>{phaseOf(scene)}</strong><small>{(trim?.id === scene.id ? trim.duration : scene.duration).toFixed(1)}s</small></Button>
            <div className="clip-trim-handle" role="slider" tabIndex={0} aria-label={`Trim scene ${index + 1} duration`} aria-valuemin={.1} aria-valuemax={600} aria-valuenow={trim?.id === scene.id ? trim.duration : scene.duration} title="Adjust duration" onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onTrim(scene.id, scene.duration + (e.key === 'ArrowRight' ? .1 : -.1)); } }} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); trimRef.current = { id: scene.id, x: e.clientX, duration: scene.duration, value: scene.duration, scale: metrics.pixelsPerSecond }; setTrim({ id: scene.id, duration: scene.duration }); }} onPointerMove={e => { const drag = trimRef.current; if (!drag || drag.id !== scene.id) return; const value = Math.max(.1, Math.min(600, Math.round((drag.duration + (e.clientX - drag.x) / drag.scale) * 10) / 10)); drag.value = value; setTrim({ id: drag.id, duration: value }); }} onPointerUp={e => { const drag = trimRef.current; if (!drag) return; trimRef.current = null; setTrim(null); e.currentTarget.releasePointerCapture(e.pointerId); onTrim(drag.id, drag.value); }} onPointerCancel={() => { trimRef.current = null; setTrim(null); }}/>
          </div>;
        })}</div>
        <Button variant="ghost" className={`audio-track precise-audio ${hasAudio ? 'has-audio' : ''}`} onClick={onAudio}><AudioLines size={13}/><span>{audioName || 'No audio track'}</span><span className="waveform">{Array.from({ length: 45 }, (_, i) => <i key={i} className={`wave-${i % 5}`}/>)}</span><span>{hasAudio ? 'Edit audio' : '+ Add audio'}</span></Button>
        <div className="timeline-playhead" style={{ left: Math.min(metrics.width - 1, time * metrics.pixelsPerSecond) }} aria-hidden="true"/>
      </div></div>
    </div>
  </section>;
}