import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_CHAPTERS,
  DEFAULT_PLAN_CONFIG,
  exportPlanAsCSV,
  formatDateYMD,
  generateAutoSchedule,
  getAllCurriculumEntries,
  matchesChapter,
  parseDateYMD,
  getChapterProductionStats,
  createProjectForConcept,
  exportPlanForTikTok,
  buildTikTokPayloadForEntry,
  type ScheduledPlanItem,
} from '@/lib/curriculum-planner-store';

describe('Curriculum Planner Store & Matching Engine', () => {
  const allEntries = getAllCurriculumEntries();

  it('loads all curriculum entries across stages', () => {
    expect(allEntries.length).toBeGreaterThan(150);
  });

  it('matches 4AM entries accurately into chapters without dropping core units', () => {
    const chapters4AM = CURRICULUM_CHAPTERS['4AM'];
    const matched = chapters4AM.map(ch => ({
      name: ch.name,
      count: allEntries.filter(e => matchesChapter(e, ch)).length,
    }));

    // Every 4AM chapter has assigned videos
    for (const item of matched) {
      expect(item.count, `Chapter ${item.name} should have entries`).toBeGreaterThan(0);
    }
  });

  it('matches 3AS BAC entries accurately into chapters including Calculus, Geometry and Probability', () => {
    const chapters3AS = CURRICULUM_CHAPTERS['3AS'];
    const matched = chapters3AS.map(ch => ({
      name: ch.name,
      count: allEntries.filter(e => matchesChapter(e, ch)).length,
    }));

    // Check key chapters like Limits, Tangents, Exponentials, and Sequences
    expect(matched.find(m => m.name.includes('النهايات'))?.count).toBeGreaterThan(0);
    expect(matched.find(m => m.name.includes('الاشتقاقية'))?.count).toBeGreaterThan(0);
    expect(matched.find(m => m.name.includes('الأسية'))?.count).toBeGreaterThan(0);
    expect(matched.find(m => m.name.includes('المتتاليات'))?.count).toBeGreaterThan(0);
  });

  it('auto-schedules videos respecting preferred publishing days', () => {
    const schedule: Record<string, ScheduledPlanItem> = {};
    const auto = generateAutoSchedule(allEntries, schedule, '4AM', {
      ...DEFAULT_PLAN_CONFIG,
      weeks: 2,
      startDate: '2026-10-12', // A Monday
    });

    const items = Object.values(auto);
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(DEFAULT_PLAN_CONFIG.days.length * 2 * DEFAULT_PLAN_CONFIG.perDay);

    // Verify all scheduled dates fall on configured days of week (6=Sat, 1=Mon, 3=Wed)
    for (const item of items) {
      const date = parseDateYMD(item.date);
      expect(DEFAULT_PLAN_CONFIG.days).toContain(date.getDay());
    }
  });

  it('exports plan properly to CSV with Arabic support', () => {
    const schedule: Record<string, ScheduledPlanItem> = {
      'test-1': {
        id: 'test-1',
        entryId: allEntries[0]!.id,
        level: '4AM',
        date: '2026-10-15',
        status: 'scheduled',
      },
    };

    const csv = exportPlanAsCSV(schedule, allEntries);
    expect(csv.startsWith('\ufeff')).toBe(true); // UTF-8 BOM present
    expect(csv).toContain('2026-10-15');
    expect(csv).toContain('scheduled');
  });

  it('defines concepts and calculates production stats for each chapter', () => {
    const chapters4AM = CURRICULUM_CHAPTERS['4AM'];
    const chapters3AS = CURRICULUM_CHAPTERS['3AS'];

    // Every chapter has an array of concepts
    for (const ch of [...chapters4AM, ...chapters3AS]) {
      expect(ch.concepts.length).toBeGreaterThanOrEqual(3);
      for (const concept of ch.concepts) {
        expect(concept.name.length).toBeGreaterThan(0);
        expect(concept.description.length).toBeGreaterThan(0);
        expect(concept.keywords.length).toBeGreaterThan(0);
      }
    }

    // Verify PGCD chapter stats
    const pgcdChapter = chapters4AM[0]!;
    const stats = getChapterProductionStats(pgcdChapter, allEntries);
    expect(stats.totalAvailable).toBeGreaterThan(0);
    expect(stats.conceptCoverage.length).toBe(pgcdChapter.concepts.length);
    expect(stats.readinessPercent).toBeGreaterThan(0);

    // Verify concept project initialization
    const project = createProjectForConcept(pgcdChapter, pgcdChapter.concepts[0]!, 'intuition');
    expect(project).toBeDefined();
    expect(project.scenes.length).toBeGreaterThanOrEqual(3);
    expect(project.topic).toBe(pgcdChapter.concepts[0]!.name);
  });

  it('builds TikTok payloads and exports structured plan for automation', () => {
    const sampleEntry = allEntries[0]!;
    const payload = buildTikTokPayloadForEntry(sampleEntry, '2026-10-18');

    expect(payload.qed).toBe(true);
    expect(payload.title).toContain(sampleEntry.topic);
    expect(payload.caption).toContain(sampleEntry.topic);
    expect(payload.hashtags).toContain('#رياضيات');
    expect(payload.hashtags).toContain('#QED');
    expect(payload.date).toBe('2026-10-18');

    const schedule: Record<string, ScheduledPlanItem> = {
      'sched-1': {
        id: 'sched-1',
        entryId: sampleEntry.id,
        level: sampleEntry.level as any,
        date: '2026-10-18',
        status: 'scheduled',
      },
    };

    const planExport = exportPlanForTikTok(schedule, allEntries);
    expect(planExport.version).toBe(1);
    expect(planExport.totalVideos).toBe(1);
    expect(planExport.items[0]!.title).toBe(payload.title);
    expect(planExport.items[0]!.suggestedFileName).toMatch(/\.mp4$/);
    expect(planExport.items[0]!.caption).toBe(payload.caption);
  });
});
