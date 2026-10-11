import { it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { writeFileSync } from 'fs';
import { renderLegacyVisual, type VisualStage } from '@/lib/legacy-visuals';

const cases: Array<[string, string, VisualStage]> = [
  ['wave', 'trig', 'move'],
  ['exp', 'growth', 'move'],
  ['log', 'logadd', 'general'],
  ['inverse', 'inverse', 'observe'],
  ['system', 'system', 'general'],
  ['linear', 'linear', 'move'],
  ['curve', 'variation', 'observe'],
];

it('dumps new model SVGs for visual review', () => {
  for (const [name, model, stage] of cases) {
    const node = renderLegacyVisual({ model, stage, elapsed: 3, duration: 6, params: { a: 2, b: 1, c: 3 } });
    const svg = renderToStaticMarkup(createElement('svg', { viewBox: '0 0 390 440', width: 390, height: 440, style: { background: '#0b0f16' } }, node));
    writeFileSync(`/tmp/browser/visuals/screenshots/r_${name}.svg`, svg);
  }
});
