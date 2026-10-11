import { listLegacy, type LegacyEntry, type LegacySource } from './legacy-library';

export type CurriculumLevel = '4AM' | '3AS';
export type VideoPlanStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export interface CurriculumChapter {
  id: string;
  name: string;
  level: CurriculumLevel;
  order: number;
}

export interface ScheduledPlanItem {
  id: string;
  entryId: string;
  level: CurriculumLevel;
  date: string; // YYYY-MM-DD
  status: VideoPlanStatus;
  note?: string;
}

export interface PlanConfig {
  perDay: number;
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  weeks: number;
  startDate?: string;
}

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  perDay: 1,
  days: [6, 1, 3], // Saturday, Monday, Wednesday (Algerian academic cadence)
  weeks: 4,
};

export const CURRICULUM_CHAPTERS: Record<CurriculumLevel, CurriculumChapter[]> = {
  '4AM': [
    { id: '4am-ch1', name: 'القسمة والقاسم المشترك الأكبر (PGCD)', level: '4AM', order: 1 },
    { id: '4am-ch2', name: 'الحساب على الجذور التربيعية', level: '4AM', order: 2 },
    { id: '4am-ch3', name: 'الحساب الحرفي والمتطابقات الشهيرة', level: '4AM', order: 3 },
    { id: '4am-ch4', name: 'المعادلات والمتراجحات من الدرجة الأولى', level: '4AM', order: 4 },
    { id: '4am-ch5', name: 'الهندسة المستوية (طالس وفيثاغورس وحساب المثلثات)', level: '4AM', order: 5 },
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
    { id: '3as-ch8', name: 'الباب 9 و10 و11 · القسمة والموافقات والأعداد الأولية', level: '3AS', order: 8 },
    { id: '3as-ch9', name: 'الباب 12 · الأعداد المركبة والتحويلات النقطية', level: '3AS', order: 9 },
    { id: '3as-ch10', name: 'الباب 13 · التشابه المباشر في المستوي', level: '3AS', order: 10 },
    { id: '3as-ch11', name: 'الباب 14 و15 · الجداء السلمي والهندسة في الفضاء', level: '3AS', order: 11 },
  ],
};

const CHAPTER_PATTERNS: Record<string, RegExp> = {
  '4am-ch1': /قاسم|قسمة|PGCD|إقليدس/i,
  '4am-ch2': /جذور|جذر/i,
  '4am-ch3': /حرفي|متطابقات|نشر|تحليل|مربع مجموع|أعداد نسبية|كسر|تناسبية|نسبة مئوية/i,
  '4am-ch4': /معادلات|متراجحات|سالب/i,
  '4am-ch5': /طالس|فيثاغورس|مثلثات|ظل|جيب|هندسة|محيطية|تكبير|زاوية/i,
  '4am-ch6': /دوال خطية|تآلفية|دوال/i,
  '4am-ch7': /جمل|إحصاء|فضاء|مكعب|قوى/i,
  '3as-ch1': /نهايات|استمرار/i,
  '3as-ch2': /اشتقاق/i,
  '3as-ch3': /أسية|لوغاريتم/i,
  '3as-ch4': /تزايد/i,
  '3as-ch5': /تكامل|أصلية/i,
  '3as-ch6': /احتمال/i,
  '3as-ch7': /متتالي/i,
  '3as-ch8': /قسمة في Z|موافقات|أولية|قواسم/i,
  '3as-ch9': /مركبة|عمدة|طويلة/i,
  '3as-ch10': /تشابه/i,
  '3as-ch11': /فضاء|مستوي|كرة|شعاع|ناظمي|وسيطي/i,
};

export const STAGES = [
  { source: 'intuition' as const, label: 'بناء الحدس', short: 'حدس', badgeColor: 'var(--gold)' },
  { source: 'mistake' as const, label: 'تشخيص الأخطاء', short: 'أخطاء', badgeColor: 'var(--coral)' },
  { source: 'ready' as const, label: 'فيديوهات جاهزة', short: 'جاهز', badgeColor: 'var(--primary)' },
  { source: 'solve' as const, label: 'حل التمارين', short: 'تمارين', badgeColor: 'var(--blue)' },
] as const;

