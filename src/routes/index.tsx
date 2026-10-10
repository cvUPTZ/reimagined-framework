import { createFileRoute } from "@tanstack/react-router";
import {
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  Expand,
  Film,
  FolderOpen,
  ImagePlus,
  LayoutTemplate,
  Lightbulb,
  Maximize2,
  Mic2,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Redo2,
  Scissors,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  buildScenes,
  defaultProject,
  duplicateScene,
  moveScene,
  totalDuration,
  type Scene,
  type StudioProject,
  type StudioTab,
} from "@/lib/studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QED Studio — محرّر فيديوهات الرياضيات" },
      { name: "description", content: "استوديو عربي لصناعة فيديوهات رياضيات قصيرة وواضحة." },
      { property: "og:title", content: "QED Studio — محرّر فيديوهات الرياضيات" },
      { property: "og:description", content: "أنشئ المشاهد، سجّل الصوت، وصدّر فيديوك من مساحة عمل واحدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<StudioTab>("scenes");
  const [project, setProject] = useState<StudioProject>(defaultProject);
  const [selected, setSelected] = useState(1);
  const [safeZones, setSafeZones] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(74);
  const [playhead, setPlayhead] = useState(3.8);
  const [saved, setSaved] = useState(true);
  const [history, setHistory] = useState<StudioProject[]>([]);
  const [future, setFuture] = useState<StudioProject[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const duration = useMemo(() => totalDuration(project.scenes), [project.scenes]);
  const scene = project.scenes[selected] ?? project.scenes[0];

  useEffect(() => {
    const raw = window.localStorage.getItem("qed-studio-project-v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StudioProject;
      if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) setProject(parsed);
    } catch {
      window.localStorage.removeItem("qed-studio-project-v1");
    }
  }, []);

  useEffect(() => {
    setSaved(false);
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("qed-studio-project-v1", JSON.stringify(project));
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPlayhead((current) => (current >= duration ? 0 : Math.min(duration, current + 0.1)));
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, playing]);

  const commit = (next: StudioProject) => {
    setHistory((items) => [...items.slice(-29), project]);
    setFuture([]);
    setProject(next);
  };

  const updateScene = (patch: Partial<Scene>) => {
    if (!scene) return;
    commit({ ...project, scenes: project.scenes.map((item) => (item.id === scene.id ? { ...item, ...patch } : item)) });
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [project, ...items]);
    setHistory((items) => items.slice(0, -1));
    setProject(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, project]);
    setFuture((items) => items.slice(1));
    setProject(next);
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ app: "QED Studio", format: 1, savedAt: new Date().toISOString(), project }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name}.cmb.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProject = async (file: File | undefined) => {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as { project?: StudioProject } | StudioProject;
    const next = "project" in parsed && parsed.project ? parsed.project : (parsed as StudioProject);
    if (!Array.isArray(next.scenes) || next.scenes.length === 0) return;
    commit({ ...next, id: `${next.id || "import"}-${Date.now()}` });
    setSelected(0);
  };

  return (
    <div dir="rtl" className="studio-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">∎</span>
          <div><strong>QED</strong><span>STUDIO</span></div>
        </div>
        <div className="topbar-divider" />
        <button className="project-switcher" aria-label="فتح قائمة المشاريع">
          <span className="project-icon"><FolderOpen size={17} /></span>
          <span><small>المشروع الحالي</small><strong>{project.name}</strong></span>
          <ChevronDown size={15} />
        </button>
        <div className="save-state"><span className={saved ? "save-dot saved" : "save-dot"} />{saved ? "تم الحفظ" : "جارٍ الحفظ"}</div>
        <div className="topbar-spacer" />
        <div className="history-controls">
          <Button variant="icon" size="icon" aria-label="تراجع" onClick={undo} disabled={!history.length}><Undo2 size={17} /></Button>
          <Button variant="icon" size="icon" aria-label="إعادة" onClick={redo} disabled={!future.length}><Redo2 size={17} /></Button>
        </div>
        <button className="format-switch" onClick={() => commit({ ...project, format: project.format === "portrait" ? "landscape" : "portrait" })}>
          <span className={project.format === "portrait" ? "format-icon portrait" : "format-icon"} />
          {project.format === "portrait" ? "عمودي 9:16" : "أفقي 16:9"}
          <ChevronDown size={14} />
        </button>
        <Button variant={safeZones ? "quiet" : "icon"} size="icon" aria-label="مناطق الأمان" onClick={() => setSafeZones(!safeZones)}><ShieldCheck size={18} /></Button>
        <Button variant="icon" size="icon" aria-label="المساعدة"><CircleHelp size={18} /></Button>
        <div className="avatar">ز</div>
      </header>

      <aside className="rail" aria-label="أقسام الاستوديو">
        <div className="rail-main">
          <RailButton active={tab === "ideas"} icon={<Lightbulb />} label="الأفكار" onClick={() => setTab("ideas")} />
          <RailButton active={tab === "scenes"} icon={<LayoutTemplate />} label="المشاهد" onClick={() => setTab("scenes")} />
          <RailButton active={tab === "audio"} icon={<AudioLines />} label="الصوت" onClick={() => setTab("audio")} />
          <RailButton active={tab === "export"} icon={<Download />} label="التصدير" onClick={() => setTab("export")} />
        </div>
        <div className="rail-bottom"><RailButton icon={<Settings2 />} label="الإعدادات" /><RailButton icon={<CircleHelp />} label="المساعدة" /></div>
      </aside>

      <main className="workspace">
        <section className="stage-area">
          <div className="stage-toolbar">
            <div className="stage-title"><Film size={15} /><span>المعاينة المباشرة</span><span className="live-pill"><i /> مباشر</span></div>
            <div className="zoom-control">
              <Button variant="icon" size="icon" aria-label="تصغير" onClick={() => setZoom(Math.max(40, zoom - 5))}><ChevronRight size={16} /></Button>
              <input aria-label="التكبير" type="range" min="40" max="100" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              <span>{zoom}%</span>
              <Button variant="icon" size="icon" aria-label="تكبير"><Maximize2 size={16} /></Button>
            </div>
          </div>
          <div className="stage-canvas-area">
            <div className={`video-frame ${project.format}`} style={{ "--preview-scale": zoom / 74 } as CSSProperties}>
              <div className="frame-grid" />
              {safeZones && <div className="safe-zone"><span>منطقة آمنة</span></div>}
              <div className={`scene-visual kind-${scene?.kind ?? "hook"}`}>
                <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
                <span className="scene-kicker">QED · {project.level}</span>
                <h1>{scene?.body.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                <div className="math-block">{project.expression}</div>
                <div className="progress-bars"><span /><span /><span /><span /><span /></div>
              </div>
              <div className="frame-watermark">QED ∎</div>
            </div>
          </div>
          <div className="transport">
            <div className="transport-left"><Button variant="icon" size="icon" aria-label="السابق" onClick={() => setSelected(Math.max(0, selected - 1))}><ChevronRight size={18} /></Button></div>
            <Button className="play-button" size="icon" aria-label={playing ? "إيقاف" : "تشغيل"} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</Button>
            <Button variant="icon" size="icon" aria-label="التالي" onClick={() => setSelected(Math.min(project.scenes.length - 1, selected + 1))}><ChevronLeft size={18} /></Button>
            <span className="timecode" dir="ltr">{playhead.toFixed(1)} / {duration.toFixed(1)}s</span>
            <div className="transport-spacer" />
            <Button variant="icon" size="icon" aria-label="الصوت"><Volume2 size={18} /></Button>
            <Button variant="icon" size="icon" aria-label="ملء الشاشة"><Expand size={17} /></Button>
          </div>
        </section>

        <PropertiesPanel tab={tab} project={project} scene={scene} onProject={(patch) => commit({ ...project, ...patch })} onScene={updateScene} onBuild={() => { commit({ ...project, scenes: buildScenes(project) }); setSelected(0); setTab("scenes"); }} onExport={exportProject} onImport={() => fileRef.current?.click()} safeZones={safeZones} />
      </main>

      <section className="timeline" aria-label="الخط الزمني">
        <div className="timeline-header">
          <div className="timeline-tools"><Button variant="icon" size="icon" aria-label="قص"><Scissors size={16} /></Button><Button variant="icon" size="icon" aria-label="نسخ" onClick={() => { commit({ ...project, scenes: duplicateScene(project.scenes, selected) }); setSelected(selected + 1); }}><Copy size={16} /></Button><span className="tool-divider" /><Button variant="icon" size="icon" aria-label="حذف" disabled={project.scenes.length <= 1} onClick={() => { commit({ ...project, scenes: project.scenes.filter((_, i) => i !== selected) }); setSelected(Math.max(0, selected - 1)); }}><Trash2 size={16} /></Button></div>
          <div className="timeline-label"><span>المشاهد</span><b>{project.scenes.length}</b></div>
          <div className="timeline-actions"><Button variant="outline" size="sm" onClick={() => { const next: Scene = { id: String(Date.now()), title: "مشهد جديد", label: String(project.scenes.length + 1).padStart(2, "0"), body: "اكتب فكرتك هنا", duration: 3, kind: "explain" }; commit({ ...project, scenes: [...project.scenes, next] }); setSelected(project.scenes.length); }}><Plus size={15} /> إضافة مشهد</Button><Button variant="icon" size="icon" aria-label="خيارات"><MoreHorizontal size={17} /></Button></div>
        </div>
        <div className="timeline-track">
          {project.scenes.map((item, index) => <SceneCard key={item.id} scene={item} active={selected === index} onClick={() => { setSelected(index); setPlayhead(project.scenes.slice(0, index).reduce((sum, current) => sum + current.duration, 0)); }} onMove={(direction) => { const to = index + direction; commit({ ...project, scenes: moveScene(project.scenes, index, to) }); setSelected(Math.max(0, Math.min(project.scenes.length - 1, to))); }} />)}
          <button className="add-scene-card" onClick={() => { const next: Scene = { id: String(Date.now()), title: "مشهد جديد", label: String(project.scenes.length + 1).padStart(2, "0"), body: "اكتب فكرتك هنا", duration: 3, kind: "explain" }; commit({ ...project, scenes: [...project.scenes, next] }); }}><Plus size={20} /><span>مشهد جديد</span></button>
        </div>
      </section>
      <input ref={fileRef} type="file" accept=".json,.cmb.json,application/json" hidden onChange={(event) => void importProject(event.target.files?.[0])} />
    </div>
  );
}

