import { describe, expect, it } from 'vitest';
import { clipDiagramLine, diagramReveal, openDiagramPath } from '@/lib/diagram-geometry';

describe('bounded mathematical geometry', () => {
  it('clips an extended tangent while preserving its slope', () => {
    expect(clipDiagramLine([195, 800], [195, -400])).toEqual([[195, 326], [195, 48]]);
    const clipped = clipDiagramLine([-100, -100], [500, 500]);
    expect(clipped).toEqual([[48, 48], [326, 326]]);
  });
  it('excludes lines outside the drawing area and invalid coordinates', () => {
    expect(clipDiagramLine([0, 0], [5, 20])).toBeNull();
    expect(clipDiagramLine([NaN, 100], [200, 200])).toBeNull();
  });
  it('reveals curve before mathematical annotations at scene-local times', () => {
    expect(diagramReveal(0, 5)).toBe(0);
    expect(diagramReveal(1.4, 5)).toBe(1);
    expect(diagramReveal(1.4, 5, 0.3)).toBe(0);
    expect(diagramReveal(5, 5, 0.3)).toBe(1);
  });
  it('keeps curves separate across an undefined domain', () => {
    expect(openDiagramPath([[50, 60], [100, 90], null, [200, 110], [240, 130]])).toBe('M 50 60 L 100 90 M 200 110 L 240 130');
  });
  it('clips a curve without changing its slope', () => {
    expect(openDiagramPath([[-100, -100], [500, 500]])).toBe('M 48 48 L 326 326');
  });
});