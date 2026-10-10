import { describe, expect, it } from 'vitest';
import { legacyCounts, legacyLevels, legacyToProject, listLegacy, mapLegacyModel, searchLegacy, unsupportedLegacyModels, type LegacySource } from '@/lib/legacy-library';

const SOURCES: LegacySource[] = ['mistake', 'ready', 'intuition', 'solve'];

describe('legacy library (restored from Cinematic Math Builder v3)', () => {
  it('matches the archive counts extracted from the original sources', () => {
    expect(legacyCounts()).toEqual({ mistakes: 122, ready: 78, intuition: 61, solve: 13 });
  });

  it('every READY video resolves to a base mistake', () => {
    expect(listLegacy('ready')).toHaveLength(78);
  });

  it.each(SOURCES)('%s: every entry converts to a valid, non-empty project', source => {
    for (const entry of listLegacy(source)) {
      const p = legacyToProject(entry);
      expect(p, entry.id).not.toBeNull();
      expect(p!.scenes.length).toBeGreaterThanOrEqual(5);
      for (const s of p!.scenes) {
        expect(s.body.trim().length, `${entry.id}/${s.title}`).toBeGreaterThan(0);
        expect(s.duration).toBeGreaterThan(0);
      }
      expect(p!.scenes[0]!.kind).toBe('hook');
      expect(p!.scenes.at(-1)!.kind).toBe('cta');
    }
  });

  it('keeps the legacy visual model so nothing is lost', () => {
    const e = listLegacy('intuition').find(x => x.model === 'area')!;
    const p = legacyToProject(e)!;
    expect(p.scenes[0]!.legacy?.['visualModel']).toBe('area');
    expect(p.scenes[0]!.visual).toBe('integral');
  });

  it('solve exercises keep one scene per step with narration and diagram state', () => {
    const e = listLegacy('solve')[0]!;
    const p = legacyToProject(e)!;
    const steps = p.scenes.filter(s => s.phase === 'Step');
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.every(s => !!s.narration && s.legacy?.['solveDiagram'] != null)).toBe(true);
  });

  it('filters by level and query', () => {
    expect(legacyLevels('ready')).toEqual(expect.arrayContaining(['3AS', '4AM']));
    const only4 = searchLegacy('mistake', '', '4AM');
    expect(only4.length).toBeGreaterThan(0);
    expect(only4.every(e => e.level === '4AM')).toBe(true);
    expect(searchLegacy('mistake', 'zzzz-no-match')).toHaveLength(0);
  });

  it('reports which legacy visual models still need a real renderer', () => {
    const missing = unsupportedLegacyModels();
    expect(Array.isArray(missing)).toBe(true);
    expect(mapLegacyModel('tangent')).toBe('tangent');
    expect(mapLegacyModel('__unknown__')).toBe('none');
  });
});
