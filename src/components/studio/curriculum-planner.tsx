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
  type CurriculumLevel,
  type VideoPlanStatus,
  type ScheduledPlanItem,
  type CurriculumChapter,
} from '@/lib/curriculum-planner-store';

export function CurriculumPlanner({
  onLoadProject,
  onNotify,
}: {
  onLoadProject: (project: StudioProject) => void;
  onNotify: (message: string) => void;
}) {
  const [plannerTab, setPlannerTab] = useState<'curriculum' | 'calendar' | 'metrics'>('curriculum');
  const [level, setLevel] = useState<CurriculumLevel>('4AM');
  const [chapterId, setChapterId] = useState('4am-ch1');
  const [source, setSource] = useState<LegacySource>('intuition');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const activeStage = STAGES.find(stage => stage.source === source) ?? STAGES[0];

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
      scheduleEntry(entryId, formatDateYMD(new Date()));
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
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push(found);
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

        {/* View Switcher: Curriculum vs Calendar vs Metrics */}
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

      {/* VIEW 2: Interactive Publishing Calendar */}
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
