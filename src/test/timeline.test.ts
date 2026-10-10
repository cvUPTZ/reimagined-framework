import { describe, expect, it } from 'vitest';
import { defaultProject } from '@/lib/studio';
import { sceneStart, timelineMetrics, trimScene } from '@/lib/timeline';

describe('precise timeline transformations', () => {
  it('places clip boundaries at their actual times and scales widths with duration', () => {
    const metrics = timelineMetrics(defaultProject.scenes, 900, 2);
    expect(metrics.width).toBe(1800);
    expect(metrics.clips[0]?.width).toBe(300);
    expect(metrics.clips[1]?.left).toBe(300);
    expect(metrics.clips[1]?.width).toBe(400);
    expect(sceneStart(defaultProject.scenes, 2)).toBe(7);
  });
  it('trims only the requested clip, rounds to tenths and preserves the source', () => {
    const trimmed = trimScene(defaultProject, 's2', 2.26);
    expect(trimmed.scenes[1]?.duration).toBe(2.3);
    expect(trimmed.scenes[0]?.duration).toBe(3);
    expect(defaultProject.scenes[1]?.duration).toBe(4);
    expect(trimScene(defaultProject, 's1', -3).scenes[0]?.duration).toBe(.1);
    expect(trimScene(defaultProject, 's1', Infinity)).toBe(defaultProject);
  });
});