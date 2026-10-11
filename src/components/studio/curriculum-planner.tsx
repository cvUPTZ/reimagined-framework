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
  PieChart,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenePreview } from './scene-preview';
import { legacyToProject, type LegacyEntry, type LegacySource } from '@/lib/legacy-library';
import { totalDuration, type StudioProject } from '@/lib/studio';
import {
  CURRICULUM_CHAPTERS,
  STAGES,
  getAllCurriculumEntries,
  matchesChapter,
  loadStoredPlan,
  saveStoredPlan,
  generateAutoSchedule,
  exportPlanAsCSV,
  formatDateYMD,
  pad2,
  PRODUCTION_FORMATS,
  getChapterProductionStats,
  createProjectForConcept,
  matchEntryToConcept,
  type CurriculumLevel,
  type VideoPlanStatus,
  type ScheduledPlanItem,
  type CurriculumChapter,
  type ChapterConcept,
} from '@/lib/curriculum-planner-store';

export function CurriculumPlanner({
  onLoadProject,
  onNotify,
}: {
  onLoadProject: (project: StudioProject) => void;
  onNotify: (message: string) => void;
}) {
  const [plannerTab, setPlannerTab] = useState<'curriculum' | 'production' | 'calendar' | 'metrics'>('curriculum');
  const [level, setLevel] = useState<CurriculumLevel>('4AM');
  const [chapterId, setChapterId] = useState('4am-ch1');
  const [source, setSource] = useState<LegacySource>('intuition');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [showConceptGuide, setShowConceptGuide] = useState<boolean>(true);
  const [prodFilter, setProdFilter] = useState<'all' | 'missing' | 'partial' | 'complete'>('all');

  // Calendar State
  const [calMonth, setCalMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateYMD(new Date()));
  const [schedule, setSchedule] = useState<Record<string, ScheduledPlanItem>>(() => loadStoredPlan());

  useEffect(() => {
    saveStoredPlan(schedule);
  }, [schedule]);

  const allEntries = useMemo(() => getAllCurriculumEntries(), []);
  const chapters = CURRICULUM_CHAPTERS[level];
  const chapter = chapters.find(item => item.id === chapterId) ?? chapters[0];

  const chapterEntries = useMemo(
    () => (chapter ? allEntries.filter(entry => matchesChapter(entry, chapter)) : []),
    [allEntries, chapter],
  );

  const chapterStats = useMemo(
    () => (chapter ? getChapterProductionStats(chapter, allEntries) : null),
    [chapter, allEntries],
  );

  const allChapterStats = useMemo(
    () => chapters.map(ch => getChapterProductionStats(ch, allEntries)),
    [chapters, allEntries],
  );

  const visibleEntries = useMemo(() => {
    let list = chapterEntries.filter(entry => entry.source === source);
    if (selectedConceptId && chapter?.concepts) {
      const activeConcept = chapter.concepts.find(c => c.id === selectedConceptId);
      if (activeConcept) {
        list = list.filter(entry => matchEntryToConcept(entry, activeConcept));
      }
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(entry => `${entry.topic} ${entry.hook} ${entry.summary}`.toLowerCase().includes(q));
    }
    return list;
  }, [chapterEntries, source, selectedConceptId, chapter, query]);

  const selected = visibleEntries.find(entry => entry.id === selectedId) ?? visibleEntries[0];
  const preview = useMemo(() => (selected ? legacyToProject(selected) : null), [selected]);
  const previewScene = preview?.scenes.find(scene => scene.phase === 'Intuition') ?? preview?.scenes[1] ?? preview?.scenes[0];
  const activeStage = STAGES.find(stage => stage.source === source) ?? STAGES[0];

  function changeLevel(next: CurriculumLevel) {
    setLevel(next);
    setChapterId(CURRICULUM_CHAPTERS[next][0]?.id ?? '');
    setQuery('');
    setSelectedId(null);
    setSelectedConceptId(null);
  }

  function openProject(entry?: LegacyEntry) {
    const target = entry ?? selected;
    if (!target) return;
    const proj = legacyToProject(target);
    if (!proj) return;
    onLoadProject(proj);
    onNotify(`تم فتح فيديو: ${target.topic}`);
  }

  function startProductionForConcept(concept: ChapterConcept, targetSource: LegacySource = 'intuition') {
    if (!chapter) return;
    const proj = createProjectForConcept(chapter, concept, targetSource);
    onLoadProject(proj);
    const sourceLabel = targetSource === 'intuition' ? 'حدس بصري' : targetSource === 'mistake' ? 'فخ شائع' : targetSource === 'ready' ? 'كبسولة سريعة' : 'تمرين منهجي';
    onNotify(`تم إنشاء مسودة فيديو لـ: ${concept.name} (${sourceLabel})`);
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
      scheduleEntry(entryId, formatDateYMD(new Date()));
      return;
    }
    const order: VideoPlanStatus[] = ['idea', 'draft', 'scheduled', 'published'];
    const next: VideoPlanStatus = order[(order.indexOf(item.status) + 1) % order.length] ?? 'idea';
    setSchedule(prev => ({
      ...prev,
      [entryId]: { ...item, status: next },
    }));
    onNotify(`تغيّرت الحالة إلى: ${next}`);
  }

  function triggerAutoPlan() {
    const updated = generateAutoSchedule(allEntries, schedule, level);
    const addedCount = Object.keys(updated).length - Object.keys(schedule).length;
    setSchedule(updated);
    if (addedCount > 0) {
      onNotify(`تمت جدولة ${addedCount} فيديوهات تلقائياً لـ ${level}!`);
    } else {
      onNotify(`جميع فيديوهات ${level} مجدولة بالفعل.`);
    }
  }

  function exportCSV() {
    const csvData = exportPlanAsCSV(schedule, allEntries);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qed-plan-${level}-${formatDateYMD(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('تم تصدير ملف الخطة (CSV) بنجاح');
  }

  // Calendar rendering data
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIndex = (firstDay.getDay() + 1) % 7; // Saturday as 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const scheduledByDate = useMemo(() => {
    const map: Record<string, LegacyEntry[]> = {};
    Object.values(schedule).forEach(item => {
      const found = allEntries.find(e => e.id === item.entryId);
      if (found) {
        const list = map[item.date] ?? (map[item.date] = []);
        list.push(found);
      }
    });
    return map;
  }, [schedule, allEntries]);

  const monthNames = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Metrics Data Calculations
  const levelAllEntries = useMemo(() => allEntries.filter(e => e.level === level), [allEntries, level]);
  const metrics = useMemo(() => {
    const published = Object.values(schedule).filter(i => i.level === level && i.status === 'published').length;
    const scheduled = Object.values(schedule).filter(i => i.level === level && i.status === 'scheduled').length;
    const drafts = Object.values(schedule).filter(i => i.level === level && i.status === 'draft').length;
    const total = levelAllEntries.length;
    const unscheduled = Math.max(0, total - (published + scheduled + drafts));

    // Per chapter completion
    const chapterStats = chapters.map(ch => {
      const vids = allEntries.filter(e => matchesChapter(e, ch));
      const done = vids.filter(v => schedule[v.id]?.status === 'published').length;
      const planned = vids.filter(v => schedule[v.id]?.status === 'scheduled').length;
      return {
        chapter: ch,
        total: vids.length,
        done,
        planned,
        isComplete: done >= 3 || (vids.length > 0 && done === vids.length),
      };
    });

    return { published, scheduled, drafts, unscheduled, total, chapterStats };
  }, [schedule, level, levelAllEntries, chapters, allEntries]);

  return (
    <div className="curriculum-planner" dir="rtl">
      {/* Top Bar Navigation */}
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

        {/* View Switcher: Curriculum vs Production vs Calendar vs Metrics */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--secondary)', padding: 3, borderRadius: 6, flexWrap: 'wrap' }}>
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
            variant={plannerTab === 'production' ? 'default' : 'ghost'}
            style={{ height: 28, fontSize: 11 }}
            onClick={() => setPlannerTab('production')}
          >
            <Layers size={13} style={{ marginLeft: 5 }} /> خريطة المفاهيم وخطة الإنتاج
          </Button>
          <Button
            size="sm"
            variant={plannerTab === 'calendar' ? 'default' : 'ghost'}
            style={{ height: 28, fontSize: 11 }}
            onClick={() => setPlannerTab('calendar')}
          >
            <CalendarIcon size={13} style={{ marginLeft: 5 }} /> التقويم وجدول النشر
          </Button>
          <Button
            size="sm"
            variant={plannerTab === 'metrics' ? 'default' : 'ghost'}
            style={{ height: 28, fontSize: 11 }}
            onClick={() => setPlannerTab('metrics')}
          >
            <PieChart size={13} style={{ marginLeft: 5 }} /> إحصائيات التغطية
          </Button>
        </div>

        <span className="planner-total">
          <Film size={14} />
          {levelAllEntries.length} فيديو في المنهاج
        </span>
      </header>

      {/* VIEW 1: Curriculum & Stages */}
      {plannerTab === 'curriculum' && (
        <div className="planner-workspace">
          <aside className="planner-chapters">
            <div className="planner-section-label">
              <BookOpen size={14} />
              الأبواب الدراسية <span>{chapters.length}</span>
            </div>
            <nav aria-label="الأبواب الدراسية">
              {chapters.map(item => {
                const count = allEntries.filter(entry => matchesChapter(entry, item)).length;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`planner-chapter ${chapter?.id === item.id ? 'is-selected' : ''}`}
                    aria-current={chapter?.id === item.id ? 'true' : undefined}
                    onClick={() => {
                      setChapterId(item.id);
                      setQuery('');
                      setSelectedId(null);
                      setSelectedConceptId(null);
                    }}
                  >
                    <span className="planner-chapter-number">{String(item.order).padStart(2, '0')}</span>
                    <span className="planner-chapter-name">{item.name.replace(/^الباب [\d و]+ · /, '')}</span>
                    <small style={{ fontSize: 9, opacity: 0.7 }}>{count}</small>
                    <ChevronLeft size={13} />
                  </Button>
                );
              })}
            </nav>
          </aside>

          <section className="planner-browser">
            <div className="planner-chapter-heading">
              <span className="planner-section-label">الباب {chapter?.order}</span>
              <h3>{chapter?.name.replace(/^الباب [\d و]+ · /, '')}</h3>
              <small>{chapterEntries.length} فيديو متاح في هذا الباب</small>
            </div>

            {/* CHAPTER PRODUCTION GUIDE & CONCEPTS BLUEPRINT */}
            {chapterStats && (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Header with Readiness Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={16} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: 13 }}>خريطة مفاهيم الباب وأنواع الفيديوهات المطلوبة للإنتاج</strong>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'color-mix(in oklab, var(--primary) 15%, transparent)',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      {chapter?.concepts?.length || 0} مفاهيم مقررة
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span>جاهزية الإنتاج:</span>
                      <strong style={{ color: chapterStats.readinessPercent >= 75 ? 'var(--primary)' : 'var(--gold)' }}>
                        {chapterStats.readinessPercent}%
                      </strong>
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>
                        ({chapterStats.totalAvailable} / {chapterStats.targetTotal} فيديو)
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ height: 24, fontSize: 11, padding: '0 6px' }}
                      onClick={() => setShowConceptGuide(prev => !prev)}
                    >
                      {showConceptGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span style={{ marginRight: 4 }}>{showConceptGuide ? 'طيّ الدليل' : 'عرض الدليل'}</span>
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, width: '100%', background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${chapterStats.readinessPercent}%`,
                      background: chapterStats.readinessPercent >= 75 ? 'var(--primary)' : 'var(--gold)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {showConceptGuide && (
                  <>
                    {/* Educational Formats Breakdown: What are all the types of videos needed for production */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                      {PRODUCTION_FORMATS.map(fmt => {
                        const count = chapterStats.byFormat[fmt.source] || 0;
                        const isMet = count >= fmt.targetPerChapter;
                        return (
                          <div
                            key={fmt.source}
                            style={{
                              background: 'var(--background)',
                              border: `1px solid ${isMet ? 'color-mix(in oklab, var(--primary) 30%, transparent)' : 'var(--border)'}`,
                              borderRadius: 6,
                              padding: '8px 10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{fmt.icon}</span> {fmt.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: isMet ? 'var(--primary)' : 'var(--gold)',
                                  background: isMet
                                    ? 'color-mix(in oklab, var(--primary) 12%, transparent)'
                                    : 'color-mix(in oklab, var(--gold) 12%, transparent)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {count} / {fmt.targetPerChapter} {isMet ? '✓' : 'ناقص'}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                              {fmt.pedagogicalRole}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Concepts Checklist & Status */}
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: 6 }}>
                        مفاهيم المنهاج المقررة وحالة تغطيتها في الباب:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {chapterStats.conceptCoverage.map(item => {
                          const isSelected = selectedConceptId === item.concept.id;
                          return (
                            <div
                              key={item.concept.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isSelected ? 'color-mix(in oklab, var(--primary) 10%, var(--background))' : 'var(--background)',
                                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 6,
                                padding: '6px 10px',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, minWidth: 200 }}
                                onClick={() => setSelectedConceptId(isSelected ? null : item.concept.id)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.concept.name}</span>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 600,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      background:
                                        item.status === 'complete'
                                          ? 'color-mix(in oklab, var(--primary) 20%, transparent)'
                                          : item.status === 'partial'
                                            ? 'color-mix(in oklab, var(--gold) 20%, transparent)'
                                            : 'color-mix(in oklab, var(--coral) 20%, transparent)',
                                      color:
                                        item.status === 'complete'
                                          ? 'var(--primary)'
                                          : item.status === 'partial'
                                            ? 'var(--gold)'
                                            : 'var(--coral)',
                                    }}
                                  >
                                    {item.status === 'complete' ? 'تغطية كاملة ✅' : item.status === 'partial' ? 'تغطية جزئية ⏳' : 'بحاجة إلى إنتاج 🔴'}
                                  </span>
                                </div>
                                <small style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{item.concept.description}</small>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {/* Formats mini badges */}
                                {PRODUCTION_FORMATS.map(fmt => {
                                  const hasFmt = item.availableFormats.includes(fmt.source);
                                  return (
                                    <span
                                      key={fmt.source}
                                      title={`${fmt.label}: ${hasFmt ? 'متوفر' : 'غير متوفر بعد'}`}
                                      style={{
                                        fontSize: 10,
                                        padding: '2px 5px',
                                        borderRadius: 4,
                                        border: hasFmt ? '1px solid var(--border)' : '1px dashed var(--border)',
                                        opacity: hasFmt ? 1 : 0.45,
                                        background: hasFmt ? 'var(--card)' : 'transparent',
                                      }}
                                    >
                                      {fmt.icon} {fmt.badge}
                                    </span>
                                  );
                                })}

                                {/* Quick Produce Action */}
                                <Button
                                  size="sm"
                                  variant={item.status === 'missing' ? 'default' : 'outline'}
                                  style={{ height: 22, fontSize: 10, padding: '0 6px', gap: 4 }}
                                  onClick={() => startProductionForConcept(item.concept, item.missingFormats[0] || 'intuition')}
                                >
                                  <PlusCircle size={11} /> إنتاج فيديو
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedConceptId && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '4px 8px', background: 'var(--secondary)', borderRadius: 4 }}>
                          <span style={{ fontSize: 11 }}>
                            يتم الآن تصفية الفيديوهات لمفهوم: <strong>{chapter?.concepts?.find(c => c.id === selectedConceptId)?.name}</strong>
                          </span>
                          <Button size="sm" variant="ghost" style={{ height: 20, fontSize: 10 }} onClick={() => setSelectedConceptId(null)}>
                            إلغاء التصفية (عرض كل فيديوهات الباب)
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="planner-stages" role="tablist" aria-label="نوع الفيديو">
              {STAGES.map((stage, index) => {
                const count = chapterEntries.filter(entry => entry.source === stage.source).length;
                return (
                  <Button
                    key={stage.source}
                    variant="ghost"
                    role="tab"
                    aria-selected={source === stage.source}
                    className={`planner-stage ${source === stage.source ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSource(stage.source);
                      setSelectedId(null);
                    }}
                  >
                    <span className="planner-stage-step">{index + 1}</span>
                    <span style={{ fontSize: 13 }}>{stage.source === 'intuition' ? '💡' : stage.source === 'mistake' ? '🩹' : stage.source === 'ready' ? '🎬' : '📝'}</span>
                    <span>{stage.label}</span>
                    <small>{count}</small>
                  </Button>
                );
              })}
            </div>

            <div className="planner-search">
              <Search size={15} />
              <input
                aria-label="ابحث في فيديوهات الباب"
                placeholder="ابحث عن موضوع أو فكرة…"
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
                        const available = STAGES.find(stage => chapterEntries.some(entry => entry.source === stage.source));
                        if (available) setSource(available.source);
                      }}
                      disabled={!chapterEntries.length}
                    >
                      عرض الفيديوهات المتوفرة في الباب
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
                  {(() => {
                    const scheduledItem = schedule[selected.id];
                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ flex: 1, fontSize: 11 }}
                          onClick={() => scheduleEntry(selected.id, selectedDate)}
                        >
                          <CalendarIcon size={12} style={{ marginLeft: 4 }} />
                          {scheduledItem ? `جدولة (${scheduledItem.date})` : 'جدولة للنشر'}
                        </Button>
                        {scheduledItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ fontSize: 11 }}
                            onClick={() => toggleStatus(selected.id)}
                          >
                            الحالة: {scheduledItem.status}
                          </Button>
                        )}
                      </>
                    );
                  })()}
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

      {/* VIEW 2: Production Blueprint & Concepts Matrix */}
      {plannerTab === 'production' && (
        <div style={{ flex: 1, minHeight: 0, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Banner explaining pedagogical production requirements */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Layers size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: 16, margin: 0, fontWeight: 800 }}>دليل وخريطة الإنتاج الشاملة لمنهاج {level}</h3>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)', maxWidth: 750, lineHeight: 1.5 }}>
                  لإنتاج محتوى تعليمي متكامل لكل باب، يحتاج صانع المحتوى إلى 4 أنواع من الفيديوهات لكل مفهوم:
                  <strong> الحدس البصري (Intuition)</strong> للشرح المفهومي،
                  <strong> فخاخ وأخطاء (Traps)</strong> للتحصين ضد الأخطاء،
                  <strong> كبسولات سريعة (Shorts)</strong> للنشر والتحدي،
                  و<strong> تمارين منهجية (Solved Problems)</strong> للتدريب على التصحيح النموذجي.
                </p>
              </div>

              {/* Filter Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button size="sm" variant={prodFilter === 'all' ? 'default' : 'outline'} style={{ height: 26, fontSize: 11 }} onClick={() => setProdFilter('all')}>
                  جميع المفاهيم ({chapters.reduce((acc, c) => acc + (c.concepts?.length || 0), 0)})
                </Button>
                <Button size="sm" variant={prodFilter === 'missing' ? 'destructive' : 'outline'} style={{ height: 26, fontSize: 11 }} onClick={() => setProdFilter('missing')}>
                  🔴 بحاجة لإنتاج
                </Button>
                <Button size="sm" variant={prodFilter === 'partial' ? 'secondary' : 'outline'} style={{ height: 26, fontSize: 11 }} onClick={() => setProdFilter('partial')}>
                  ⏳ تغطية جزئية
                </Button>
                <Button size="sm" variant={prodFilter === 'complete' ? 'default' : 'outline'} style={{ height: 26, fontSize: 11 }} onClick={() => setProdFilter('complete')}>
                  ✅ مكتمل الإنتاج
                </Button>
              </div>
            </div>
          </div>

          {/* Chapters Production Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {allChapterStats.map(stat => {
              const ch = chapters.find(c => c.id === stat.chapterId);
              if (!ch) return null;
              const filteredConcepts = stat.conceptCoverage.filter(c => prodFilter === 'all' || c.status === prodFilter);
              if (prodFilter !== 'all' && !filteredConcepts.length) return null;

              return (
                <div key={ch.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="planner-chapter-number" style={{ width: 24, height: 24, fontSize: 11 }}>{String(ch.order).padStart(2, '0')}</span>
                      <strong style={{ fontSize: 14 }}>{ch.name}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                        الجاهزية: <strong style={{ color: stat.readinessPercent >= 75 ? 'var(--primary)' : 'var(--gold)' }}>{stat.readinessPercent}%</strong> ({stat.totalAvailable}/{stat.targetTotal} فيديو)
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ height: 24, fontSize: 11 }}
                        onClick={() => {
                          setChapterId(ch.id);
                          setPlannerTab('curriculum');
                        }}
                      >
                        عرض في المنهاج ←
                      </Button>
                    </div>
                  </div>

                  {/* Concept Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filteredConcepts.map(item => (
                      <div
                        key={item.concept.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '8px 12px',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{item.concept.name}</span>
                            <span
                              style={{
                                fontSize: 9,
                                padding: '1px 5px',
                                borderRadius: 4,
                                background:
                                  item.status === 'complete'
                                    ? 'color-mix(in oklab, var(--primary) 20%, transparent)'
                                    : item.status === 'partial'
                                      ? 'color-mix(in oklab, var(--gold) 20%, transparent)'
                                      : 'color-mix(in oklab, var(--coral) 20%, transparent)',
                                color:
                                  item.status === 'complete'
                                    ? 'var(--primary)'
                                    : item.status === 'partial'
                                      ? 'var(--gold)'
                                      : 'var(--coral)',
                              }}
                            >
                              {item.status === 'complete' ? 'مكتمل ✅' : item.status === 'partial' ? 'جزئي ⏳' : 'ناقص 🔴'}
                            </span>
                          </div>
                          <small style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{item.concept.description}</small>
                        </div>

                        {/* Production Status for the 4 Video Formats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {PRODUCTION_FORMATS.map(fmt => {
                            const isAvailable = item.availableFormats.includes(fmt.source);
                            return (
                              <div
                                key={fmt.source}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 10,
                                  padding: '3px 6px',
                                  borderRadius: 4,
                                  background: isAvailable
                                    ? 'color-mix(in oklab, var(--primary) 12%, transparent)'
                                    : 'color-mix(in oklab, var(--muted) 40%, transparent)',
                                  border: `1px solid ${isAvailable ? 'color-mix(in oklab, var(--primary) 30%, transparent)' : 'var(--border)'}`,
                                  color: isAvailable ? 'var(--primary)' : 'var(--muted-foreground)',
                                }}
                              >
                                <span>{fmt.icon}</span>
                                <span>{fmt.badge}</span>
                                {isAvailable ? (
                                  <Check size={11} style={{ color: 'var(--primary)' }} />
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    style={{ height: 16, padding: '0 2px', fontSize: 9, color: 'var(--gold)' }}
                                    onClick={() => startProductionForConcept(item.concept, fmt.source)}
                                  >
                                    + إنتاج
                                  </Button>
                                )}
                              </div>
                            );
                          })}

                          <Button
                            size="sm"
                            variant="default"
                            style={{ height: 24, fontSize: 10, gap: 4 }}
                            onClick={() => startProductionForConcept(item.concept, item.missingFormats[0] || 'intuition')}
                          >
                            <PlusCircle size={11} /> إنتاج في الستوديو
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Interactive Publishing Calendar */}
      {plannerTab === 'calendar' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px 24px', overflowY: 'auto' }}>
          {/* Calendar Cadence Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: 'var(--secondary)', padding: '10px 16px', borderRadius: 6 }}>
            <div>
              <strong style={{ fontSize: 13, display: 'block' }}>خطة النشر والوتيرة الأسبوعية</strong>
              <small style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>3 فيديوهات أسبوعياً (السبت · الإثنين · الأربعاء) تضمن تغطية شاملة للمنهاج</small>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="default" style={{ fontSize: 11 }} onClick={triggerAutoPlan}>
                <Sparkles size={13} style={{ marginLeft: 5 }} /> جدولة تلقائية للشهر
              </Button>
              <Button size="sm" variant="outline" style={{ fontSize: 11 }} onClick={exportCSV}>
                <Download size={13} style={{ marginLeft: 5 }} /> تصدير الخطة (CSV)
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, flex: 1, minHeight: 460 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: 6, color: 'var(--muted-foreground)' }}>
                {d}
              </div>
            ))}

            {Array.from({ length: startDayIndex }).map((_, i) => (
              <div key={`offset-${i}`} style={{ background: 'color-mix(in oklab, var(--card) 40%, transparent)', borderRadius: 4, minHeight: 74, opacity: 0.3 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${pad2(month + 1)}-${pad2(dayNum)}`;
              const vids = scheduledByDate[dateStr] ?? [];
              const isToday = dateStr === formatDateYMD(new Date());
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

          {/* Selected Date Drawer Banner */}
          <div style={{ marginTop: 14, padding: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 12 }}>
                الفيديوهات المجدولة ليوم {selectedDate} ({scheduledByDate[selectedDate]?.length ?? 0} فيديو)
              </strong>
              <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 11 }}>
                انقر على أي فيديو لفتحه مباشرة في المحرر.
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

      {/* VIEW 3: Coverage Metrics & Chapter Health */}
      {plannerTab === 'metrics' && (
        <div style={{ flex: 1, minHeight: 0, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Funnel KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>إجمالي الفيديوهات المتاحة</span>
              <h3 style={{ fontSize: 24, margin: '4px 0 0', fontWeight: 800 }}>{metrics.total}</h3>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--primary)' }}>تم نشرها ✅</span>
              <h3 style={{ fontSize: 24, margin: '4px 0 0', fontWeight: 800, color: 'var(--primary)' }}>{metrics.published}</h3>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--gold)' }}>مجدولة للنشر 🗓️</span>
              <h3 style={{ fontSize: 24, margin: '4px 0 0', fontWeight: 800, color: 'var(--gold)' }}>{metrics.scheduled}</h3>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>ما زالت بلا جدولة ⏳</span>
              <h3 style={{ fontSize: 24, margin: '4px 0 0', fontWeight: 800 }}>{metrics.unscheduled}</h3>
            </div>
          </div>

          {/* Chapter Health Breakdown Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>تغطية الأبواب الدراسية لـ {level}</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {metrics.chapterStats.map(stat => (
                <div key={stat.chapter.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--background)', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {stat.isComplete ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--gold)' }} />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{stat.chapter.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11 }}>
                    <span>{stat.done} منشور</span>
                    <span>{stat.planned} مجدول</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>{stat.total} فيديو متوفر</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ height: 24, fontSize: 10 }}
                      onClick={() => {
                        setChapterId(stat.chapter.id);
                        setPlannerTab('curriculum');
                      }}
                    >
                      استعراض الباب ←
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
