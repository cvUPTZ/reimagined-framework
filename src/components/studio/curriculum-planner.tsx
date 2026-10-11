import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Film,
  Layers,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenePreview } from './scene-preview';
import { legacyToProject, listLegacy, type LegacyEntry, type LegacySource } from '@/lib/legacy-library';
import { totalDuration, type StudioProject } from '@/lib/studio';

export type CurriculumLevel = '4AM' | '3AS';
export type VideoPlanStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export interface ScheduledPlanItem {
  id: string;
  entryId: string;
  level: CurriculumLevel;
  date: string; // YYYY-MM-DD
  status: VideoPlanStatus;
  note?: string;
}

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
    { id: '3as-ch10', name: 'الباب 13 · التشابه المباشر في المستوي', level: '3AS', order: 10 },
    { id: '3as-ch11', name: 'الباب 14 و15 · الجداء السلمي والهندسة في الفضاء', level: '3AS', order: 11 },
  ],
};

const chapterPatterns: Record<string, RegExp> = {
  '4am-ch1': /قاسم|قسمة|PGCD|إقليدس/i,
  '4am-ch2': /جذور|جذر/i,
  '4am-ch3': /حرفي|متطابقات|نشر|تحليل|مربع مجموع|أعداد نسبية|كسر|تناسبية/i,
  '4am-ch4': /معادلات|متراجحات|سالب/i,
  '4am-ch5': /طالس|فيثاغورس|مثلثات|ظل|جيب|هندسة|محيطية|تكبير/i,
  '4am-ch6': /دوال خطية|تآلفية|دوال/i,
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
  '3as-ch10': /تشابه/i,
  '3as-ch11': /فضاء|مستوي|كرة/i,
};

const stages = [
  { source: 'intuition', label: 'بناء الحدس', icon: Lightbulb },
  { source: 'mistake', label: 'تشخيص الأخطاء', icon: Wrench },
  { source: 'ready', label: 'فيديوهات جاهزة', icon: Film },
  { source: 'solve', label: 'حل التمارين', icon: BookOpen },
] as const;

const allEntries = stages.flatMap(stage => listLegacy(stage.source as LegacySource));

const matchesChapter = (entry: LegacyEntry, chapter: CurriculumChapter) =>
  entry.level === chapter.level && !!chapterPatterns[chapter.id]?.test(`${entry.chapter} ${entry.topic}`);

const pad = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const PLAN_STORAGE_KEY = 'qed_curriculum_plan_v1';

