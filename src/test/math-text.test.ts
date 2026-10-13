import { describe, it, expect } from 'vitest';
import { prettifyMath, wrapFormula, stripEmoji, phaseLabel, bidiIsolateMath } from '@/lib/math-text';
import { mapLegacyModel } from '@/lib/legacy-library';
import { hasLegacyRenderer } from '@/lib/legacy-visuals';

describe('canvas math text', () => {
  it('writes the conjugate with a bar', () => expect(prettifyMath('= conj(z₁)')).toBe('= z\u0304₁'));
  it('removes emoji', () => expect(stripEmoji('Δ سالب؟ 🧮')).toBe('Δ سالب؟'));
  it('breaks equations only before =', () => {
    expect(wrapFormula('z₂ = (2 − 2i√3) / 2 = 1 − i√3 = z̄₁', 30)).toEqual(['z₂ = (2 − 2i√3) / 2', '= 1 − i√3 = z̄₁']);
  });
  it('translates studio phases into Arabic properly', () => {
    expect(phaseLabel('Predict')).toBe('توقّع');
    expect(phaseLabel('Observe')).toBe('لاحظ');
    expect(phaseLabel('Move')).toBe('حرّك واكتشف');
    expect(phaseLabel('Hook')).toBe('البداية');
  });
  it('isolates math expressions with Unicode LTR isolate markers', () => {
    expect(bidiIsolateMath('واش مساحته 2²+3²؟')).toBe('واش مساحته \u20662²+3²\u2069؟');
    expect(bidiIsolateMath('(2+3)² = ؟')).toBe('\u2066(2+3)² = ؟\u2069');
  });
});

describe('subject-matched visuals', () => {
  it('complex numbers use the complex plane, not a sine wave', () => {
    for (const m of ['cplx', 'carg', 'crot']) { expect(hasLegacyRenderer(m)).toBe(true); expect(mapLegacyModel(m)).not.toBe('wave'); }
  });
  it('probability and sequences no longer show the arithmetic number line', () => {
    for (const m of ['prob', 'binom', 'seq', 'pythag']) expect(mapLegacyModel(m)).toBe('none');
  });
});