export function getAllCurriculumEntries(): LegacyEntry[] {
  return STAGES.flatMap(stage => listLegacy(stage.source));
}

export function matchesChapter(entry: LegacyEntry, chapter: CurriculumChapter): boolean {
  if (entry.level !== chapter.level) return false;
  const pattern = CHAPTER_PATTERNS[chapter.id];
  if (!pattern) return false;
  return pattern.test(`${entry.chapter} ${entry.topic} ${entry.hook}`);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysYMD(s: string, days: number): string {
  const d = parseDateYMD(s);
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}

export const PLAN_STORAGE_KEY = 'qed_curriculum_plan_v1';

export function loadStoredPlan(): Record<string, ScheduledPlanItem> {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredPlan(plan: Record<string, ScheduledPlanItem>): void {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // browser quota limit
  }
}

/** Auto-schedule algorithm: distributes unscheduled videos over academic publishing cadence. */
export function generateAutoSchedule(
  entries: LegacyEntry[],
  existing: Record<string, ScheduledPlanItem>,
  level: CurriculumLevel,
  config: PlanConfig = DEFAULT_PLAN_CONFIG,
): Record<string, ScheduledPlanItem> {
  const levelEntries = entries.filter(e => e.level === level && !existing[e.id]);
  if (!levelEntries.length) return existing;

  const nextPlan: Record<string, ScheduledPlanItem> = { ...existing };
  const startDateStr = config.startDate || formatDateYMD(new Date());
  let current = parseDateYMD(startDateStr);
  let count = 0;
  const maxSlots = config.weeks * config.days.length * config.perDay;

  // Prioritize Intuition -> Mistake -> Ready -> Solve in round-robin fashion
  const queueBySource: Record<LegacySource, LegacyEntry[]> = {
    intuition: levelEntries.filter(e => e.source === 'intuition'),
    mistake: levelEntries.filter(e => e.source === 'mistake'),
    ready: levelEntries.filter(e => e.source === 'ready'),
    solve: levelEntries.filter(e => e.source === 'solve'),
  };

  const sequence: LegacySource[] = ['intuition', 'mistake', 'ready', 'solve'];
  const orderedList: LegacyEntry[] = [];
  let hasMore = true;

  while (hasMore && orderedList.length < levelEntries.length) {
    hasMore = false;
    for (const src of sequence) {
      if (queueBySource[src].length > 0) {
        orderedList.push(queueBySource[src].shift()!);
        hasMore = true;
      }
    }
  }

  for (let i = 0; i < orderedList.length && count < maxSlots; i++) {
    const entry = orderedList[i];
    // Find next matching publishing day of week
    while (!config.days.includes(current.getDay())) {
      current.setDate(current.getDate() + 1);
    }

    const dateStr = formatDateYMD(current);
    nextPlan[entry.id] = {
      id: crypto.randomUUID(),
      entryId: entry.id,
      level,
      date: dateStr,
      status: 'scheduled',
    };

    count++;
    // Move to next day for subsequent slot
    current.setDate(current.getDate() + 1);
  }

  return nextPlan;
}

/** Exports plan as CSV formatted string with BOM for Excel Arabic support. */
export function exportPlanAsCSV(
  plan: Record<string, ScheduledPlanItem>,
  entries: LegacyEntry[],
): string {
  const rows = [
    ['ID', 'Date', 'Level', 'Chapter', 'Topic', 'Stage', 'Status', 'Hook'],
  ];

  Object.values(plan)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(item => {
      const entry = entries.find(e => e.id === item.entryId);
      if (!entry) return;
      rows.push([
        item.id,
        item.date,
        item.level,
        entry.chapter,
        entry.topic,
        entry.source,
        item.status,
        entry.hook.replace(/\n/g, ' '),
      ]);
    });

  const csvContent = rows
    .map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return '\ufeff' + csvContent;
}