export function CurriculumPlanner({
  onLoadProject,
  onNotify,
}: {
  onLoadProject: (project: StudioProject) => void;
  onNotify: (message: string) => void;
}) {
  const [plannerTab, setPlannerTab] = useState<'curriculum' | 'calendar'>('curriculum');
  const [level, setLevel] = useState<CurriculumLevel>('4AM');
  const [chapterId, setChapterId] = useState('4am-ch1');
  const [source, setSource] = useState<LegacySource>('intuition');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Calendar State
  const [calMonth, setCalMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toYMD(new Date()));
  const [schedule, setSchedule] = useState<Record<string, ScheduledPlanItem>>(() => {
    try {
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(schedule));
    } catch {
      // storage full or disabled
    }
  }, [schedule]);

  const chapters = CURRICULUM_CHAPTERS[level];
  const chapter = chapters.find(item => item.id === chapterId) ?? chapters[0];

  const chapterEntries = useMemo(() => (chapter ? allEntries.filter(entry => matchesChapter(entry, chapter)) : []), [chapter]);

  const visibleEntries = useMemo(
    () =>
      chapterEntries.filter(
        entry =>
          entry.source === source &&
          (!query.trim() || `${entry.topic} ${entry.hook} ${entry.summary}`.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [chapterEntries, source, query],
  );

  const selected = visibleEntries.find(entry => entry.id === selectedId) ?? visibleEntries[0];
  const preview = useMemo(() => (selected ? legacyToProject(selected) : null), [selected]);
  const previewScene = preview?.scenes.find(scene => scene.phase === 'Intuition') ?? preview?.scenes[1] ?? preview?.scenes[0];
  const activeStage = stages.find(stage => stage.source === source) ?? stages[0];

  function changeLevel(next: CurriculumLevel) {
    setLevel(next);
    setChapterId(CURRICULUM_CHAPTERS[next][0]?.id ?? '');
    setQuery('');
    setSelectedId(null);
  }

  function openProject(entry?: LegacyEntry) {
    const target = entry ?? selected;
    if (!target) return;
    const proj = legacyToProject(target);
    if (!proj) return;
    onLoadProject(proj);
    onNotify(`تم فتح فيديو: ${target.topic}`);
  }

  function scheduleEntry(entryId: string, dateStr: string) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;
    setSchedule(prev => ({
      ...prev,
      [entryId]: {
        id: crypto.randomUUID(),
        entryId,
        level: (entry.level as CurriculumLevel) || level,
        date: dateStr,
        status: 'scheduled',
      },
    }));
    onNotify(`تمت جدولة الفيديو ليوم ${dateStr}`);
  }

  function toggleStatus(entryId: string) {
    const item = schedule[entryId];
    if (!item) {
      scheduleEntry(entryId, toYMD(new Date()));
      return;
    }
    const order: VideoPlanStatus[] = ['idea', 'draft', 'scheduled', 'published'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    setSchedule(prev => ({
      ...prev,
      [entryId]: { ...item, status: next },
    }));
    onNotify(`تغيّرت الحالة إلى: ${next}`);
  }

  function autoPlanMonth() {
    const available = allEntries.filter(e => e.level === level);
    if (!available.length) return;
    const d = new Date();
    // Publish 3 days per week: Saturday (6), Monday (1), Wednesday (3)
    const pubDays = [6, 1, 3];
    const newItems: Record<string, ScheduledPlanItem> = { ...schedule };
    let cur = new Date(d);
    let count = 0;

    for (let i = 0; i < available.length && count < 12; i++) {
      const entry = available[i];
      if (newItems[entry.id]) continue;

      // advance until pubDay
      while (!pubDays.includes(cur.getDay())) {
        cur.setDate(cur.getDate() + 1);
      }
      const ymd = toYMD(cur);
      newItems[entry.id] = {
        id: crypto.randomUUID(),
        entryId: entry.id,
        level,
        date: ymd,
        status: 'scheduled',
      };
      cur.setDate(cur.getDate() + 1);
      count++;
    }
    setSchedule(newItems);
    onNotify(`تمت جدولة ${count} فيديوهات تلقائياً لـ ${level}!`);
  }

  // Calendar rendering helpers
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIndex = (firstDay.getDay() + 1) % 7; // Saturday as 0 in Arab regions
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const scheduledByDate = useMemo(() => {
    const map: Record<string, LegacyEntry[]> = {};
    Object.values(schedule).forEach(item => {
      const found = allEntries.find(e => e.id === item.entryId);
      if (found) {
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push(found);
      }
    });
    return map;
  }, [schedule]);

  const monthNames = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="curriculum-planner" dir="rtl">
      {/* Primary Top Bar & Mode Switcher */}
      <header className="planner-topbar">
        <div className="planner-levels" role="group" aria-label="المستوى التعليمي">
          <Button variant={level === '4AM' ? 'secondary' : 'ghost'} aria-pressed={level === '4AM'} onClick={() => changeLevel('4AM')}>
            <span dir="ltr">4AM · BEM</span>
            <small>الرابعة متوسط</small>
          </Button>
          <Button variant={level === '3AS' ? 'secondary' : 'ghost'} aria-pressed={level === '3AS'} onClick={() => changeLevel('3AS')}>
            <span dir="ltr">3AS · BAC</span>
            <small>الثالثة ثانوي</small>
          </Button>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--secondary)', padding: 3, borderRadius: 6 }}>
          <Button
            size="sm"
            variant={plannerTab === 'curriculum' ? 'default' : 'ghost'}
            style={{ height: 28, fontSize: 11 }}
            onClick={() => setPlannerTab('curriculum')}
          >
            <BookOpen size={13} style={{ marginLeft: 5 }} /> المنهاج والأبواب
          </Button>
          <Button
            size="sm"
            variant={plannerTab === 'calendar' ? 'default' : 'ghost'}
            style={{ height: 28, fontSize: 11 }}
            onClick={() => setPlannerTab('calendar')}
          >
            <CalendarIcon size={13} style={{ marginLeft: 5 }} /> التقويم وجدول النشر
          </Button>
        </div>

        <span className="planner-total">
          <Film size={14} />
          {allEntries.filter(entry => entry.level === level).length} فيديو في المكتبة
        </span>
      </header>

      {/* Mode 1: Curriculum Explorer */}
      {plannerTab === 'curriculum' && (
        <div className="planner-workspace">
          <aside className="planner-chapters">
            <div className="planner-section-label">
              <BookOpen size={14} />
              الأبواب <span>{chapters.length}</span>
            </div>
            <nav aria-label="الأبواب الدراسية">
              {chapters.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`planner-chapter ${chapter?.id === item.id ? 'is-selected' : ''}`}
                  aria-current={chapter?.id === item.id ? 'true' : undefined}
                  onClick={() => {
                    setChapterId(item.id);
                    setQuery('');
                    setSelectedId(null);
                  }}
                >
                  <span className="planner-chapter-number">{String(item.order).padStart(2, '0')}</span>
                  <span className="planner-chapter-name">{item.name.replace(/^الباب [\d و]+ · /, '')}</span>
                  <ChevronLeft size={13} />
                </Button>
              ))}
            </nav>
          </aside>

          <section className="planner-browser">
            <div className="planner-chapter-heading">
              <span className="planner-section-label">الباب {chapter?.order}</span>
              <h3>{chapter?.name.replace(/^الباب [\d و]+ · /, '')}</h3>
              <small>{chapterEntries.length} فيديو متاح في هذا الباب</small>
            </div>

            <div className="planner-stages" role="tablist" aria-label="نوع الفيديو">
              {stages.map((stage, index) => (
                <Button
                  key={stage.source}
                  variant="ghost"
                  role="tab"
                  aria-selected={source === stage.source}
                  className={`planner-stage ${source === stage.source ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSource(stage.source as LegacySource);
                    setSelectedId(null);
                  }}
                >
                  <span className="planner-stage-step">{index + 1}</span>
                  <stage.icon size={14} />
                  <span>{stage.label}</span>
                  <small>{chapterEntries.filter(entry => entry.source === stage.source).length}</small>
                </Button>
              ))}
            </div>

            <div className="planner-search">
              <Search size={15} />
              <input
                aria-label="ابحث في فيديوهات الباب"
                placeholder="ابحث عن موضوع أو سؤال…"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setSelectedId(null);
                }}
              />
              {query && (
                <Button variant="ghost" size="icon" aria-label="مسح البحث" onClick={() => setQuery('')}>
                  <X size={14} />
                </Button>
              )}
            </div>

            <div className="planner-list" role="tabpanel" aria-label={activeStage.label}>
              {visibleEntries.map((entry, index) => {
                const planItem = schedule[entry.id];
                return (
                  <Button
                    key={entry.id}
                    variant="ghost"
                    className={`planner-video ${selected?.id === entry.id ? 'is-selected' : ''}`}
                    aria-pressed={selected?.id === entry.id}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <span className="planner-video-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="planner-video-copy">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{entry.topic}</strong>
                        {planItem && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background:
                                planItem.status === 'published'
                                  ? 'color-mix(in oklab, var(--primary) 20%, transparent)'
                                  : 'color-mix(in oklab, var(--gold) 20%, transparent)',
                              color: planItem.status === 'published' ? 'var(--primary)' : 'var(--gold)',
                            }}
                          >
                            {planItem.status === 'published' ? 'منشور ✅' : `مجدول (${planItem.date})`}
                          </span>
                        )}
                      </div>
                      <span>{entry.hook}</span>
                    </span>
                    {selected?.id === entry.id ? <Check size={16} /> : <ChevronLeft size={16} />}
                  </Button>
                );
              })}

              {!visibleEntries.length && (
                <div className="planner-empty">
                  <activeStage.icon size={26} />
                  <strong>{query ? 'لا توجد نتائج مطابقة' : 'لا توجد فيديوهات لهذا النوع بعد'}</strong>
                  {query ? (
                    <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                      مسح البحث
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const available = stages.find(stage => chapterEntries.some(entry => entry.source === stage.source));
                        if (available) setSource(available.source as LegacySource);
                      }}
                      disabled={!chapterEntries.length}
                    >
                      عرض الفيديوهات المتاحة
                    </Button>
                  )}
                </div>
              )}
            </div>
            <footer className="planner-list-footer">
              {visibleEntries.length} فيديو · {activeStage.label}
            </footer>
          </section>

          <aside className="planner-detail">
            <span className="planner-section-label">
              <Film size={14} />
              معاينة الفيديو
            </span>
            {selected && preview && previewScene ? (
              <>
                <div className="planner-artwork">
                  <ScenePreview project={preview} scene={previewScene} elapsed={previewScene.duration} miniature />
                </div>
                <span className={`planner-type planner-type-${source}`}>{activeStage.label}</span>
                <h4>{selected.topic}</h4>
                <div className="planner-preview-meta">
                  <span>
                    <Film size={13} />
                    {preview.scenes.length} مشاهد
                  </span>
                  <span>
                    <Clock size={13} />
                    {Math.round(totalDuration(preview.scenes))} ثانية
                  </span>
                </div>
                <p className="planner-summary">{selected.summary}</p>

                {/* Scheduling controls on detail */}
                <div style={{ width: '100%', display: 'flex', gap: 6, margin: '8px 0 16px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() => scheduleEntry(selected.id, selectedDate)}
                  >
                    <CalendarIcon size={12} style={{ marginLeft: 4 }} />
                    {schedule[selected.id] ? `جدولة (${schedule[selected.id].date})` : 'جدولة للنشر'}
                  </Button>
                  {schedule[selected.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ fontSize: 11 }}
                      onClick={() => toggleStatus(selected.id)}
                    >
                      الحالة: {schedule[selected.id].status}
                    </Button>
                  )}
                </div>

                <Button className="planner-open" onClick={() => openProject()}>
                  فتح في المحرر
                  <ArrowLeft size={16} />
                </Button>
              </>
            ) : (
              <div className="planner-detail-empty">
                <Film size={28} />
                <span>لا يوجد فيديو للمعاينة</span>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Mode 2: Interactive Publishing Calendar */}
      {plannerTab === 'calendar' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px 24px', overflowY: 'auto' }}>
          {/* Calendar Cadence Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: 'var(--secondary)', padding: '10px 16px', borderRadius: 6 }}>
            <div>
              <strong style={{ fontSize: 13, display: 'block' }}>خطة النشر والوتيرة الأسبوعية</strong>
              <small style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>3 فيديوهات أسبوعياً (السبت · الإثنين · الأربعاء) تضمن تغطية كاملة قبل الامتحانات</small>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="default" style={{ fontSize: 11 }} onClick={autoPlanMonth}>
                <Sparkles size={13} style={{ marginLeft: 5 }} /> جدولة تلقائية للشهر
              </Button>
              <Button
                size="sm"
                variant="outline"
                style={{ fontSize: 11 }}
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schedule, null, 2));
                  const a = document.createElement('a');
                  a.href = dataStr;
                  a.download = `qed-publishing-plan-${toYMD(new Date())}.json`;
                  a.click();
                }}
              >
                <Download size={13} style={{ marginLeft: 5 }} /> تصدير الخطة
              </Button>
            </div>
          </div>

          {/* Month Navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button size="icon" variant="ghost" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                <ChevronRight size={16} />
              </Button>
              <strong style={{ fontSize: 16 }}>
                {monthNames[month]} {year}
              </strong>
              <Button size="icon" variant="ghost" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                <ChevronLeft size={16} />
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setCalMonth(new Date())} style={{ fontSize: 11 }}>
              اليوم
            </Button>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, flex: 1, minHeight: 480 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: 6, color: 'var(--muted-foreground)' }}>
                {d}
              </div>
            ))}

            {/* Empty offset days */}
            {Array.from({ length: startDayIndex }).map((_, i) => (
              <div key={`offset-${i}`} style={{ background: 'color-mix(in oklab, var(--card) 40%, transparent)', borderRadius: 4, minHeight: 74, opacity: 0.3 }} />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
              const vids = scheduledByDate[dateStr] ?? [];
              const isToday = dateStr === toYMD(new Date());
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    background: isSelected ? 'var(--selected-surface)' : 'var(--card)',
                    border: isToday ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 4,
                    padding: 6,
                    minHeight: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--primary)' : 'inherit' }}>
                      {dayNum}
                    </span>
                    {vids.length > 0 && (
                      <span style={{ fontSize: 9, background: 'var(--secondary)', padding: '1px 4px', borderRadius: 3 }}>
                        {vids.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
                    {vids.map(v => (
                      <div
                        key={v.id}
                        onClick={e => {
                          e.stopPropagation();
                          openProject(v);
                        }}
                        style={{
                          fontSize: 10,
                          padding: '2px 5px',
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: 3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title={v.topic}
                      >
                        <span style={{ color: 'var(--primary)' }}>●</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Summary & Action Banner */}
          <div style={{ marginTop: 14, padding: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 12 }}>
                الفيديوهات المجدولة ليوم {selectedDate} ({scheduledByDate[selectedDate]?.length ?? 0} فيديو)
              </strong>
              <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 11 }}>
                انقر على أي يوم لتعيينه كموعد النشر المباشر.
              </small>
            </div>
            {scheduledByDate[selectedDate]?.length ? (
              <Button
                size="sm"
                variant="outline"
                style={{ fontSize: 11 }}
                onClick={() => {
                  const toRemove = scheduledByDate[selectedDate]!;
                  setSchedule(prev => {
                    const c = { ...prev };
                    toRemove.forEach(v => delete c[v.id]);
                    return c;
                  });
                  onNotify(`تم تفريغ موعد ${selectedDate}`);
                }}
              >
                <Trash2 size={12} style={{ marginLeft: 4 }} /> إفراغ اليوم
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
