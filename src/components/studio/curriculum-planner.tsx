import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronLeft, Clock, Film, Lightbulb, Search, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenePreview } from './scene-preview';
import { legacyToProject, listLegacy, type LegacyEntry, type LegacySource } from '@/lib/legacy-library';
import { totalDuration, type StudioProject } from '@/lib/studio';

export type CurriculumLevel = '4AM' | '3AS';

export interface CurriculumChapter {
  id: string;
  name: string;
  level: CurriculumLevel;
  order: number;
}

export const CURRICULUM_CHAPTERS: Record<CurriculumLevel, CurriculumChapter[]> = {
  '4AM': [
    { id: '4am-ch1', name: 'القسمة والقاسم المشترك الأكبر (PGCD)', level: '4AM', order: 1 },
    { id: '4am-ch2', name: 'الحساب على الجذور التربيعية', level: '4AM', order: 2 },
    { id: '4am-ch3', name: 'الحساب الحرفي والمتطابقات الشهيرة', level: '4AM', order: 3 },
    { id: '4am-ch4', name: 'المعادلات والمتراجحات من الدرجة الأولى', level: '4AM', order: 4 },
    { id: '4am-ch5', name: 'الهندسة المستوية (طالس وفيثاغورس والمثلثات)', level: '4AM', order: 5 },
    { id: '4am-ch6', name: 'الدوال الخطية والدوال التآلفية', level: '4AM', order: 6 },
    { id: '4am-ch7', name: 'جمل معادلتين والإحصاء والهندسة الفضائية', level: '4AM', order: 7 },
  ],
  '3AS': [
    { id: '3as-ch1', name: 'الباب 1 · النهايات والاستمرارية', level: '3AS', order: 1 },
    { id: '3as-ch2', name: 'الباب 2 · الاشتقاقية وتطبيقاتها', level: '3AS', order: 2 },
    { id: '3as-ch3', name: 'الباب 3 · الدوال الأسية واللوغاريتمية', level: '3AS', order: 3 },
    { id: '3as-ch4', name: 'الباب 4 · التزايد المقارن', level: '3AS', order: 4 },
    { id: '3as-ch5', name: 'الباب 5 و6 · الدوال الأصلية والحساب التكاملي', level: '3AS', order: 5 },
    { id: '3as-ch6', name: 'الباب 7 · الاحتمالات وقوانين التوزيع', level: '3AS', order: 6 },
    { id: '3as-ch7', name: 'الباب 8 · المتتاليات العددية والبرهان بالتراجع', level: '3AS', order: 7 },
    { id: '3as-ch8', name: 'الباب 9 و10 · القسمة والموافقات في Z', level: '3AS', order: 8 },
    { id: '3as-ch9', name: 'الباب 12 · الأعداد المركبة والتحويلات النقطية', level: '3AS', order: 9 },
  ],
};


const chapterPatterns: Record<string, RegExp> = {
  '4am-ch1': /قاسم|قسمة|PGCD|إقليدس/i,
  '4am-ch2': /جذور|جذر/i,
  '4am-ch3': /حرفي|متطابقات|نشر|تحليل|مربع مجموع/i,
  '4am-ch4': /معادلات|متراجحات|سالب/i,
  '4am-ch5': /طالس|فيثاغورس|مثلثات|ظل|جيب/i,
  '4am-ch6': /دوال خطية|تآلفية/i,
  '4am-ch7': /جمل|إحصاء|فضاء|مكعب|قوى/i,
  '3as-ch1': /نهايات|استمرار/i,
  '3as-ch2': /اشتقاق/i,
  '3as-ch3': /أسية|لوغاريتم/i,
  '3as-ch4': /تزايد/i,
  '3as-ch5': /تكامل|أصلية/i,
  '3as-ch6': /احتمال/i,
  '3as-ch7': /متتالي/i,
  '3as-ch8': /قسمة في Z|موافقات|أولية/i,
  '3as-ch9': /مركبة/i,
};
const stages = [
  { source: 'intuition', label: 'بناء الحدس', icon: Lightbulb },
  { source: 'mistake', label: 'تشخيص الأخطاء', icon: Wrench },
  { source: 'solve', label: 'حل التمارين', icon: BookOpen },
] as const;
const entries = stages.flatMap(stage => listLegacy(stage.source));
const matchesChapter = (entry: LegacyEntry, chapter: CurriculumChapter) =>
  entry.level === chapter.level && !!chapterPatterns[chapter.id]?.test(`${entry.chapter} ${entry.topic}`);