function RailButton({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return <button className={`rail-button ${active ? "active" : ""}`} aria-pressed={active} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function SceneCard({ scene, active, onClick, onMove }: { scene: Scene; active: boolean; onClick: () => void; onMove: (direction: number) => void }) {
  return <article className={`scene-card ${active ? "active" : ""}`} onClick={onClick}>
    <div className={`scene-thumb kind-${scene.kind}`}><span>{scene.label}</span><strong>{scene.body.split("\n")[0]}</strong>{active && <div className="move-controls"><button aria-label="حرّك يميناً" onClick={(e) => { e.stopPropagation(); onMove(-1); }}><ChevronRight size={12} /></button><button aria-label="حرّك يساراً" onClick={(e) => { e.stopPropagation(); onMove(1); }}><ChevronLeft size={12} /></button></div>}</div>
    <div className="scene-meta"><strong>{scene.title}</strong><span>{scene.duration.toFixed(1)} ث</span></div>
  </article>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function PropertiesPanel({ tab, project, scene, onProject, onScene, onBuild, onExport, onImport, safeZones }: { tab: StudioTab; project: StudioProject; scene: Scene | undefined; onProject: (patch: Partial<StudioProject>) => void; onScene: (patch: Partial<Scene>) => void; onBuild: () => void; onExport: () => void; onImport: () => void; safeZones: boolean }) {
  const titles = { ideas: ["مختبر الأفكار", "حوّل فكرة رياضية إلى قصة قصيرة"], scenes: ["خصائص المشهد", `المشهد ${scene?.label ?? "—"} · ${scene?.title ?? ""}`], audio: ["الصوت والتعليق", "رتّب صوتك وموسيقاك"], export: ["تصدير الفيديو", "افحص مشروعك قبل الإخراج"] } as const;
  return <aside className="properties">
    <div className="properties-heading"><div><h2>{titles[tab][0]}</h2><p>{titles[tab][1]}</p></div><Button variant="icon" size="icon" aria-label="إعدادات اللوحة"><SlidersHorizontal size={17} /></Button></div>
    <div className="properties-scroll">
      {tab === "scenes" && scene && <>
        <div className="panel-section"><Field label="عنوان المشهد"><input value={scene.title} onChange={(e) => onScene({ title: e.target.value })} /></Field><Field label="النص على الشاشة"><textarea rows={4} value={scene.body} onChange={(e) => onScene({ body: e.target.value })} /></Field></div>
        <div className="panel-section"><div className="section-title"><span>التوقيت</span><small>{scene.duration.toFixed(1)} ثانية</small></div><input className="range-wide" type="range" min="1" max="12" step="0.5" value={scene.duration} onChange={(e) => onScene({ duration: Number(e.target.value) })} /><div className="range-labels"><span>1 ث</span><span>12 ث</span></div></div>
        <div className="panel-section"><div className="section-title"><span>نوع المشهد</span></div><div className="segmented">{(["hook", "explain", "rule", "cta"] as const).map((kind) => <button key={kind} className={scene.kind === kind ? "active" : ""} onClick={() => onScene({ kind })}>{({ hook: "خطاف", explain: "شرح", rule: "قاعدة", cta: "دعوة" })[kind]}</button>)}</div></div>
        <div className="panel-section"><div className="section-title"><span>عناصر الشاشة</span></div><button className="asset-row"><span className="asset-icon"><ImagePlus size={17} /></span><span><strong>رسم بصري</strong><small>مخطط العملية</small></span><ChevronLeft size={15} /></button><button className="asset-row"><span className="asset-icon"><Sparkles size={17} /></span><span><strong>الحركة</strong><small>ظهور تدريجي · 0.4 ث</small></span><ChevronLeft size={15} /></button></div>
      </>}
      {tab === "ideas" && <>
        <div className="panel-section form-stack"><Field label="المستوى"><select value={project.level} onChange={(e) => onProject({ level: e.target.value })}><option>BAC 2026</option><option>BEM 2026</option><option>Brevet</option><option>IB Mathematics</option></select></Field><Field label="الموضوع"><input value={project.topic} onChange={(e) => onProject({ topic: e.target.value })} /></Field><Field label="التعبير"><input dir="ltr" value={project.expression} onChange={(e) => onProject({ expression: e.target.value })} /></Field><Field label="الخطأ الشائع"><textarea rows={3} value={project.mistake} onChange={(e) => onProject({ mistake: e.target.value })} /></Field><Field label="خطة التصحيح"><textarea rows={3} value={project.remediation} onChange={(e) => onProject({ remediation: e.target.value })} /></Field><Field label="دعوة إلى التفاعل"><input value={project.cta} onChange={(e) => onProject({ cta: e.target.value })} /></Field></div><div className="sticky-action"><Button className="w-full" onClick={onBuild}><Sparkles size={16} /> بناء القصة والمشاهد</Button></div>
      </>}
      {tab === "audio" && <><div className="panel-section audio-meter"><div className="audio-source"><span><Mic2 size={18} /></span><div><strong>التعليق الصوتي</strong><small>لم يُسجّل بعد</small></div><Button variant="outline" size="sm">تسجيل</Button></div><div className="waveform">{Array.from({ length: 34 }).map((_, i) => <i key={i} style={{ height: `${18 + ((i * 13) % 34)}%` }} />)}</div></div><div className="panel-section"><div className="audio-source"><span><Music2 size={18} /></span><div><strong>الموسيقى</strong><small>Warm Focus · Lo-fi</small></div><button className="mini-toggle active"><span /></button></div><Field label="مستوى الموسيقى"><input className="range-wide" type="range" defaultValue="24" /></Field></div><div className="panel-section"><div className="section-title"><span>الملقّن</span><small>جاهز</small></div><p className="prompter-copy">اقرأ النص مشهداً بمشهد أثناء التسجيل. ينتقل الملقّن تلقائياً مع الخط الزمني.</p><Button variant="outline" className="w-full"><Mic2 size={15} /> فتح وضع التسجيل</Button></div></>}
      {tab === "export" && <><div className="preflight"><div className="preflight-title"><ShieldCheck size={19} /><span><strong>جاهز للتصدير</strong><small>تم اجتياز الفحص الأساسي</small></span></div>{[["نسبة الأبعاد", project.format === "portrait" ? "9:16" : "16:9"], ["مدة الفيديو", `${totalDuration(project.scenes).toFixed(1)} ث`], ["منطقة الأمان", safeZones ? "مفعّلة" : "غير مفعّلة"], ["المشاهد", String(project.scenes.length)]].map(([key, value]) => <div className="check-row" key={key}><Check size={15} /><span>{key}</span><b>{value}</b></div>)}</div><div className="panel-section form-stack"><Field label="الدقة"><select defaultValue="1080"><option value="1080">1080 × 1920 · Full HD</option><option value="720">720 × 1280 · HD</option></select></Field><div className="field-pair"><Field label="معدل الإطارات"><select defaultValue="30"><option>30</option><option>60</option></select></Field><Field label="الجودة"><select defaultValue="high"><option value="high">عالية</option><option value="medium">متوسطة</option></select></Field></div></div><div className="export-actions"><Button className="w-full"><Film size={16} /> تصدير MP4</Button><Button variant="outline" className="w-full" onClick={onExport}><Download size={15} /> حفظ ملف المشروع</Button><Button variant="quiet" className="w-full" onClick={onImport}><Upload size={15} /> استيراد مشروع</Button></div></>}
    </div>
  </aside>;
}
