import { describe, it, expect } from 'vitest';
import { parseProjectFile, projectFile, sceneAtTime, sceneMotion } from '@/lib/project-file';
import { defaultProject } from '@/lib/studio';

describe('project compatibility and rendering timing', () => {
  it('retains original text, timing, narration, layers and unknown effect data', () => {
    const original = { title: 'Original', brand: { accent: 'mint' }, scenes: [{ dur: 4, txt: 'First', texts: [{ t: 'Second', top: 22 }], say: 'Narration', fx: 'dust' }] };
    const result = parseProjectFile({ app: 'cinematic-math-builder', format: 1, project: original });
    expect(result.project.scenes[0]?.body).toBe('First\nSecond');
    expect(result.project.scenes[0]?.duration).toBe(4);
    expect(result.project.scenes[0]?.narration).toBe('Narration');
    expect(parseProjectFile(projectFile(result.project)).project.legacy).toEqual(original);
    expect(result.warnings).toHaveLength(1);
  });
  it('round trips the current project without losing scenes', () => {
    expect(parseProjectFile(projectFile(defaultProject)).project).toEqual(defaultProject);
  });
  it('rejects non-positive durations and duplicate scene ids', () => {
    expect(() => parseProjectFile({ ...defaultProject, scenes: [{ ...defaultProject.scenes[0], duration: 0 }] })).toThrow();
    expect(() => parseProjectFile({ ...defaultProject, scenes: [defaultProject.scenes[0], defaultProject.scenes[0]] })).toThrow();
  });
  it('selects the next scene at exactly the boundary', () => {
    expect(sceneAtTime(defaultProject, 3).index).toBe(1);
    expect(sceneAtTime(defaultProject, 3).localTime).toBe(0);
    expect(sceneAtTime(defaultProject, 4).localTime).toBe(1);
  });
  it('computes animation from elapsed time, including paused mid-animation', () => {
    const scene = { ...defaultProject.scenes[0], id: 'fade', title: '', label: '', body: '', duration: 3, kind: 'hook' as const, animation: 'Fade' as const };
    expect(sceneMotion(scene, .35).opacity).toBe(.5);
    expect(sceneMotion(scene, 1).opacity).toBe(1);
  });
  it('computes slide left, zoom in, wipe and custom transition durations accurately', () => {
    const slideLeftScene = { ...defaultProject.scenes[0], id: 'slide-left', title: '', label: '', body: '', duration: 3, kind: 'hook' as const, animation: 'Slide left' as const, transitionDuration: 1.0 };
    const motionHalf = sceneMotion(slideLeftScene, 0.5);
    expect(motionHalf.opacity).toBe(0.5);
    expect(motionHalf.offsetX).toBeCloseTo(22.5);

    const zoomScene = { ...defaultProject.scenes[0], id: 'zoom', title: '', label: '', body: '', duration: 3, kind: 'hook' as const, animation: 'Zoom in' as const, transitionDuration: 1.0 };
    expect(sceneMotion(zoomScene, 0.5).scale).toBeCloseTo(0.95);
    expect(sceneMotion(zoomScene, 1.0).scale).toBe(1);

    const wipeScene = { ...defaultProject.scenes[0], id: 'wipe', title: '', label: '', body: '', duration: 3, kind: 'hook' as const, animation: 'Wipe' as const, transitionDuration: 1.0 };
    expect(sceneMotion(wipeScene, 0.4).wipeProgress).toBeCloseTo(0.4);
    expect(sceneMotion(wipeScene, 1.0).wipeProgress).toBe(1.0);
  });
  it('round trips canvas layers and typography customizations without data loss', () => {
    const customized = {
      ...defaultProject,
      scenes: [
        {
          ...defaultProject.scenes[0],
          fontSize: 54,
          fontFamily: 'Tajawal' as const,
          fontWeight: 700 as const,
          textAlign: 'right' as const,
          lineHeight: 1.5,
          textColor: 'primary' as const,
          textY: 15,
          visual: 'tangent' as const,
          visualY: -20,
          visualScale: 1.2,
          expressionY: 30,
          showGrid: false,
          showBrand: true,
          showPhase: false,
          showText: true,
          showVisual: true,
          showExpression: false,
          showFootnote: false,
          animation: 'Slide left' as const,
          transitionDuration: 0.8,
        },
      ],
    };
    const parsed = parseProjectFile(projectFile(customized)).project;
    expect(parsed.scenes[0]).toMatchObject({
      fontSize: 54,
      fontFamily: 'Tajawal',
      fontWeight: 700,
      textAlign: 'right',
      lineHeight: 1.5,
      textColor: 'primary',
      textY: 15,
      visual: 'tangent',
      visualY: -20,
      visualScale: 1.2,
      expressionY: 30,
      showGrid: false,
      showBrand: true,
      showPhase: false,
      showText: true,
      showVisual: true,
      showExpression: false,
      showFootnote: false,
      animation: 'Slide left',
      transitionDuration: 0.8,
    });
  });
  it('round trips brand kits and audio track configurations without data loss', () => {
    const withBrandAndAudio = {
      ...defaultProject,
      brandKit: {
        name: 'BAC Excellence',
        brandName: 'BAC 2026',
        tagline: 'DIPLOMA WITH DISTINCTION',
        footnote: 'EXCELLENCE IN MATHEMATICS',
        accentColor: 'oklch(0.83 0.14 95)',
        logoStyle: 'square' as const,
      },
      audioTrack: {
        name: 'narration.webm',
        url: 'blob:http://localhost/test-audio',
        volume: 80,
        muted: false,
        startOffset: 1.5,
        ducking: true,
      },
    };
    const parsed = parseProjectFile(projectFile(withBrandAndAudio)).project;
    expect(parsed.brandKit).toEqual(withBrandAndAudio.brandKit);
    expect(parsed.audioTrack).toEqual(withBrandAndAudio.audioTrack);
  });
});