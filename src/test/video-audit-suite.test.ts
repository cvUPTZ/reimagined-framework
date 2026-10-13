import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import {
  referenceProject,
  threeBlueOneBrownProject,
  originalZipProject,
  bacLogarithmProject,
  bacIntegralsProject,
  tvMarketingLoopProject,
} from '@/lib/reference-project';
import { defaultProject } from '@/lib/studio';
import { educationalLessons, lessonToStudioProject } from '@/lib/educational-library';
import { validateProjectHealth } from '@/lib/video-validator';
import { ScenePreview } from '@/components/studio/scene-preview';

describe('Permanent Video Audit Suite (Quality & Consistency Gate)', () => {
  const showcaseProjects = [
    referenceProject,
    threeBlueOneBrownProject,
    originalZipProject,
    bacLogarithmProject,
    bacIntegralsProject,
    tvMarketingLoopProject,
    defaultProject,
  ];

  describe('Showcase & Template Projects', () => {
    it.each(showcaseProjects)('$name passes deterministic validation with zero errors', (project) => {
      const report = validateProjectHealth(project);
      if (!report.isValid) {
        console.error(`Validation failed for ${project.name}:`, report.errors);
      }
      expect(report.errors).toEqual([]);
    });

    it.each(showcaseProjects)('$name renders all scenes to SVG without NaN coordinates', (project) => {
      for (const scene of project.scenes) {
        for (const elapsed of [0, scene.duration / 2, scene.duration]) {
          const svg = renderToStaticMarkup(
            React.createElement(ScenePreview, {
              project,
              scene,
              elapsed,
              playing: true,
            })
          );
          expect(svg).not.toContain('NaN');
          expect(svg).toContain('<svg');
        }
      }
    });
  });

  describe('Curriculum Educational Lessons Library (16 Lessons)', () => {
    it.each(educationalLessons)('Lesson $id ($title) produces valid StudioProject with zero errors', (lesson) => {
      const project = lessonToStudioProject(lesson);
      const report = validateProjectHealth(project);
      if (!report.isValid) {
        console.error(`Validation failed for ${lesson.id}:`, report.errors);
      }
      expect(report.errors).toEqual([]);
    });

    it.each(educationalLessons)('Lesson $id renders all scenes with no NaN', (lesson) => {
      const project = lessonToStudioProject(lesson);
      for (const scene of project.scenes) {
        const svg = renderToStaticMarkup(
          React.createElement(ScenePreview, {
            project,
            scene,
            elapsed: scene.duration / 2,
            playing: true,
          })
        );
        expect(svg).not.toContain('NaN');
      }
    });
  });

  describe('Engine Quality & Distance Legibility Guards', () => {
    it('masks calculated values during predict stage across models', async () => {
      const { renderLegacyVisual } = await import('@/lib/legacy-visuals');
      
      // area model in predict stage must mask answers with '؟'
      const areaPredict = renderToStaticMarkup(
        renderLegacyVisual({
          model: 'area',
          stage: 'predict',
          elapsed: 1,
          duration: 5,
          params: { a: 2, b: 3 },
        }) as React.ReactElement
      );
      expect(areaPredict).toContain('؟');
      expect(areaPredict).not.toContain('2×2 = 4');

      // disc model in predict stage must mask delta value
      const discPredict = renderToStaticMarkup(
        renderLegacyVisual({
          model: 'disc',
          stage: 'predict',
          elapsed: 1,
          duration: 5,
          params: { b: 4, c: 3 },
        }) as React.ReactElement
      );
      expect(discPredict).toContain('Δ = b² − 4ac = ؟');

      // sqrt model in predict stage must mask result
      const sqrtPredict = renderToStaticMarkup(
        renderLegacyVisual({
          model: 'sqrt',
          stage: 'predict',
          elapsed: 1,
          duration: 5,
          params: { a: 3 },
        }) as React.ReactElement
      );
      expect(sqrtPredict).toContain('√9 = ؟');
    });

    it('renders TV broadcast 2-column layout in landscape mode', () => {
      const landscapeProject = {
        ...referenceProject,
        format: 'landscape' as const,
      };
      const sceneWithVisual = landscapeProject.scenes[2]!;
      const svg = renderToStaticMarkup(
        React.createElement(ScenePreview, {
          project: landscapeProject,
          scene: sceneWithVisual,
          elapsed: 2,
          playing: true,
        })
      );
      expect(svg).toContain('viewBox="0 0 960 540"');
      expect(svg).not.toContain('NaN');
      // Visual is scaled up for broadcast TV clarity (>= 0.9 scale)
      expect(svg).toMatch(/scale\(0\.9[0-9]*\)/);
    });
  });
});
