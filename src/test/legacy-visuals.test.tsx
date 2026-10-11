import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LEGACY_RENDERERS, renderLegacyVisual, type VisualStage } from '@/lib/legacy-visuals';
import { legacyToProject, listLegacy, unsupportedLegacyModels } from '@/lib/legacy-library';
import { ScenePreview } from '@/components/studio/scene-preview';

const STAGES: VisualStage[] = ['predict', 'move', 'observe', 'general'];
const samples: Record<string, Record<string, number>> = {
  groups: { a: 2, b: 3, c: 4 }, area: { a: 2, b: 3 }, stair: { a: 0.5, b: 1, c: 4 }, balance: { a: 2, b: 3, c: 11 },
  venn: { a: 0.5, b: 0.4, c: 0.2 }, gcd: { a: 12, b: 8 }, fraction: { a: 1, b: 2, c: 1, d: 3 },
};

describe('legacy visual renderers', () => {
  it.each(Object.keys(LEGACY_RENDERERS))('%s renders valid SVG in every stage and at any time', model => {
    for (const stage of STAGES) for (const elapsed of [0, 0.4, 1.5, 3, 9]) {
      const node = renderLegacyVisual({ model, params: samples[model], stage, elapsed, duration: 4 });
      const html = renderToStaticMarkup(createElement('svg', null, node));
      expect(html).toContain(`data-legacy-model="${model}"`);
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it('renders the default-parameter case (no params) without NaN', () => {
    for (const model of Object.keys(LEGACY_RENDERERS)) {
      const html = renderToStaticMarkup(createElement('svg', null, renderLegacyVisual({ model, elapsed: 2, duration: 4 })));
      expect(html, model).not.toMatch(/NaN|Infinity/);
    }
  });

  it('every real library entry that uses a ported model renders in ScenePreview with no NaN', () => {
    let rendered = 0;
    for (const source of ['mistake', 'ready', 'intuition'] as const) {
      for (const entry of listLegacy(source)) {
        if (!(entry.model in LEGACY_RENDERERS)) continue;
        const project = legacyToProject(entry)!;
        for (const scene of project.scenes) {
          if (scene.legacy?.['visualModel'] !== entry.model) continue;
          const html = renderToStaticMarkup(createElement(ScenePreview, { project, scene, elapsed: scene.duration / 2 }));
          expect(html, `${entry.id}/${scene.title}`).toContain(`data-legacy-model="${entry.model}"`);
          expect(html, `${entry.id}/${scene.title}`).not.toMatch(/NaN|Infinity/);
          rendered++;
        }
      }
    }
    expect(rendered).toBeGreaterThan(20);
  });

  it('renders corner Telegram QR watermark badge on regular scenes and big QR card on CTA scene', () => {
    const entry = listLegacy('ready')[0]!;
    const project = legacyToProject(entry)!;
    // Scene 0: Hook scene with corner QR badge
    const hookHtml = renderToStaticMarkup(createElement(ScenePreview, { project, scene: project.scenes[0]! }));
    expect(hookHtml).toContain('art-qr-corner-badge');
    expect(hookHtml).toContain('@MathZyno_bot');
    expect(hookHtml).not.toContain('art-qr-cta-card');

    // Final CTA Scene: Includes both corner QR and big central CTA card
    const ctaScene = project.scenes.at(-1)!;
    const ctaHtml = renderToStaticMarkup(createElement(ScenePreview, { project, scene: ctaScene }));
    expect(ctaHtml).toContain('art-qr-corner-badge');
    expect(ctaHtml).toContain('art-qr-cta-card');
    expect(ctaHtml).toContain('@MathZyno_bot');
    expect(ctaHtml).toContain('امسح الكود');
  });

  it('intelligently wraps long Arabic sentences into multiple lines without truncation', () => {
    const entry = listLegacy('intuition')[1]!; // intuition-1 with long hook
    const project = legacyToProject(entry)!;
    const hookScene = project.scenes[0]!;
    const html = renderToStaticMarkup(createElement(ScenePreview, { project, scene: hookScene }));
    
    // Check that tspan elements are created for multiple wrapped lines
    const tspanCount = (html.match(/<tspan[^>]*>/g) || []).length;
    expect(tspanCount).toBeGreaterThanOrEqual(2);
    expect(html).toContain('3 مجموعات، كل وحدة فيها 2');
    expect(html).toContain('فيروزي: شحال في الكل؟ 🧮');
  });
});
