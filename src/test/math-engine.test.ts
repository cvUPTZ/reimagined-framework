import { describe, it, expect } from 'vitest';
import { evaluateMathExpression, computeSlope, generatePlotData, tokenize } from '@/lib/math-engine';
import { educationalLessons, searchEducationalLessons, lessonToStudioProject } from '@/lib/educational-library';

describe('mathematics engine safe evaluation & plotting', () => {
  it('tokenizes expressions safely without eval', () => {
    const tokens = tokenize('sin(x) + 3 * x^2');
    expect(tokens.map(t => t.type)).toEqual(['FUNC', 'LPAREN', 'VAR', 'RPAREN', 'OP', 'NUMBER', 'OP', 'VAR', 'OP', 'NUMBER']);
  });

  it('evaluates polynomial and power functions accurately', () => {
    expect(evaluateMathExpression('x^2', 3).value).toBe(9);
    expect(evaluateMathExpression('2 * x + 5', 4).value).toBe(13);
    expect(evaluateMathExpression('(x + 2) * 3', 1).value).toBe(9);
  });

  it('evaluates trigonometric and exponential functions accurately', () => {
    expect(evaluateMathExpression('sin(0)', 0).value).toBe(0);
    expect(evaluateMathExpression('cos(0)', 0).value).toBe(1);
    expect(evaluateMathExpression('exp(0)', 0).value).toBe(1);
  });

  it('safely handles divide by zero and negative square root without crashing', () => {
    const divZero = evaluateMathExpression('1 / x', 0);
    expect(divZero.error).toBeDefined();

    const sqrtNeg = evaluateMathExpression('sqrt(-4)', 0);
    expect(sqrtNeg.error).toBeDefined();
  });

  it('approximates derivative slope numerically', () => {
    // For f(x) = x^2, derivative at x=1 is 2
    const slope = computeSlope('x^2', 1);
    expect(slope).toBeCloseTo(2, 2);

    // For f(x) = 3*x, derivative at x=5 is 3
    const linearSlope = computeSlope('3 * x', 5);
    expect(linearSlope).toBeCloseTo(3, 2);
  });

  it('generates continuous SVG plot data coordinates within bounding bounds', () => {
    const data = generatePlotData('x^2', { minX: -2, maxX: 2, steps: 20 });
    expect(data.hasError).toBe(false);
    expect(data.points.length).toBe(21);
    expect(data.pathD.startsWith('M ')).toBe(true);
  });

  it('provides safe error diagnostics on invalid expressions', () => {
    const data = generatePlotData('x + * 5');
    expect(data.hasError).toBe(true);
    expect(data.errorMessage).toBeDefined();
  });
});

describe('educational mathematics library restoration', () => {
  it('contains curated educational lessons with curriculum metadata and diagnostic cases', () => {
    expect(educationalLessons.length).toBeGreaterThanOrEqual(5);
    const orderLesson = educationalLessons.find(l => l.id === 'lesson-order-of-operations');
    expect(orderLesson).toBeDefined();
    expect(orderLesson?.level).toBe('1AS / 4AM');
    expect(orderLesson?.mistake).toContain('الأقواس');
  });

  it('searches and filters lessons by level and search query', () => {
    const bacLessons = searchEducationalLessons('', 'BAC 2026');
    expect(bacLessons.length).toBeGreaterThanOrEqual(3);
    expect(bacLessons.every(l => l.level.includes('BAC'))).toBe(true);

    const querySearch = searchEducationalLessons('مماس');
    expect(querySearch.length).toBeGreaterThanOrEqual(1);
    expect(querySearch[0]?.topic).toContain('المماس');
  });

  it('converts an educational lesson into a complete verified StudioProject with narrative arc', () => {
    const lesson = educationalLessons[0]!;
    const project = lessonToStudioProject(lesson);

    expect(project.name).toBe(lesson.topic);
    expect(project.scenes).toHaveLength(6);
    expect(project.scenes[0]?.kind).toBe('hook');
    expect(project.scenes[1]?.phase).toBe('Diagnosis');
    expect(project.scenes[2]?.phase).toBe('Intuition');
    expect(project.scenes[3]?.phase).toBe('Solution');
    expect(project.scenes[5]?.kind).toBe('cta');
    expect(project.scenes[0]?.visual).toBe(lesson.visualModel);
  });
});