export function CurriculumPlanner({ onLoadProject, onNotify }: {
  onLoadProject: (project: StudioProject) => void;
  onNotify: (message: string) => void;
}) {
  const [level, setLevel] = useState<CurriculumLevel>('4AM');
  const [chapterId, setChapterId] = useState('4am-ch1');
  const [source, setSource] = useState<LegacySource>('intuition');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const chapters = CURRICULUM_CHAPTERS[level];
  const chapter = chapters.find(item => item.id === chapterId) ?? chapters[0];
  const chapterEntries = useMemo(() => chapter ? entries.filter(entry => matchesChapter(entry, chapter)) : [], [chapter]);
  const visibleEntries = useMemo(() => chapterEntries.filter(entry => entry.source === source &&
    (!query.trim() || `${entry.topic} ${entry.hook} ${entry.summary}`.toLowerCase().includes(query.trim().toLowerCase()))), [chapterEntries, source, query]);
  const selected = visibleEntries.find(entry => entry.id === selectedId) ?? visibleEntries[0];
  const preview = useMemo(() => selected ? legacyToProject(selected) : null, [selected]);
  const previewScene = preview?.scenes.find(scene => scene.kind === 'visual') ?? preview?.scenes[1] ?? preview?.scenes[0];
  const activeStage = stages.find(stage => stage.source === source) ?? stages[0];

  function changeLevel(next: CurriculumLevel) {
    setLevel(next);
    setChapterId(CURRICULUM_CHAPTERS[next][0]?.id ?? '');
    setQuery(''); setSelectedId(null);
  }
  function openProject() {
    if (!preview || !selected) return;
    onLoadProject(preview);
    onNotify(`تم فتح فيديو: ${selected.topic}`);
  }

  return <div className="curriculum-planner" dir="rtl">
    <header className="planner-topbar">
      <div className="planner-levels" role="group" aria-label="المستوى التعليمي">
        <Button variant={level === '4AM' ? 'secondary' : 'ghost'} aria-pressed={level === '4AM'} onClick={() => changeLevel('4AM')}><span dir="ltr">4AM · BEM</span><small>الرابعة متوسط</small></Button>
        <Button variant={level === '3AS' ? 'secondary' : 'ghost'} aria-pressed={level === '3AS'} onClick={() => changeLevel('3AS')}><span dir="ltr">3AS · BAC</span><small>الثالثة ثانوي</small></Button>
      </div>
      <span className="planner-total"><Film size={14}/>{entries.filter(entry => entry.level === level).length} فيديو في المكتبة</span>
    </header>
    <div className="planner-workspace">
      <aside className="planner-chapters">
        <div className="planner-section-label"><BookOpen size={14}/>الأبواب <span>{chapters.length}</span></div>
        <nav aria-label="الأبواب الدراسية">{chapters.map(item => <Button key={item.id} variant="ghost" className={`planner-chapter ${chapter?.id === item.id ? 'is-selected' : ''}`} aria-current={chapter?.id === item.id ? 'true' : undefined} onClick={() => { setChapterId(item.id); setQuery(''); setSelectedId(null); }}>
          <span className="planner-chapter-number">{String(item.order).padStart(2, '0')}</span>
          <span className="planner-chapter-name">{item.name.replace(/^الباب [\d و]+ · /, '')}</span>
          <ChevronLeft size={13}/>
        </Button>)}</nav>
      </aside>
      <section className="planner-browser">
        <div className="planner-chapter-heading"><span className="planner-section-label">الباب {chapter?.order}</span><h3>{chapter?.name.replace(/^الباب [\d و]+ · /, '')}</h3><small>{chapterEntries.length} فيديو متاح</small></div>
        <div className="planner-stages" role="tablist" aria-label="نوع الفيديو">{stages.map((stage, index) => <Button key={stage.source} variant="ghost" role="tab" aria-selected={source === stage.source} className={`planner-stage ${source === stage.source ? 'is-selected' : ''}`} onClick={() => { setSource(stage.source); setSelectedId(null); }}><span className="planner-stage-step">{index + 1}</span><stage.icon size={14}/><span>{stage.label}</span><small>{chapterEntries.filter(entry => entry.source === stage.source).length}</small></Button>)}</div>
        <div className="planner-search"><Search size={15}/><input aria-label="ابحث في فيديوهات الباب" placeholder="ابحث عن موضوع أو سؤال…" value={query} onChange={event => { setQuery(event.target.value); setSelectedId(null); }}/>{query && <Button variant="ghost" size="icon" aria-label="مسح البحث" onClick={() => setQuery('')}><X size={14}/></Button>}</div>
        <div className="planner-list" role="tabpanel" aria-label={activeStage.label}>
          {visibleEntries.map((entry, index) => <Button key={entry.id} variant="ghost" className={`planner-video ${selected?.id === entry.id ? 'is-selected' : ''}`} aria-pressed={selected?.id === entry.id} onClick={() => setSelectedId(entry.id)}>
            <span className="planner-video-number">{String(index + 1).padStart(2, '0')}</span><span className="planner-video-copy"><strong>{entry.topic}</strong><span>{entry.hook}</span></span>{selected?.id === entry.id ? <Check size={16}/> : <ChevronLeft size={16}/>}
          </Button>)}
          {!visibleEntries.length && <div className="planner-empty"><activeStage.icon size={26}/><strong>{query ? 'لا توجد نتائج مطابقة' : 'لا توجد فيديوهات لهذا النوع بعد'}</strong>{query ? <Button variant="outline" size="sm" onClick={() => setQuery('')}>مسح البحث</Button> : <Button variant="outline" size="sm" onClick={() => { const available = stages.find(stage => chapterEntries.some(entry => entry.source === stage.source)); if (available) setSource(available.source); }} disabled={!chapterEntries.length}>عرض الفيديوهات المتاحة</Button>}</div>}
        </div>
        <footer className="planner-list-footer">{visibleEntries.length} فيديو · {activeStage.label}</footer>
      </section>
      <aside className="planner-detail">
        <span className="planner-section-label"><Film size={14}/>معاينة الفيديو</span>
        {selected && preview && previewScene ? <>
          <div className="planner-artwork"><ScenePreview project={preview} scene={previewScene} elapsed={previewScene.duration} miniature/></div>
          <span className={`planner-type planner-type-${source}`}>{activeStage.label}</span>
          <h4>{selected.topic}</h4>
          <div className="planner-preview-meta"><span><Film size={13}/>{preview.scenes.length} مشاهد</span><span><Clock size={13}/>{Math.round(totalDuration(preview))} ثانية</span></div>
          <p className="planner-summary">{selected.summary}</p>
          <Button className="planner-open" onClick={openProject}>فتح في المحرر<ArrowLeft size={16}/></Button>
        </> : <div className="planner-detail-empty"><Film size={28}/><span>لا يوجد فيديو للمعاينة</span></div>}
      </aside>
    </div>
  </div>;
}
