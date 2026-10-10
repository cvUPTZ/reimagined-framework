import { useRef, useState } from 'react';
import { Download, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type StudioProject } from '@/lib/studio';

export function ExportPanel({ project, time, audioUrl, muted, volume, onProjectDownload }: { project: StudioProject; time: number; audioUrl: string; muted: boolean; volume: number; onProjectDownload: () => void }) {
  const [resolution, setResolution] = useState(1280);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const controller = useRef<AbortController | null>(null);
  async function render() {
    setError(''); setComplete(false); setProgress(0);
    const abort = new AbortController(); controller.current = abort;
    try {
      if (project.mediaName && !audioUrl && !muted) throw new Error(`Reattach ${project.mediaName} in Audio, or mute audio before exporting.`);
      const { exportVideo, downloadBlob } = await import('@/lib/video-export');
      const blob = await exportVideo({ project, resolution, audioUrl, muted, volume, signal: abort.signal, onProgress: setProgress });
      downloadBlob(blob, `${project.name}.mp4`); setComplete(true);
    } catch (e) { setError(abort.signal.aborted ? 'Export canceled.' : e instanceof Error ? e.message : 'Video export failed.'); }
    finally { setProgress(null); controller.current = null; }
  }
  async function still() {
    try { const { exportStill, downloadBlob } = await import('@/lib/video-export'); downloadBlob(await exportStill(project, time), `${project.name}-frame.png`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Image export failed.'); }
  }
  return <>
    <label className="field"><span className="field-label">MP4 resolution · 30 fps</span><select aria-label="Export resolution" disabled={progress !== null} value={resolution} onChange={e => setResolution(Number(e.target.value))}><option value={1280}>{project.format === 'portrait' ? '720 × 1280' : '1280 × 720'} · HD</option><option value={1920}>{project.format === 'portrait' ? '1080 × 1920' : '1920 × 1080'} · Full HD</option></select></label>
    <p className="export-note">{audioUrl && !muted ? 'Uploaded audio included' : 'Silent video'} · {project.scenes.length} scenes</p>
    {progress !== null ? <div className="grid gap-3"><progress className="w-full accent-primary" value={progress} max={1} aria-label="Video export progress"/><span role="status">Rendering {Math.round(progress * 100)}%</span><Button variant="outline" onClick={() => controller.current?.abort()}><X size={15}/>Cancel export</Button></div> : <Button onClick={() => void render()}><Download size={16}/>Download MP4 video</Button>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {complete && <p role="status" className="text-primary">Video downloaded.</p>}
    <Button disabled={progress !== null} variant="outline" onClick={() => void still()}><Image size={16}/>Download current frame</Button>
    <Button disabled={progress !== null} variant="outline" onClick={onProjectDownload}><Download size={16}/>Download editable project</Button>
  </>;
}