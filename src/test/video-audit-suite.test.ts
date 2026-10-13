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
});
