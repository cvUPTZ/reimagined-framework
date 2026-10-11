import { useState, useMemo } from 'react';
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Clock, Filter, Layers, Play, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mistakesJson from '@/data/legacy/mistakes.json';
import readyJson from '@/data/legacy/ready.json';
import intuitionJson from '@/data/legacy/intuition.json';
import solveJson from '@/data/legacy/solve.json';
import { legacyToProject, readyBase, type LegacyEntry, type LegacySource } from '@/lib/legacy-library';
import { type StudioProject } from '@/lib/studio';

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

interface PlannerItem {
  id: string;
  source: LegacySource;
  title: string;
  hook: string;
  model: string;
  status: 'published' | 'scheduled' | 'draft' | 'idea';
  videoType: 'intuition' | 'mistake' | 'solve';
  entry: LegacyEntry;
}

export function CurriculumPlanner({
  onLoadProject,
  onNotify,
}: {
  onLoadProject: (p: StudioProject) => void;
  onNotify: (msg: string) => void;
}) {
  const [level, setLevel] = useState<CurriculumLevel>('4AM');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(CURRICULUM_CHAPTERS['4AM'][0].id);

  const chapters = CURRICULUM_CHAPTERS[level];
  const activeChapter = chapters.find(c => c.id === selectedChapterId) ?? chapters[0];

  // Match items from database to chapter
  const chapterItems = useMemo(() => {
    const mistakes = mistakesJson as any[];
    const ready = readyJson as any[];
    const intuition = intuitionJson as any[];
    const solve = solveJson as any[];

    const chName = activeChapter.name;
    const isCh = (str?: string) => {
      if (!str) return false;
      const s = str.trim();
      if (level === '4AM') {
        if (activeChapter.id === '4am-ch1') return /قاسم|قسمة|PGCD|إقليدس/i.test(s);
        if (activeChapter.id === '4am-ch2') return /جذور|جذر/i.test(s);
        if (activeChapter.id === '4am-ch3') return /حرفي|متطابقات|نشر|تحليل|مربع مجموع/i.test(s);
        if (activeChapter.id === '4am-ch4') return /معادلات|متراجحات|سالب/i.test(s);
        if (activeChapter.id === '4am-ch5') return /طالس|فيثاغورس|مثلثات|ظل|جيب/i.test(s);
        if (activeChapter.id === '4am-ch6') return /دوال خطية|تآلفية/i.test(s);
        if (activeChapter.id === '4am-ch7') return /جمل|إحصاء|فضاء|مكعب|قوى/i.test(s);
      } else {
        if (activeChapter.id === '3as-ch1') return /نهايات|استمرار/i.test(s);
        if (activeChapter.id === '3as-ch2') return /اشتقاق/i.test(s);
        if (activeChapter.id === '3as-ch3') return /أسية|لوغاريتم/i.test(s);
        if (activeChapter.id === '3as-ch4') return /تزايد/i.test(s);
        if (activeChapter.id === '3as-ch5') return /تكامل|أصلية/i.test(s);
        if (activeChapter.id === '3as-ch6') return /احتمال/i.test(s);
        if (activeChapter.id === '3as-ch7') return /متتالي/i.test(s);
        if (activeChapter.id === '3as-ch8') return /قسمة في Z|موافقات|أولية/i.test(s);
        if (activeChapter.id === '3as-ch9') return /مركبة/i.test(s);
      }
      return false;
    };

    const out: PlannerItem[] = [];

    // 1. Intuition videos
    intuition.forEach((x, idx) => {
      if (x.lv === level && (isCh(x.chapter) || isCh(x.topic))) {
        out.push({
          id: `intuition-${idx}`,
          source: 'intuition',
          title: x.topic || 'بناء الحدس البصري',
          hook: x.hook,
          model: x.m,
          status: idx === 0 ? 'published' : 'draft',
          videoType: 'intuition',
          entry: {
            id: `intuition-${idx}`,
            source: 'intuition',
            level: x.lv,
            chapter: x.chapter,
            topic: x.topic,
            hook: x.hook,
            model: x.m,
            summary: x.rule,
          },
        });
      }
    });

    // 2. Mistakes / Diagnostic videos
    mistakes.forEach((m, idx) => {
      if (m.level === level && (isCh(m.chapter) || isCh(m.topic))) {
        out.push({
          id: `mistake-${idx}`,
          source: 'mistake',
          title: m.topic || 'تشخيص الفخ الشائع',
          hook: m.mistake,
          model: m.vis?.m ?? 'none',
          status: 'draft',
          videoType: 'mistake',
          entry: {
            id: `mistake-${idx}`,
            source: 'mistake',
            level: m.level,
            chapter: m.chapter,
            topic: m.topic,
            hook: `${m.mistake}\nهل هذا صحيح؟ 🤔`,
            model: m.vis?.m ?? 'none',
            summary: m.mistake,
          },
        });
      }
    });

    // 3. Solved exercise videos
    solve.forEach((s, idx) => {
      if (s.lv === level && (isCh(s.chapter) || isCh(s.topic))) {
        out.push({
          id: `solve-${idx}`,
          source: 'solve',
          title: s.topic || 'حل تمرين خطوة بخطوة',
          hook: s.hook || s.topic,
          model: 'solve',
          status: 'idea',
          videoType: 'solve',
          entry: {
            id: `solve-${idx}`,
            source: 'solve',
            level: s.lv,
            chapter: s.chapter,
            topic: s.topic,
            hook: s.hook,
            model: 'solve',
            summary: s.topic,
          },
        });
      }
    });

    return out;
  }, [level, activeChapter]);

  const intuitions = chapterItems.filter(i => i.videoType === 'intuition');
  const mistakes = chapterItems.filter(i => i.videoType === 'mistake');
  const exercises = chapterItems.filter(i => i.videoType === 'solve');

  function openEntry(entry: LegacyEntry) {
    const proj = legacyToProject(entry);
    if (proj) {
      onLoadProject(proj);
      onNotify(`تم فتح فيديو: ${entry.topic}`);
    }
  }

  return (
    <div className="curriculum-planner-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Level Selection Switcher */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--muted)', padding: 6, borderRadius: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '0 8px' }}>المستوى التعليمي:</span>
        <Button
          variant={level === '4AM' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setLevel('4AM'); setSelectedChapterId(CURRICULUM_CHAPTERS['4AM'][0].id); }}
        >
          🇩🇿 4AM / BEM (الرابعة متوسط)
        </Button>
        <Button
          variant={level === '3AS' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setLevel('3AS'); setSelectedChapterId(CURRICULUM_CHAPTERS['3AS'][0].id); }}
        >
          🇩🇿 3AS / BAC (الثالثة ثانوي - بكالوريا)
        </Button>
      </div>

      {/* Chapters Horizontal Scroll / Selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {chapters.map(c => (
          <Button
            key={c.id}
            variant={selectedChapterId === c.id ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedChapterId(c.id)}
            style={{ whiteSpace: 'nowrap', fontSize: 11, fontWeight: selectedChapterId === c.id ? 700 : 500 }}
          >
            {c.name}
          </Button>
        ))}
      </div>

      {/* Pedagogical Funnel Explanation */}
      <div style={{ background: 'color-mix(in oklab, var(--primary) 8%, transparent)', border: '1px solid var(--primary)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <strong style={{ fontSize: 13 }}>خريطة إنتاج المحتوى للباب: {activeChapter.name}</strong>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }} dir="rtl">
          خطة النشر الموصى بها لكل باب: <b>1. فيديو حدس بصري</b> (بدون قواعد سابقة لشد الانتباه) ← <b>2. فيديو تشخيص فخ شائع</b> (العلاج وحفظ النقاط) ← <b>3. فيديو حل مسألة نموذجية</b> (خطوة بخطوة).
        </p>
      </div>

      {/* Funnel 3-Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {/* Column 1: Intuition */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
              💡 1. بناء الحدس ({intuitions.length})
            </span>
            <span style={{ fontSize: 9, background: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>الفيديو الأول</span>
          </div>
          {intuitions.length === 0 ? (
            <small style={{ color: 'var(--muted-foreground)', display: 'block', padding: 8 }}>لا يوجد فيديو حدس جاهز لهذا الباب.</small>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {intuitions.map(item => (
                <div key={item.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }} dir="rtl">{item.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }} dir="rtl">{item.hook}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--primary)' }}>Model: {item.model}</span>
                    <Button size="sm" style={{ height: 22, fontSize: 10 }} onClick={() => openEntry(item.entry)}>
                      <Play size={10} style={{ marginLeft: 4 }} /> إنتاج الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Mistakes / Diagnostic */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 5 }}>
              🩹 2. تشخيص الأخطاء ({mistakes.length})
            </span>
            <span style={{ fontSize: 9, background: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>الفيديو الثاني</span>
          </div>
          {mistakes.length === 0 ? (
            <small style={{ color: 'var(--muted-foreground)', display: 'block', padding: 8 }}>لا توجد أخطاء مسجلة لهذا الباب.</small>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mistakes.map(item => (
                <div key={item.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }} dir="rtl">{item.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 8 }} dir="rtl">❌ {item.hook}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Model: {item.model}</span>
                    <Button size="sm" variant="outline" style={{ height: 22, fontSize: 10 }} onClick={() => openEntry(item.entry)}>
                      <Play size={10} style={{ marginLeft: 4 }} /> إنتاج الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Solved Exercises */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              📝 3. حل التمارين ({exercises.length})
            </span>
            <span style={{ fontSize: 9, background: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>الفيديو الثالث</span>
          </div>
          {exercises.length === 0 ? (
            <div style={{ padding: 8 }}>
              <small style={{ color: 'var(--muted-foreground)', display: 'block', marginBottom: 8 }}>
                لم يتم إدراج تمرين لهذا الباب بعد.
              </small>
              <Button size="sm" variant="ghost" style={{ fontSize: 10, height: 24, width: '100%', border: '1px dashed var(--border)' }}>
                ➕ أضف مسألة نموذجية
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exercises.map(item => (
                <div key={item.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }} dir="rtl">{item.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }} dir="rtl">{item.hook}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>حل تفصيلي</span>
                    <Button size="sm" variant="outline" style={{ height: 22, fontSize: 10 }} onClick={() => openEntry(item.entry)}>
                      <Play size={10} style={{ marginLeft: 4 }} /> إنتاج الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
