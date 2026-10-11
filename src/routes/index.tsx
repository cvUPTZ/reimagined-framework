import { createFileRoute } from '@tanstack/react-router';
import { AudioLines, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clapperboard, Copy, Download, Expand, Eye, EyeOff, FilePlus, Film, FolderOpen, History, Layers, LayoutTemplate, Mic, MicOff, MoreHorizontal, Palette, Pause, Play, Plus, Redo2, RotateCcw, Search, Settings2, ShieldCheck, SkipBack, SlidersHorizontal, Sparkles, Trash2, Type, Undo2, Upload, Volume2, VolumeX, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScenePreview } from '@/components/studio/scene-preview';
import { ExportPanel } from '@/components/studio/export-panel';
import { TimelineEditor } from '@/components/studio/timeline-editor';
import { sceneStart, trimScene } from '@/lib/timeline';
import { parseProjectFile, projectFile, sceneAtTime } from '@/lib/project-file';
import { buildScenes, defaultBrandKits, duplicateScene, moveScene, totalDuration, type Scene, type StudioProject } from '@/lib/studio';
import { phaseNames, phaseOf, phaseClass, referenceProject, threeBlueOneBrownProject, originalZipProject, bacLogarithmProject, bacIntegralsProject, timecode } from '@/lib/reference-project';
import { evaluateMathExpression } from '@/lib/math-engine';
import { lessonToStudioProject, searchEducationalLessons } from '@/lib/educational-library';
import { legacyCounts, legacyLevels, legacyToProject, searchLegacy, SOLVE_TYPES, type LegacySource } from '@/lib/legacy-library';
import { listProjects, getProject, saveProject as persistProject, deleteProject as removeStoredProject, duplicateProject as cloneStoredProject, searchProjects, listSnapshots, createSnapshot, type ProjectMeta, type ProjectSnapshot } from '@/lib/project-store';
import { VoiceRecorder, isRecordingSupported } from '@/lib/audio-recording';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'QED Studio — Visual mathematics editor' },
    { name: 'description', content: 'Create and edit clear mathematical stories in QED Studio. Shape scenes, motion, and your next moment of understanding.' },
    { property: 'og:title', content: 'QED Studio — Visual mathematics editor' },
    { property: 'og:description', content: 'A focused workspace for visual mathematics, scene editing, and storytelling.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Studio,
});
type Panel = 'projects' | 'templates' | 'library' | 'audio' | 'settings' | 'export' | null;
function IconButton({ icon: Icon, label, onClick, disabled }: { icon: ComponentType<{ size?: number }>; label: string; onClick: () => void; disabled?: boolean }) { return <Button variant="ghost" size="icon" title={label} aria-label={label} onClick={onClick} disabled={disabled}><Icon size={16}/></Button>; }
function Field({ label, children, extra }: { label: string; children: ReactNode; extra?: ReactNode }) { return <label className="field"><span className="field-label">{label}<span>{extra}</span></span>{children}</label>; }

function Studio() {
  const [project, setProject] = useState<StudioProject>(referenceProject);
  const [selected, setSelected] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [inspector, setInspector] = useState('Content');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<StudioProject[]>([]);
  const [future, setFuture] = useState<StudioProject[]>([]);
  const [zoom, setZoom] = useState('Fit');
  const [safeZones, setSafeZones] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(65);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioName, setAudioName] = useState('');
  const [notice, setNotice] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryLevel, setLibraryLevel] = useState('all');
  const [librarySource, setLibrarySource] = useState<'lessons' | LegacySource>('lessons');
  const [libraryLimit, setLibraryLimit] = useState(60);
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectList, setProjectList] = useState<ProjectMeta[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const lastEdit = useRef({ key: '', at: 0 });
  const file = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const duration = useMemo(() => totalDuration(project.scenes), [project.scenes]);
  const scene = project.scenes[selected] ?? project.scenes[0];
  const filteredLessons = useMemo(() => searchEducationalLessons(librarySearch, libraryLevel), [librarySearch, libraryLevel]);
  const legacyEntries = useMemo(() => librarySource === 'lessons' ? [] : searchLegacy(librarySource, librarySearch, libraryLevel), [librarySource, librarySearch, libraryLevel]);
  const legacyLevelList = useMemo(() => librarySource === 'lessons' ? [] : legacyLevels(librarySource), [librarySource]);
  const legacyTotals = useMemo(() => legacyCounts(), []);
  const formulaValidation = useMemo(() => evaluateMathExpression(scene?.expression ?? project.expression ?? '', 1), [scene?.expression, project.expression]);

  useEffect(() => {
    setProjectList(searchProjects(projectSearch));
  }, [panel, projectSearch, project]);

  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.cancel();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try { const raw = localStorage.getItem('qed-studio-project-v1'); if (raw) { const result = parseProjectFile(JSON.parse(raw)); setProject(result.project); setImportWarnings(result.warnings); } } catch { setNotice('Your saved project could not be opened. Import a backup to recover it.'); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (!hydrated) return; setSaved(false); const timer = setTimeout(() => { try { persistProject(project); setSaved(true); } catch { setNotice('Browser storage is full. Download your project to save it.'); } }, 450); return () => clearTimeout(timer); }, [project, hydrated]);

  async function toggleRecording() {
    if (isRecording) {
      if (!recorderRef.current) return;
      try {
        const result = await recorderRef.current.stop();
        setIsRecording(false);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setAudioUrl(result.url);
        const recName = `Voice-over ${new Date().toLocaleTimeString()}.webm`;
        setAudioName(recName);
        commit({
          ...project,
          mediaName: recName,
          audioTrack: {
            name: recName,
            url: result.url,
            volume,
            muted: false,
            startOffset: project.audioTrack?.startOffset ?? 0,
          },
        });
        setNotice('Voice-over recorded and attached!');
      } catch {
        setIsRecording(false);
        setNotice('Recording stopped with error.');
      }
    } else {
      try {
        const rec = new VoiceRecorder();
        await rec.start();
        recorderRef.current = rec;
        setIsRecording(true);
        setRecordingSeconds(0);
        recordTimerRef.current = window.setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } catch (e) {
        setNotice(e instanceof Error ? e.message : 'Microphone access denied or unavailable.');
      }
    }
  }
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    function tick(now: number) {
      const delta = (now - last) / 1000;
      last = now;
      setTime(t => {
        const next = Math.min(duration, t + delta);
        if (next >= duration) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);

  useEffect(() => {
    if (project.scenes.length > 0) {
      const currentIdx = sceneAtTime(project, time).index;
      if (currentIdx !== selected) {
        setSelected(currentIdx);
      }
    }
  }, [time, project, selected]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.volume = volume / 100; audio.current.muted = muted;
    if (Math.abs(audio.current.currentTime - time) > .25) audio.current.currentTime = time;
    if (playing) void audio.current.play().catch(() => {}); else audio.current.pause();
  }, [playing, volume, muted, audioUrl, time]);
  useEffect(() => {
    setSelected(i => Math.min(i, project.scenes.length - 1));
    setTime(t => Math.min(t, duration));
  }, [project, duration]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(t); }, [notice]);
  function commit(p: StudioProject, key = '') { const now = performance.now(); if (!key || lastEdit.current.key !== key || now - lastEdit.current.at > 700) setHistory(h => [...h.slice(-29), project]); lastEdit.current = { key, at: now }; setFuture([]); setProject(p); }
  function edit(patch: Partial<Scene>) { if (!scene) return; commit({ ...project, scenes: project.scenes.map(s => s.id === scene.id ? { ...s, ...patch } : s) }, `${scene.id}:${Object.keys(patch).join(',')}`); }
  function select(i: number) { const index = Math.max(0, Math.min(project.scenes.length - 1, i)); setSelected(index); const next = sceneStart(project.scenes, index); setTime(next); if (audio.current) audio.current.currentTime = next; }
  function undo() { lastEdit.current = { key: '', at: 0 };  const p = history.at(-1); if (!p) return; setFuture(f => [project, ...f]); setHistory(h => h.slice(0, -1)); setProject(p); const index = Math.min(selected, p.scenes.length - 1); setSelected(index); setTime(sceneStart(p.scenes, index)); setPlaying(false); }
  function redo() { lastEdit.current = { key: '', at: 0 };  const p = future[0]; if (!p) return; setHistory(h => [...h, project]); setFuture(f => f.slice(1)); setProject(p); const index = Math.min(selected, p.scenes.length - 1); setSelected(index); setTime(sceneStart(p.scenes, index)); setPlaying(false); }
  function add() { const next: Scene = { id: crypto.randomUUID(), label: String(project.scenes.length + 1).padStart(2, '0'), title: 'Untitled scene', body: 'A new perspective.', duration: 5, kind: 'explain', phase: 'Intuition', animation: 'Fade', visual: 'curve', fontSize: 42 }; commit({ ...project, scenes: [...project.scenes, next] }); setSelected(project.scenes.length); setTime(duration); }
  function duplicate() { const scenes = duplicateScene(project.scenes, selected); commit({ ...project, scenes }); setSelected(selected + 1); setTime(sceneStart(scenes, selected + 1)); }
  function reorder(from: number, to: number) { const scenes = moveScene(project.scenes, from, to); commit({ ...project, scenes }); setSelected(to); setTime(sceneStart(scenes, to)); setPlaying(false); }
  function trim(id: string, seconds: number) { const next = trimScene(project, id, seconds); commit(next); setTime(sceneStart(next.scenes, selected)); setPlaying(false); }
  function remove() { if (project.scenes.length <= 1) return; const scenes = project.scenes.filter((_, i) => i !== selected).map((s,i) => ({ ...s, label: String(i+1).padStart(2,'0') })); const index = Math.max(0, selected - 1); commit({ ...project, scenes }); setSelected(index); setTime(sceneStart(scenes, index)); setPlaying(false); }
  function load(p: StudioProject) { setProject(p); setHistory([]); setFuture([]); setImportWarnings([]); setAudioUrl(''); setAudioName(''); lastEdit.current = { key: '', at: 0 }; setSelected(0); setTime(0); setPlaying(false); setPanel(null); }
  function exportProject() { const url = URL.createObjectURL(new Blob([JSON.stringify(projectFile(project), null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `${project.name}.cmb.json`; a.click(); URL.revokeObjectURL(url); setNotice('Editable project downloaded'); }
  async function importFile(f: File) {
    try { const result = parseProjectFile(JSON.parse(await f.text())); load(result.project); setImportWarnings(result.warnings); setNotice('Project imported'); }
    catch (e) { setNotice(e instanceof Error && !e.message.startsWith('[') ? e.message : 'Could not open this project. Choose a valid QED project file.'); }
  }
  function seek(n: number) { setTime(n); let sum = 0; const i = project.scenes.findIndex(s => { sum += s.duration; return n < sum; }); setSelected(i < 0 ? project.scenes.length - 1 : i); if (audio.current) audio.current.currentTime = n; }
  if (!scene) return null;
  const sceneElapsed = Math.max(0, time - project.scenes.slice(0, selected).reduce((sum, s) => sum + s.duration, 0));
  const ratio = project.format === 'portrait' ? '9:16' : '16:9';
  return <div className="studio-shell" dir="ltr">
    <aside className="navigation-rail"><div className="rail-logo">q<span>∎</span></div><nav className="rail-links" aria-label="Studio navigation">{([{ id: null, icon: Clapperboard, label: 'Editor' }, { id: 'projects', icon: FolderOpen, label: 'Projects' }, { id: 'templates', icon: LayoutTemplate, label: 'Templates' }, { id: 'library', icon: BookOpen, label: 'Library' }, { id: 'audio', icon: AudioLines, label: 'Audio' }] as const).map(n => <Button key={n.label} variant="ghost" className={`rail-item ${panel === n.id ? 'rail-active' : ''}`} onClick={() => setPanel(n.id)} title={n.label}><n.icon size={20}/><span>{n.label}</span></Button>)}</nav><div className="rail-bottom"><IconButton icon={Settings2} label="Studio settings" onClick={() => setPanel('settings')}/><IconButton icon={CircleHelp} label="Help" onClick={() => setNotice('Your project is saved in this browser. Use Export to download a copy.')}/><span className="user-avatar">AZ</span></div></aside>
    <div className="studio-main">
      <header className="topbar"><div className="wordmark">QED<span>∎</span><i/><small>STUDIO</small></div><div className="project-title"><span className="breadcrumb">Workspace<ChevronRight size={12}/></span><input aria-label="Project name" value={project.name} onChange={e => commit({ ...project, name: e.target.value })}/><IconButton icon={ChevronDown} label="Your projects" onClick={() => setPanel('projects')}/></div><div className="header-actions"><span className="save-state"><Check size={13}/>{saved ? 'All changes saved' : 'Saving changes…'}</span><IconButton icon={FolderOpen} label="Open project" onClick={() => file.current?.click()}/><Button variant="outline" size="sm" onClick={() => { if (time >= duration) select(0); setPlaying(true); void stage.current?.requestFullscreen?.(); }}><Play size={14}/>Preview</Button><Button size="sm" onClick={() => setPanel('export')}><Download size={14}/>Export<ChevronDown size={12}/></Button></div></header>
      <div className="workspace-toolbar"><div className="workspace-heading"><span className="live-dot"/><strong>Video editor</strong><span className="toolbar-divider"/><small>{project.scenes.length} scenes · {timecode(duration)}</small></div><div className="toolbar-actions"><IconButton icon={Undo2} label="Undo" onClick={undo} disabled={!history.length}/><IconButton icon={Redo2} label="Redo" onClick={redo} disabled={!future.length}/><span className="toolbar-divider"/><Button variant="ghost" size="sm" onClick={() => setPanel('templates')}><Sparkles size={16}/>Templates</Button><IconButton icon={MoreHorizontal} label="Workspace settings" onClick={() => setPanel('settings')}/></div></div>
      <main className="editor-grid">
        <section className="scene-sidebar"><div className="section-heading"><div><Layers size={16}/><h2>Scenes</h2><span className="count">{String(project.scenes.length).padStart(2,'0')}</span></div><IconButton icon={Plus} label="Add scene" onClick={add}/></div><div className="scene-list">{project.scenes.map((s,i) => <div key={s.id} className={`scene-item ${selected === i ? 'scene-selected' : ''}`} draggable onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (!Number.isInteger(from)) return; reorder(from, i); }}><Button variant="ghost" className="scene-select-button" aria-label={`Select scene ${i+1}: ${s.title}`} aria-pressed={selected === i} onClick={() => select(i)}><div className={`scene-thumb ${phaseClass(phaseOf(s))}`}><ScenePreview project={project} scene={s} miniature/><span className="thumbnail-duration">{s.duration}s</span></div><div className="scene-details"><div className="scene-number">{String(i+1).padStart(2,'0')}<span className={`phase-label ${phaseClass(phaseOf(s))}`}>{phaseOf(s)}</span></div><strong dir="auto">{s.title}</strong><small>{s.duration.toFixed(1)} sec<span>·</span>{s.animation ?? 'Fade'}</small></div></Button></div>)}</div><Button variant="outline" className="add-scene" size="sm" onClick={add}><Plus size={15}/>Add scene</Button><div className="sidebar-footer"><span className="live-dot"/>Story arc<span>Custom<ChevronDown size={11}/></span></div></section>
        <section className="preview-area"><div className="preview-heading"><div><span className="overline">CANVAS</span><span className="canvas-ratio">{ratio}<span>·</span>{project.format === 'portrait' ? '1080 × 1920' : '1920 × 1080'}</span></div><div className="preview-tools"><select aria-label="Canvas zoom" value={zoom} onChange={e => setZoom(e.target.value)}><option>Fit</option><option>80%</option><option>60%</option></select><IconButton icon={Expand} label="Full screen canvas" onClick={() => void stage.current?.requestFullscreen?.()}/></div></div><div className={`canvas-workspace ${project.format === 'landscape' ? 'canvas-landscape' : ''}`}><div className={`video-stage zoom-${zoom === 'Fit' ? 'fit' : zoom.replace('%','')}`} ref={stage}><ScenePreview key={scene.id} project={project} scene={scene} elapsed={sceneElapsed} playing={playing} safeZones={safeZones}/></div><span className="canvas-scene-label">SCENE {String(selected+1).padStart(2,'0')}<span>/ {String(project.scenes.length).padStart(2,'0')}</span></span></div><div className="playback-bar"><div className="playback-left"><IconButton icon={muted ? VolumeX : Volume2} label="Toggle audio" onClick={() => setMuted(m => !m)}/><span className="preview-quality">HD</span></div><div className="playback-center"><IconButton icon={SkipBack} label="Restart playback" onClick={() => select(0)}/><Button variant="secondary" size="icon" className="play-button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => { if (!playing && time >= duration) select(0); setPlaying(p => !p); }}>{playing ? <Pause size={16}/> : <Play size={16}/>}</Button><span className="time-display">{timecode(time)}<span>/ {timecode(duration)}</span></span></div><span className="live-preview"><span className="live-dot"/>{playing ? 'Playing' : 'Live preview'}</span></div></section>
        <aside className="inspector"><div className="section-heading"><div><SlidersHorizontal size={16}/><h2>Scene properties</h2></div><IconButton icon={MoreHorizontal} label="Duplicate selected scene" onClick={duplicate}/></div><div className="inspector-tabs">{['Content','Layers','Typography','Motion'].map(t => <Button variant="ghost" key={t} className={inspector === t ? 'tab-active' : ''} onClick={() => setInspector(t)}>{t}</Button>)}</div><div className="inspector-content">
          <Field label="Scene name"><input aria-label="Scene name" dir="auto" value={scene.title} onChange={e => edit({ title: e.target.value })}/></Field><div className="field-row"><Field label="Scene type"><select value={phaseOf(scene)} onChange={e => edit({ phase: e.target.value })}>{phaseNames.map(p => <option key={p}>{p}</option>)}</select></Field><Field label="Duration"><div className="suffix-input"><input aria-label="Duration" type="number" min=".1" max="600" step=".1" value={scene.duration} onChange={e => { const n = Number(e.target.value); if (n >= .1 && n <= 600) edit({ duration: n }); }}/><span>sec</span></div></Field></div>
          {inspector === 'Content' && <><div className="field-section"><Field label="On-screen text" extra="Text layer"><textarea aria-label="On-screen text" dir="auto" rows={3} value={scene.body} onChange={e => edit({ body: e.target.value })}/></Field><div className="text-tools"><span><b>T</b>{scene.fontFamily ?? 'Space Grotesk'}</span><Button variant="ghost" size="sm" onClick={() => setInspector('Typography')}>{scene.fontSize ?? 42} px · {scene.textAlign ?? 'center'}<ChevronDown size={12}/></Button></div></div><div className="field-section"><Field label="Math expression" extra={<i className="math-tag">ƒx</i>}><input aria-label="Math expression" className="formula-input" value={scene.expression ?? project.expression} onChange={e => edit({ expression: e.target.value })}/></Field>{formulaValidation.error ? <small style={{ color: 'var(--coral)', fontSize: 9, display: 'block', marginTop: 4 }}>⚠️ {formulaValidation.error}</small> : <small style={{ color: 'var(--primary)', fontSize: 9, display: 'block', marginTop: 4 }}>✓ Valid formula (f(1) = {formulaValidation.value})</small>}</div><div className="field-section"><Field label="Visual model"><select value={scene.visual ?? 'curve'} onChange={e => { const visual = e.target.value as NonNullable<Scene['visual']>; edit({ visual }); }}><option value="curve">Function curve f(x) = x²</option><option value="tangent">Tangent & slope f'(x)</option><option value="wave">Trigonometric wave sin(x)</option><option value="exponential">Exponential curve eˣ</option><option value="integral">Definite integral ∫ f(x)dx</option><option value="number-line">Number line & bracket</option><option value="none">Text only</option></select></Field><div className="model-miniature"><svg viewBox="0 0 240 65" aria-hidden="true"><path d="M25 50H220M115 8V58" className="art-axis"/><path d="M58 12Q118 85 178 12" fill="none" className="art-curve"/></svg><span>{scene.visual === 'wave' ? 'sin(x)' : scene.visual === 'exponential' ? 'eˣ' : scene.visual === 'integral' ? '∫ f(x)dx' : scene.visual === 'tangent' ? "f'(x)" : scene.visual === 'number-line' ? '[a, b]' : 'f(x) = x²'}</span></div></div><div className="field-section"><Field label="Voice-over script" extra={<AudioLines size={14}/>}><textarea rows={3} value={scene.narration ?? scene.body} onChange={e => edit({ narration: e.target.value })}/></Field><Button variant="ghost" className="voice-button" size="sm" onClick={() => { if (!('speechSynthesis' in window)) { setNotice('Speech playback is unavailable.'); return; } speechSynthesis.cancel(); const text = scene.narration ?? scene.body; const u = new SpeechSynthesisUtterance(text); u.lang = /[\u0600-\u06ff]/.test(text) ? 'ar' : 'en-US'; speechSynthesis.speak(u); }}><Play size={12}/>Listen to script</Button></div></>}
          {inspector === 'Layers' && <div className="field-section" style={{ marginTop: 12, paddingTop: 0, borderTop: 0 }}>
            <Field label="Canvas layers" extra="Stack & Visibility">
              <div className="layer-list">
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><Layers size={13}/>Canvas grid</span><IconButton icon={(scene.showGrid ?? true) ? Eye : EyeOff} label="Toggle grid" onClick={() => edit({ showGrid: !(scene.showGrid ?? true) })}/></div>
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><Sparkles size={13}/>Brand badge</span><IconButton icon={(scene.showBrand ?? true) ? Eye : EyeOff} label="Toggle brand mark" onClick={() => edit({ showBrand: !(scene.showBrand ?? true) })}/></div>
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><Type size={13}/>Phase header</span><IconButton icon={(scene.showPhase ?? true) ? Eye : EyeOff} label="Toggle phase badge" onClick={() => edit({ showPhase: !(scene.showPhase ?? true) })}/></div>
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><Type size={13}/>Main text</span><IconButton icon={(scene.showText ?? true) ? Eye : EyeOff} label="Toggle main text" onClick={() => edit({ showText: !(scene.showText ?? true) })}/></div>
                  {(scene.showText ?? true) && <div className="layer-controls">
                    <Field label="Vertical offset" extra={`${scene.textY ?? 0} px`}><input type="range" min="-120" max="120" value={scene.textY ?? 0} onChange={e => edit({ textY: Number(e.target.value) })}/></Field>
                  </div>}
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><SlidersHorizontal size={13}/>Visual plot</span><IconButton icon={(scene.showVisual ?? true) ? Eye : EyeOff} label="Toggle visual model" onClick={() => edit({ showVisual: !(scene.showVisual ?? true) })}/></div>
                  {(scene.showVisual ?? true) && (scene.visual ?? 'curve') !== 'none' && <div className="layer-controls">
                    <Field label="Plot position Y" extra={`${scene.visualY ?? 0} px`}><input type="range" min="-100" max="100" value={scene.visualY ?? 0} onChange={e => edit({ visualY: Number(e.target.value) })}/></Field>
                    <Field label="Plot scale" extra={`${Math.round((scene.visualScale ?? 1) * 100)}%`}><input type="range" min="0.5" max="1.5" step="0.05" value={scene.visualScale ?? 1} onChange={e => edit({ visualScale: Number(e.target.value) })}/></Field>
                  </div>}
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><i className="math-tag" style={{ fontSize: 13 }}>ƒx</i>Math formula</span><IconButton icon={(scene.showExpression ?? true) ? Eye : EyeOff} label="Toggle expression" onClick={() => edit({ showExpression: !(scene.showExpression ?? true) })}/></div>
                  {(scene.showExpression ?? true) && <div className="layer-controls">
                    <Field label="Formula offset Y" extra={`${scene.expressionY ?? 0} px`}><input type="range" min="-100" max="100" value={scene.expressionY ?? 0} onChange={e => edit({ expressionY: Number(e.target.value) })}/></Field>
                  </div>}
                </div>
                <div className="layer-item">
                  <div className="layer-header"><span className="layer-info"><FolderOpen size={13}/>Footnote bar</span><IconButton icon={(scene.showFootnote ?? true) ? Eye : EyeOff} label="Toggle footnote bar" onClick={() => edit({ showFootnote: !(scene.showFootnote ?? true) })}/></div>
                </div>
              </div>
            </Field>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => edit({ textY: 0, visualY: 0, visualScale: 1, expressionY: 0, showGrid: true, showBrand: true, showPhase: true, showText: true, showVisual: true, showExpression: true, showFootnote: true })}><RotateCcw size={12}/>Reset layer positioning</Button>
          </div>}
          {inspector === 'Typography' && <><div className="field-section"><Field label="Font family"><select value={scene.fontFamily ?? 'Space Grotesk'} onChange={e => edit({ fontFamily: e.target.value as Scene['fontFamily'] })}><option value="Space Grotesk">Space Grotesk (Modern)</option><option value="Tajawal">Tajawal (Arabic & Latin)</option><option value="sans-serif">System Sans</option><option value="serif">Cambria Serif</option></select></Field></div>
          <div className="field-section"><Field label="Font size" extra={`${scene.fontSize ?? 42} px`}><input aria-label="Text size" type="range" min="20" max="72" value={scene.fontSize ?? 42} onChange={e => edit({ fontSize: Number(e.target.value) })}/></Field></div>
          <div className="field-section"><Field label="Font weight"><div className="btn-group">{([400, 500, 600, 700] as const).map(w => <button key={w} type="button" className={(scene.fontWeight ?? 600) === w ? 'active' : ''} onClick={() => edit({ fontWeight: w })}>{w === 400 ? 'Regular' : w === 500 ? 'Medium' : w === 600 ? 'Semibold' : 'Bold'}</button>)}</div></Field></div>
          <div className="field-section"><Field label="Text alignment"><div className="btn-group"><button type="button" className={(scene.textAlign ?? 'center') === 'left' ? 'active' : ''} onClick={() => edit({ textAlign: 'left' })}><AlignLeft size={13}/>Left</button><button type="button" className={(scene.textAlign ?? 'center') === 'center' ? 'active' : ''} onClick={() => edit({ textAlign: 'center' })}><AlignCenter size={13}/>Center</button><button type="button" className={(scene.textAlign ?? 'center') === 'right' ? 'active' : ''} onClick={() => edit({ textAlign: 'right' })}><AlignRight size={13}/>Right</button></div></Field></div>
          <div className="field-section"><Field label="Line spacing"><div className="btn-group">{([1.15, 1.25, 1.5] as const).map(lh => <button key={lh} type="button" className={(scene.lineHeight ?? 1.25) === lh ? 'active' : ''} onClick={() => edit({ lineHeight: lh })}>{lh === 1.15 ? 'Tight' : lh === 1.25 ? 'Normal' : 'Relaxed'}</button>)}</div></Field></div>
          <div className="field-section"><Field label="Text accent color"><div className="color-swatches">{([['default', 'swatch-default'], ['primary', 'swatch-primary'], ['gold', 'swatch-gold'], ['blue', 'swatch-blue'], ['coral', 'swatch-coral']] as const).map(([c, cls]) => <button key={c} type="button" className={`color-swatch ${cls} ${(scene.textColor ?? 'default') === c ? 'active' : ''}`} title={c} onClick={() => edit({ textColor: c })}/>)}</div></Field></div>
          <div className="field-section"><Field label="Aspect ratio"><select value={project.format} onChange={e => commit({ ...project, format: e.target.value as StudioProject['format'] })}><option value="portrait">9:16 · Portrait</option><option value="landscape">16:9 · Landscape</option></select></Field></div>
          <Button variant={safeZones ? 'secondary' : 'outline'} className="w-full mt-3" onClick={() => setSafeZones(v => !v)}><ShieldCheck size={16}/>{safeZones ? 'Hide safe zones' : 'Show safe zones'}</Button></>}
          {inspector === 'Motion' && <><div className="field-section"><Field label="Scene transition / Entrance"><select value={scene.animation ?? 'Fade'} onChange={e => { const animation = e.target.value; if (animation === 'Draw in' || animation === 'Fade' || animation === 'Slide up' || animation === 'Slide left' || animation === 'Zoom in' || animation === 'Wipe' || animation === 'None') edit({ animation }); }}>{['Fade', 'Slide up', 'Slide left', 'Zoom in', 'Wipe', 'Draw in', 'None'].map(a => <option key={a}>{a}</option>)}</select></Field></div>
          <div className="field-section"><Field label="Transition speed" extra={`${(scene.transitionDuration ?? 0.7).toFixed(1)}s`}><input type="range" min="0.2" max="2.0" step="0.1" value={scene.transitionDuration ?? 0.7} onChange={e => edit({ transitionDuration: Number(e.target.value) })}/></Field></div>
          <Button variant="outline" className="w-full" onClick={() => { select(selected); setPlaying(true); }}><Play size={14}/>Preview transition</Button>
          <div className="field-section"><Field label="Scene duration" extra={`${scene.duration}s`}><input type="range" min=".1" max="600" step=".1" value={scene.duration} onChange={e => edit({ duration: Number(e.target.value) })}/></Field></div></>}
        </div><div className="inspector-footer"><Button variant="ghost" size="sm" onClick={duplicate}><Copy size={14}/>Duplicate</Button><IconButton icon={Trash2} label="Delete scene" onClick={remove} disabled={project.scenes.length <= 1}/></div></aside>
      </main>
      <TimelineEditor project={project} selected={selected} time={time} audioName={audioName || (project.mediaName ? `Missing: ${project.mediaName}` : '')} hasAudio={!!audioUrl} onSelect={select} onSeek={seek} onAdd={add} onAudio={() => setPanel('audio')} onMove={reorder} onTrim={trim}/>
      <footer className="statusbar"><span><span className="live-dot"/>QED Studio<i>v5.0</i></span><span>{project.scenes.length} scenes · {ratio} · 30 fps</span><span>Made for moments of understanding. ∎</span></footer>
    </div>
    <input ref={file} type="file" accept=".json,.cmb.json,.qed.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ''; }}/>{audioUrl && <audio ref={audio} src={audioUrl}/>}
    <Dialog open={panel !== null} onOpenChange={open => { if (!open) setPanel(null); }}><DialogContent className="studio-modal"><span className="overline">QED STUDIO</span><DialogTitle>{panel ? { projects: 'Your projects', templates: 'Start with a story', library: 'Story & lesson', audio: 'Audio studio', settings: 'Studio settings', export: 'Ready for the world' }[panel] : ''}</DialogTitle><DialogDescription className="sr-only">{panel} options</DialogDescription>
      {panel === 'projects' && <div className="modal-content">
        <div className="library-search">
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search saved projects by name, topic, or level…"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
            <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted-foreground)' }}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => {
            const newProject: StudioProject = {
              ...referenceProject,
              id: `project-${crypto.randomUUID()}`,
              name: 'New Mathematics Story',
              scenes: [{
                id: crypto.randomUUID(),
                label: '01',
                title: 'Introduction',
                body: 'Start your lesson intuition here.',
                duration: 5,
                kind: 'explain',
                phase: 'Intuition',
                animation: 'Fade',
                visual: 'curve',
                fontSize: 42,
              }],
            };
            load(newProject);
            persistProject(newProject);
            setProjectList(searchProjects(projectSearch));
            setNotice('New project created');
          }}>
            <FilePlus size={15}/>New Project
          </Button>
          <Button variant="outline" size="sm" onClick={() => file.current?.click()}>
            <Upload size={15}/>Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportProject}>
            <Download size={15}/>Export File
          </Button>
        </div>
        <div className="project-list-grid">
          {projectList.map(meta => (
            <div key={meta.id} className={`project-card ${meta.id === project.id ? 'active-project' : ''}`}>
              <div className="project-card-info">
                <strong>
                  {meta.name}
                  {meta.id === project.id && <span style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Current</span>}
                </strong>
                <small>
                  <span>{meta.format === 'portrait' ? '9:16' : '16:9'}</span>
                  <span>·</span>
                  <span>{meta.sceneCount} scenes</span>
                  <span>·</span>
                  <span>{timecode(meta.duration)}</span>
                  <span>·</span>
                  <span>{new Date(meta.updatedAt).toLocaleDateString()}</span>
                </small>
              </div>
              <div className="project-card-actions">
                {meta.id !== project.id && (
                  <Button size="sm" variant="outline" onClick={() => {
                    const loaded = getProject(meta.id);
                    if (loaded) {
                      load(loaded);
                      setNotice(`Loaded project: ${loaded.name}`);
                    }
                  }}>
                    Open
                  </Button>
                )}
                <IconButton icon={Copy} label="Duplicate project" onClick={() => {
                  cloneStoredProject(meta.id);
                  setProjectList(searchProjects(projectSearch));
                  setNotice('Project duplicated');
                }}/>
                <IconButton icon={Trash2} label="Delete project" disabled={projectList.length <= 1} onClick={() => {
                  if (window.confirm(`Delete project "${meta.name}"?`)) {
                    removeStoredProject(meta.id);
                    setProjectList(searchProjects(projectSearch));
                    setNotice('Project deleted');
                  }
                }}/>
              </div>
            </div>
          ))}
          {projectList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted-foreground)', fontSize: 12 }}>
              No matching projects found.
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'grid', gap: 6 }}>
          <Button variant="secondary" className="project-option w-full" onClick={() => {
            load(threeBlueOneBrownProject);
            persistProject(threeBlueOneBrownProject);
            setNotice('Loaded 3Blue1Brown dynamic calculus project');
          }}>
            <Sparkles size={18}/>3Blue1Brown — Calculus & Moving Tangent<ChevronRight size={16}/>
          </Button>
          <Button variant="secondary" className="project-option w-full" onClick={() => {
            load(originalZipProject);
            persistProject(originalZipProject);
            setNotice('Loaded original BAC 2026 style project');
          }}>
            <BookOpen size={18}/>أولوية العمليات — Original BAC Style<ChevronRight size={16}/>
          </Button>
          <Button variant="secondary" className="project-option w-full" onClick={() => {
            load(bacLogarithmProject);
            persistProject(bacLogarithmProject);
            setNotice('Loaded BAC Logarithm project');
          }}>
            <Sparkles size={18}/>الدالة اللوغاريتمية النيبيرية ln(x) — BAC 2026<ChevronRight size={16}/>
          </Button>
          <Button variant="secondary" className="project-option w-full" onClick={() => {
            load(bacIntegralsProject);
            persistProject(bacIntegralsProject);
            setNotice('Loaded BAC Integrals & Riemann Sums project');
          }}>
            <Sparkles size={18}/>التكامل والمساحات ومجاميع ريمان — BAC 2026<ChevronRight size={16}/>
          </Button>
          <Button variant="ghost" className="project-option w-full" onClick={() => {
            load(referenceProject);
            persistProject(referenceProject);
            setNotice('Loaded reference demo');
          }}>
            <Clapperboard size={18}/>The derivative, made visual (QED Classic)<ChevronRight size={16}/>
          </Button>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Snapshots & Recovery</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button size="sm" variant="ghost" onClick={() => {
                createSnapshot(project);
                setSnapshots(listSnapshots(project.id));
                setNotice('Recovery snapshot created');
              }}>
                <History size={13}/>Snapshot Now
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setSnapshots(listSnapshots(project.id));
                setShowSnapshots(s => !s);
              }}>
                {showSnapshots ? 'Hide' : 'View history'}
              </Button>
            </div>
          </div>
          {showSnapshots && (
            <div style={{ display: 'grid', gap: 6, marginTop: 8, maxHeight: 120, overflowY: 'auto' }}>
              {snapshots.length === 0 ? (
                <small style={{ color: 'var(--muted-foreground)' }}>No snapshots saved for this project yet.</small>
              ) : snapshots.map(snap => (
                <div key={snap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 8px', background: 'var(--background)', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <span>{snap.name} · <small style={{ color: 'var(--muted-foreground)' }}>{new Date(snap.timestamp).toLocaleTimeString()}</small></span>
                  <Button size="sm" variant="outline" style={{ height: 22, fontSize: 10 }} onClick={() => {
                    load(snap.project);
                    setNotice(`Restored snapshot from ${new Date(snap.timestamp).toLocaleTimeString()}`);
                  }}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>}
      {panel === 'templates' && <div className="template-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Button variant="outline" className="template-card" onClick={() => {
          load(threeBlueOneBrownProject);
          persistProject(threeBlueOneBrownProject);
          setNotice('Loaded 3Blue1Brown Calculus story');
        }}>
          <div className="template-art">
            <svg viewBox="0 0 160 90">
              <path d="M10 65H150M80 10V85" className="art-axis"/>
              <path d="M20 70Q80 10 140 70" className="art-curve" fill="none"/>
              <line x1="45" y1="25" x2="115" y2="65" stroke="var(--blue)" strokeWidth="2" strokeDasharray="4 2"/>
              <circle cx="80" cy="45" r="4" fill="#fff"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">3Blue1Brown — جوهر التفاضل والتكامل</strong>
            <small style={{ fontSize: 9, color: 'var(--primary)' }} dir="auto">انزلاق المماس، مجاميع ريمان، والدائرة المثلثية</small>
          </div>
        </Button>
        <Button variant="outline" className="template-card" onClick={() => {
          load(originalZipProject);
          persistProject(originalZipProject);
          setNotice('Loaded original BAC 2026 style story');
        }}>
          <div className="template-art">
            <svg viewBox="0 0 160 90">
              <path d="M10 50H150" className="art-axis"/>
              <rect x="25" y="40" width="45" height="15" rx="2" className="art-interval"/>
              <path d="M70 45Q105 15 135 45" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="3 2"/>
              <circle cx="135" cy="50" r="3" fill="var(--gold)"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">أولوية العمليات (BAC 2026)</strong>
            <small style={{ fontSize: 9, color: 'var(--gold)' }} dir="auto">تشخيص الفخاخ، مستقيم الأعداد، والحل المرحلي</small>
          </div>
        </Button>
        <Button variant="outline" className="template-card" onClick={() => {
          load(bacLogarithmProject);
          persistProject(bacLogarithmProject);
          setNotice('Loaded BAC Logarithm story');
        }}>
          <div className="template-art">
            <svg viewBox="0 0 160 90">
              <path d="M10 65H150M40 10V85" className="art-axis"/>
              <path d="M45 80Q50 50 80 40T150 25" className="art-curve" fill="none" stroke="var(--blue)"/>
              <circle cx="70" cy="45" r="3" fill="#fff"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">الدالة اللوغاريتمية ln(x)</strong>
            <small style={{ fontSize: 9, color: 'var(--blue)' }} dir="auto">مجموعة التعريف، المقاربات، والخواص الجبرية</small>
          </div>
        </Button>
        <Button variant="outline" className="template-card" onClick={() => {
          load(bacIntegralsProject);
          persistProject(bacIntegralsProject);
          setNotice('Loaded BAC Integrals & Riemann Sums story');
        }}>
          <div className="template-art">
            <svg viewBox="0 0 160 90">
              <path d="M10 70H150M80 15V85" className="art-axis"/>
              <rect x="50" y="45" width="12" height="25" fill="var(--primary)" opacity="0.4"/>
              <rect x="62" y="40" width="12" height="30" fill="var(--primary)" opacity="0.4"/>
              <rect x="74" y="38" width="12" height="32" fill="var(--primary)" opacity="0.4"/>
              <rect x="86" y="40" width="12" height="30" fill="var(--primary)" opacity="0.4"/>
              <path d="M30 70Q80 15 130 70" className="art-curve" fill="none"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">التكامل والمساحات ومجاميع ريمان</strong>
            <small style={{ fontSize: 9, color: 'var(--primary)' }} dir="auto">حساب المساحة المحصورة ومجاميع ريمان</small>
          </div>
        </Button>
        <Button variant="outline" className="template-card" onClick={() => {
          load(referenceProject);
          persistProject(referenceProject);
          setNotice('Loaded QED Classic story');
        }}>
          <div className="template-art">
            <svg viewBox="0 0 160 90">
              <path d="M10 65H150M80 10V85" className="art-axis"/>
              <path d="M30 15Q80 115 130 15" className="art-curve" fill="none"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">الاشتقاق والمماس (QED Classic)</strong>
            <small style={{ fontSize: 9, color: 'var(--muted-foreground)' }} dir="auto">منحنى الدالة وميل المماس اللحظي</small>
          </div>
        </Button>
        <Button variant="outline" className="template-card" onClick={() => {
          const blank: StudioProject = {
            ...referenceProject,
            id: `project-${crypto.randomUUID()}`,
            name: 'مشروع جديد فارغ',
            scenes: [{
              id: crypto.randomUUID(),
              label: '01',
              title: 'مشهد البداية',
              body: 'ابدأ فكرتك الرياضية البصرية هنا.',
              duration: 5,
              kind: 'explain',
              phase: 'Intuition',
              animation: 'Fade',
              visual: 'none',
              fontFamily: 'Tajawal',
              fontSize: 42,
            }],
          };
          load(blank);
          persistProject(blank);
          setNotice('Started blank canvas');
        }}>
          <div className="template-art"><Plus size={28}/></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong dir="auto">لوحة بيضاء جديدة</strong>
            <small style={{ fontSize: 9, color: 'var(--muted-foreground)' }} dir="auto">ابدأ بناء درسك الرياضي من الصفر</small>
          </div>
        </Button>
      </div>}
      {panel === 'library' && <div className="modal-content">
        <div className="library-search">
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search mathematics topics, formulas, or concepts…"
              value={librarySearch}
              onChange={e => setLibrarySearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
            <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted-foreground)' }}/>
          </div>
        </div>
        <div className="library-filter-row" role="tablist" aria-label="Library source">
          {([
            ['lessons', 'Lessons', null],
            ['mistake', 'Mistakes', legacyTotals.mistakes],
            ['ready', 'Ready videos', legacyTotals.ready],
            ['intuition', 'Intuition', legacyTotals.intuition],
            ['solve', 'Solved exercises', legacyTotals.solve],
          ] as const).map(([id, label, count]) => (
            <Button
              key={id}
              role="tab"
              aria-selected={librarySource === id}
              variant={librarySource === id ? 'default' : 'outline'}
              size="sm"
              style={{ height: 26, fontSize: 10 }}
              onClick={() => { setLibrarySource(id); setLibraryLevel('all'); setLibraryLimit(60); }}
            >
              {label}{count !== null ? ` · ${count}` : ''}
            </Button>
          ))}
        </div>
        {librarySource !== 'lessons' && <div className="library-filter-row">
          {['all', ...legacyLevelList].map(lvl => (
            <Button key={lvl} variant={libraryLevel === lvl ? 'secondary' : 'outline'} size="sm" style={{ height: 26, fontSize: 10 }} onClick={() => { setLibraryLevel(lvl); setLibraryLimit(60); }}>
              {lvl === 'all' ? 'All levels' : lvl}
            </Button>
          ))}
          <span className="count" style={{ marginLeft: 'auto' }}>{legacyEntries.length} results</span>
        </div>}
        {librarySource === 'lessons' && <div className="library-filter-row">
          {(['all', 'BAC 2026', '2AS', '1AS / 4AM'] as const).map(lvl => (
            <Button
              key={lvl}
              variant={libraryLevel === lvl ? 'secondary' : 'outline'}
              size="sm"
              style={{ height: 26, fontSize: 10 }}
              onClick={() => setLibraryLevel(lvl)}
            >
              {lvl === 'all' ? 'All levels' : lvl}
            </Button>
          ))}
        </div>}
        <div style={{ display: 'grid', gap: 10, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
          {librarySource === 'lessons' && filteredLessons.map(lesson => (
            <div key={lesson.id} className="library-card">
              <div className="library-card-header">
                <div className="library-card-meta">
                  <span className="count">{lesson.level}</span>
                  <span className="count" style={{ color: 'var(--primary)' }}>{lesson.categoryLabel}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    load(lessonToStudioProject(lesson));
                    setNotice(`Loaded lesson: ${lesson.title}`);
                  }}
                >
                  <Sparkles size={13}/>Load lesson
                </Button>
              </div>
              <strong dir="auto">{lesson.title}</strong>
              <p dir="auto">{lesson.summary}</p>
              <div className="library-mistake-box" dir="auto">
                <strong>فخ شائع:</strong>
                <span>{lesson.mistake}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--muted-foreground)' }}>
                <span className="art-expression" style={{ fontSize: 15 }}>{lesson.expression}</span>
                <span>Visual: {lesson.visualModel}</span>
              </div>
            </div>
          ))}
                  {legacyEntries.slice(0, libraryLimit).map(entry => (
            <div key={entry.id} className="library-card">
              <div className="library-card-header">
                <div className="library-card-meta">
                  <span className="count">{entry.level}</span>
                  <span className="count" style={{ color: 'var(--primary)' }}>{entry.source === 'solve' && entry.solveType ? `${SOLVE_TYPES[entry.solveType]?.[0] ?? ''} ${SOLVE_TYPES[entry.solveType]?.[1] ?? entry.solveType}` : entry.chapter}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const next = legacyToProject(entry);
                    if (!next) { setNotice('This library entry could not be converted.'); return; }
                    load(next);
                    setPanel(null);
                    setNotice(`Loaded: ${entry.topic}`);
                  }}
                >
                  <Sparkles size={13}/>Load video
                </Button>
              </div>
              <strong dir="auto">{entry.topic}</strong>
              <p dir="auto">{entry.hook}</p>
              <div className="library-mistake-box" dir="auto">
                <strong>{entry.source === 'intuition' ? 'القاعدة:' : entry.source === 'solve' ? 'التمرين:' : 'فخ شائع:'}</strong>
                <span>{entry.summary}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Visual model: {entry.model}</div>
            </div>
          ))}
          {librarySource !== 'lessons' && legacyEntries.length > libraryLimit && (
            <Button variant="outline" size="sm" onClick={() => setLibraryLimit(n => n + 60)}>Show more ({legacyEntries.length - libraryLimit} left)</Button>
          )}
          {librarySource !== 'lessons' && legacyEntries.length === 0 && <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No entries match this search.</p>}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setCustomBuilderOpen(o => !o)}>
            {customBuilderOpen ? 'Hide custom story builder' : 'Or build a custom lesson from scratch →'}
          </Button>
          {customBuilderOpen && (
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <Field label="Level"><input value={project.level} onChange={e => commit({ ...project, level: e.target.value })}/></Field>
              <Field label="Topic"><input value={project.topic} onChange={e => commit({ ...project, topic: e.target.value })}/></Field>
              <Field label="Expression"><input value={project.expression} onChange={e => commit({ ...project, expression: e.target.value })}/></Field>
              <Field label="Common mistake"><textarea value={project.mistake} onChange={e => commit({ ...project, mistake: e.target.value })}/></Field>
              <Field label="Correction"><textarea value={project.remediation} onChange={e => commit({ ...project, remediation: e.target.value })}/></Field>
              <Button onClick={() => load({ ...project, scenes: buildScenes(project) })}><Sparkles size={16}/>Build story</Button>
            </div>
          )}
        </div>
      </div>}
      {panel === 'audio' && <div className="modal-content">
        <div style={{ display: 'grid', gap: 10, padding: 14, background: 'var(--background)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 12, display: 'block' }}>Microphone Voice-Over</strong>
              <small style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Record live narration directly in browser</small>
            </div>
            {isRecording ? (
              <Button variant="destructive" size="sm" onClick={toggleRecording}>
                <span className="record-pulse" style={{ marginRight: 6 }}/>
                Stop ({recordingSeconds}s)
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={toggleRecording}>
                <Mic size={14}/>Record Narration
              </Button>
            )}
          </div>
          {isRecording && (
            <div style={{ fontSize: 11, color: 'var(--destructive)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="record-pulse"/> Recording live microphone audio… Speak clearly.
            </div>
          )}
        </div>
        <label className="audio-upload">
          <AudioLines size={32}/>
          <strong>{audioName || (project.mediaName ? `Reattach ${project.mediaName}` : 'Upload audio file (.mp3, .wav, .webm)')}</strong>
          <input type="file" accept="audio/*" onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = URL.createObjectURL(f);
            setAudioUrl(url);
            setAudioName(f.name);
            commit({
              ...project,
              mediaName: f.name,
              audioTrack: {
                name: f.name,
                url,
                volume,
                muted: false,
                startOffset: project.audioTrack?.startOffset ?? 0,
                ducking: project.audioTrack?.ducking ?? false,
              },
            });
            setMuted(false);
          }}/>
        </label>
        <Field label="Volume" extra={`${volume}%`}>
          <input type="range" min="0" max="100" value={volume} onChange={e => {
            const v = Number(e.target.value);
            setVolume(v);
            if (project.audioTrack) commit({ ...project, audioTrack: { ...project.audioTrack, volume: v } });
          }}/>
        </Field>
        <Field label="Start audio offset" extra={`${(project.audioTrack?.startOffset ?? 0).toFixed(1)}s`}>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={project.audioTrack?.startOffset ?? 0}
            onChange={e => {
              const off = Number(e.target.value);
              commit({
                ...project,
                audioTrack: {
                  name: audioName || project.mediaName || 'Audio track',
                  volume,
                  muted,
                  ...project.audioTrack,
                  startOffset: off,
                },
              });
            }}
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 12, display: 'block' }}>Audio Ducking</strong>
            <small style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Lower background audio level during voice speech</small>
          </div>
          <Button
            variant={project.audioTrack?.ducking ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              const duck = !(project.audioTrack?.ducking ?? false);
              commit({
                ...project,
                audioTrack: {
                  name: audioName || project.mediaName || 'Audio track',
                  volume,
                  muted,
                  ...project.audioTrack,
                  ducking: duck,
                },
              });
            }}
          >
            {project.audioTrack?.ducking ? 'Ducking ON' : 'Ducking OFF'}
          </Button>
        </div>
        <Button variant="outline" onClick={() => setMuted(m => !m)}>
          {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>} {muted ? 'Enable audio' : 'Mute audio'}
        </Button>
      </div>}
      {panel === 'settings' && <div className="modal-content">
        <div style={{ display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 13 }}>Brand Kit & Watermark</strong>
          <div className="brand-kit-grid">
            {Object.entries(defaultBrandKits).map(([key, kit]) => {
              const isActive = (project.brandKit?.name === kit.name) || (!project.brandKit && key === 'qed');
              return (
                <div
                  key={key}
                  className={`brand-kit-card ${isActive ? 'active-kit' : ''}`}
                  onClick={() => {
                    commit({ ...project, brandKit: kit });
                    setNotice(`Applied brand kit: ${kit.name}`);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 12, color: isActive ? 'var(--primary)' : 'inherit' }}>{kit.name}</strong>
                    <div style={{ width: 14, height: 14, borderRadius: kit.logoStyle === 'circle' ? '50%' : 2, background: kit.accentColor }}/>
                  </div>
                  <small style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{kit.brandName} · {kit.logoStyle ?? 'square'}</small>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{kit.tagline}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 8, padding: 12, background: 'var(--background)', borderRadius: 5, border: '1px solid var(--border)' }}>
            <Field label="Brand Display Name">
              <input
                value={project.brandKit?.brandName ?? 'QED'}
                onChange={e => commit({
                  ...project,
                  brandKit: {
                    name: project.brandKit?.name ?? 'Custom Brand',
                    brandName: e.target.value,
                    tagline: project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.',
                    footnote: project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING',
                    accentColor: project.brandKit?.accentColor ?? 'oklch(0.845 0.135 153)',
                    logoStyle: project.brandKit?.logoStyle ?? 'square',
                  },
                })}
              />
            </Field>
            <Field label="Tagline (Top Right)">
              <input
                value={project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.'}
                onChange={e => commit({
                  ...project,
                  brandKit: {
                    name: project.brandKit?.name ?? 'Custom Brand',
                    brandName: project.brandKit?.brandName ?? 'QED',
                    tagline: e.target.value,
                    footnote: project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING',
                    accentColor: project.brandKit?.accentColor ?? 'oklch(0.845 0.135 153)',
                    logoStyle: project.brandKit?.logoStyle ?? 'square',
                  },
                })}
              />
            </Field>
            <Field label="Footnote (Bottom Watermark)">
              <input
                value={project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING'}
                onChange={e => commit({
                  ...project,
                  brandKit: {
                    name: project.brandKit?.name ?? 'Custom Brand',
                    brandName: project.brandKit?.brandName ?? 'QED',
                    tagline: project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.',
                    footnote: e.target.value,
                    accentColor: project.brandKit?.accentColor ?? 'oklch(0.845 0.135 153)',
                    logoStyle: project.brandKit?.logoStyle ?? 'square',
                  },
                })}
              />
            </Field>
            <Field label="Logo Style">
              <select
                value={project.brandKit?.logoStyle ?? 'square'}
                onChange={e => {
                  const style = e.target.value as 'square' | 'circle' | 'minimal';
                  commit({
                    ...project,
                    brandKit: {
                      name: project.brandKit?.name ?? 'Custom Brand',
                      brandName: project.brandKit?.brandName ?? 'QED',
                      tagline: project.brandKit?.tagline ?? 'A LITTLE CLARITY. A BIG DIFFERENCE.',
                      footnote: project.brandKit?.footnote ?? 'MOMENTS OF UNDERSTANDING',
                      accentColor: project.brandKit?.accentColor ?? 'oklch(0.845 0.135 153)',
                      logoStyle: style,
                    },
                  });
                }}
              >
                <option value="square">Square ∎ (QED default)</option>
                <option value="circle">Circle ●</option>
                <option value="minimal">Minimal (No icon)</option>
              </select>
            </Field>
          </div>
        </div>
        <Field label="Video format">
          <select value={project.format} onChange={e => commit({ ...project, format: e.target.value as StudioProject['format'] })}>
            <option value="portrait">9:16 · Portrait</option>
            <option value="landscape">16:9 · Landscape</option>
          </select>
        </Field>
        <Button variant="outline" onClick={() => setSafeZones(v => !v)}>
          <ShieldCheck size={16}/>{safeZones ? 'Hide safe zones' : 'Show safe zones'}
        </Button>
      </div>}
      {panel === 'export' && <div className="modal-content"><div className="export-summary"><Film size={26}/><div><strong>{project.name}</strong><span>{ratio} · {timecode(duration)} · {project.scenes.length} scenes</span></div></div><ExportPanel project={project} time={time} audioUrl={audioUrl} muted={muted} volume={volume} onProjectDownload={exportProject}/><Button variant="outline" onClick={() => file.current?.click()}><FolderOpen size={16}/>Import project</Button></div>}
    </DialogContent></Dialog>
    {importWarnings.length > 0 && <div className="compatibility-notice" role="status"><span>{importWarnings.join(' ')}</span><IconButton icon={X} label="Dismiss import warning" onClick={() => setImportWarnings([])}/></div>}
    {notice && <div className="toast" role="status"><Check size={16}/>{notice}<IconButton icon={X} label="Dismiss notification" onClick={() => setNotice('')}/></div>}
  </div>;
}
