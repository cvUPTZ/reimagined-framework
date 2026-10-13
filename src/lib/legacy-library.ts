import mistakesJson from '@/data/legacy/mistakes.json';
import inlineJson from '@/data/legacy/inline-mistakes.json';
import readyJson from '@/data/legacy/ready.json';
import intuitionJson from '@/data/legacy/intuition.json';
import solveJson from '@/data/legacy/solve.json';
import solveTypesJson from '@/data/legacy/solve-types.json';
import { hasLegacyRenderer, type VisualStage } from './legacy-visuals';
import { defaultBrandKits, makeId, type Scene, type StudioProject, type VisualModelType } from './studio';

/**
 * Restored content of the original Cinematic Math Builder (v3).
 * The JSON files in src/data/legacy are produced by scripts/extract-legacy-library.mjs
 * straight from the original sources — never edit them by hand.
 */

export interface LegacyMistake {
  level: string;
  chapter: string;
  topic: string;
  mistake: string;
  cause: string;
  expr: string;
  fix: string;
  aud?: string;
  vis?: LegacyVisual;
}

export interface LegacyVisual { m: string; [key: string]: unknown }

interface RawReady { i?: number; k?: string; hook: string; ch?: [string, string]; ex?: unknown; vis?: LegacyVisual }
interface RawIntuition {
  lv: string; chapter: string; topic: string; m: string; r1?: LegacyVisual; r2?: LegacyVisual;
  hook: string; rule: string; ch?: [string, string]; say?: Record<string, string>;
}
interface RawSolveStep { title: string; say: string; lines: string[]; d?: Record<string, unknown> }
interface RawSolve {
  ty: string; lv: string; chapter: string; topic: string; src?: string; hook: string; stmt: string; ask?: string;
  say0?: string; steps: RawSolveStep[]; answer?: string | string[]; ch?: [string, string]; chAsk?: string; sayEnd?: string;
}

export type LegacySource = 'mistake' | 'ready' | 'intuition' | 'solve';

export interface LegacyEntry {
  id: string;
  source: LegacySource;
  level: string;
  chapter: string;
  topic: string;
  hook: string;
  /** Legacy visual model name (e.g. "area", "stair"). */
  model: string;
  /** Short line for list cards. */
  summary: string;
  /** Kind of solved exercise, only for source === 'solve'. */
  solveType?: string;
}

const MISTAKES = mistakesJson as unknown as LegacyMistake[];
const INLINE = inlineJson as unknown as Record<string, LegacyMistake>;
const READY = readyJson as unknown as RawReady[];
const INTUITION = intuitionJson as unknown as RawIntuition[];
const SOLVE = solveJson as unknown as RawSolve[];
export const SOLVE_TYPES = solveTypesJson as unknown as Record<string, [string, string, string]>;

export const legacyCounts = () => ({
  mistakes: MISTAKES.length,
  ready: READY.length,
  intuition: INTUITION.length,
  solve: SOLVE.length,
});

/** The mistake a READY video is built on (by LIB index `i`, or by INLINE_4AM key `k`). */
export function readyBase(r: RawReady): LegacyMistake | undefined {
  if (typeof r.i === 'number') return MISTAKES[r.i];
  if (r.k) return INLINE[r.k];
  return undefined;
}

const defaultHook = (m: LegacyMistake) => `${m.mistake}\nهل هذا صحيح؟`;

export function listLegacy(source: LegacySource): LegacyEntry[] {
  switch (source) {
    case 'mistake':
      return MISTAKES.map((m, n) => ({
        id: `mistake-${n}`, source, level: m.level, chapter: m.chapter, topic: m.topic,
        hook: defaultHook(m), model: m.vis?.m ?? 'none', summary: m.mistake,
      }));
    case 'ready':
      return READY.flatMap((r, n) => {
        const b = readyBase(r);
        if (!b) return [];
        return [{
          id: `ready-${n}`, source, level: b.level, chapter: b.chapter, topic: b.topic,
          hook: r.hook, model: (r.vis ?? b.vis)?.m ?? 'none', summary: b.mistake,
        }];
      });
    case 'intuition':
      return INTUITION.map((x, n) => ({
        id: `intuition-${n}`, source, level: x.lv, chapter: x.chapter, topic: x.topic,
        hook: x.hook, model: x.m, summary: x.rule,
      }));
    case 'solve':
      return SOLVE.map((x, n) => ({
        id: `solve-${n}`, source, level: x.lv, chapter: x.chapter, topic: x.topic,
        hook: x.hook, model: x.ty, summary: x.stmt.split('\n')[0] ?? x.topic, solveType: x.ty,
      }));
  }
}

export function searchLegacy(source: LegacySource, query = '', level = 'all'): LegacyEntry[] {
  const q = query.trim().toLowerCase();
  return listLegacy(source).filter(e => {
    if (level !== 'all' && e.level !== level) return false;
    if (!q) return true;
    return [e.topic, e.chapter, e.hook, e.summary].some(s => s.toLowerCase().includes(q));
  });
}

export function legacyLevels(source: LegacySource): string[] {
  return [...new Set(listLegacy(source).map(e => e.level))].sort();
}

/**
 * Closest visual the current renderer can draw for a legacy model. Anything not listed is
 * "none" — the legacy model name is still stored in scene.legacy so nothing is lost and the
 * port coverage can be reported (see unsupportedLegacyModels).
 */
const MODEL_MAP: Record<string, VisualModelType> = {
  // Calculus, Tangents & Derivatives
  tangent: 'tangent', secant: 'tangent', zoom: 'tangent', chain: 'tangent', flip: 'tangent',
  
  // Functions, Curves, Limits & Asymptotes
  limit: 'curve', asym: 'curve', variation: 'curve', convex: 'curve', quad: 'curve',
  func: 'curve', ivt: 'curve', squeeze: 'curve', sqrt: 'curve', diffsq: 'curve',
  inverse: 'curve', disc: 'curve', linear: 'curve', system: 'curve',
  
  // Integrals, Areas & Geometry
  area: 'integral', riemann: 'integral', ftc: 'integral', signarea: 'integral', revolve: 'integral',
  volume: 'integral',
  
  // Trigonometry, Periodic Waves & Complex Numbers
  trig: 'wave', sinx: 'wave', clock: 'wave', crot: 'none', carg: 'none', cplx: 'none',
  
  // Exponentials, Growth, Logarithms & Powers
  expk: 'exponential', growth: 'exponential', logadd: 'exponential', powers: 'exponential',
  
  // Number line, Arithmetic, Sequences, Probability & Statistics
  numline: 'number-line', stair: 'number-line', gap: 'number-line', bounds: 'number-line',
  // Subjects with no faithful drawing yet show none rather than an unrelated arithmetic diagram.
  seq: 'none', sieve: 'none', off: 'number-line', pct: 'none',
  domino: 'none', binom: 'none', parity: 'none', pascal: 'none',
  mean: 'none', prob: 'none', cond: 'none', tree: 'none',
  num: 'number-line', gcd: 'number-line', fraction: 'number-line', balance: 'number-line',
  groups: 'number-line', venn: 'number-line',
  
  // Geometry & Triangles
  thales: 'none', dist: 'curve', geo: 'none', triangle: 'none', euclid: 'none',
  pythag: 'none', scale: 'none', inscr: 'none', rtri: 'none',
};

export const mapLegacyModel = (m: string): VisualModelType => MODEL_MAP[m] ?? 'none';

export function unsupportedLegacyModels(): string[] {
  const used = new Set<string>();
  for (const s of ['mistake', 'ready', 'intuition', 'solve'] as const) for (const e of listLegacy(s)) used.add(e.model);
  used.delete('none');
  return [...used].filter(m => !hasLegacyRenderer(m) && !(m in MODEL_MAP)).sort();
}

/* ---------------------------------------------------------------- scene building */

const secondsFor = (text: string, min = 3, max = 9) => Math.max(min, Math.round((text.length / 14 + 1.5) * 2) / 2);

type SceneInit = { title: string; body: string; kind: Scene['kind']; phase: string; model?: string; params?: LegacyVisual | undefined; stage?: VisualStage; narration?: string; expression?: string; legacy?: Record<string, unknown>; animation?: Scene['animation'] };

function buildScenes(inits: SceneInit[], fallbackVisual: VisualModelType = 'none'): Scene[] {
  return inits.map((s, n) => {
    const visual = s.model ? mapLegacyModel(s.model) : fallbackVisual;
    const scene: Scene = {
      id: makeId(),
      title: s.title,
      label: String(n + 1).padStart(2, '0'),
      body: s.body,
      duration: secondsFor(s.narration ?? s.body),
      kind: s.kind,
      phase: s.phase,
      animation: s.animation ?? (s.kind === 'cta' ? 'Zoom in' : n === 0 ? 'Draw in' : 'Fade'),
      visual,
      fontFamily: 'Tajawal',
      fontSize: s.kind === 'hook' || s.kind === 'cta' ? 42 : 38,
    };
    if (s.expression) scene.expression = s.expression;
    if (s.narration) scene.narration = s.narration;
    if (s.model || s.legacy) scene.legacy = { ...(s.model ? { visualModel: s.model } : {}), ...(s.params ? { visualParams: s.params } : {}), ...(s.stage ? { visualStage: s.stage } : {}), ...s.legacy };
    return scene;
  });
}

const CTA = 'شخّص ثغرتك مجاناً مع QED';

function projectFrom(entry: LegacyEntry, scenes: Scene[], extra: Partial<StudioProject>): StudioProject {
  return {
    id: `project-${entry.id}-${makeId()}`,
    name: entry.topic,
    format: 'portrait',
    topic: entry.topic,
    level: entry.level,
    mistake: '',
    expression: '',
    remediation: '',
    cta: CTA,
    brandKit: defaultBrandKits['threeblueonebrown'] as NonNullable<StudioProject['brandKit']>,
    scenes,
    legacy: { source: entry.source, legacyId: entry.id },
    ...extra,
  };
}

function inferVisualFromEntry(b: LegacyMistake): string {
  if (b.vis?.m && b.vis.m !== 'off') return b.vis.m;
  const text = (b.level || '') + ' ' + (b.chapter || '') + ' ' + (b.topic || '') + ' ' + (b.mistake || '') + ' ' + (b.expr || '') + ' ' + (b.cause || '') + ' ' + (b.fix || '');
  
  // 1. Geometry, Triangles & Angles
  if (/طالس|فيثاغورس|مثلث|دائرة|زاوية|وتر|تشابه|geo|triangle|pythag|thales/i.test(text)) return 'thales';
  
  // 2. Arithmetic, Division, PGCD, Primes, Modular arithmetic
  if (/pgcd|قاسم|قواسم|إقليدس|أوليان|أولية|موافقات|تعداد|بواقي|غوص|بيزو|gcd|sieve/i.test(text)) return 'gcd';
  
  // 3. Fractions
  if (/كسر|كسور|مقام|بسط|توحيد|fraction/i.test(text) || /\d+÷\d+\+\d+÷\d+/.test(b.expr || '')) return 'fraction';
  
  // 4. Roots
  if (/جذر|جذور|√|sqrt/i.test(text)) return 'sqrt';
  
  // 5. Algebraic expansion, Identities, Factoring
  if (/متطابق|نشر|تحليل|مربع مجموع|مربع فرق|جداء مجموعين|عامل مشترك|\(a\+b\)/i.test(text)) return 'area';
  
  // 6. Order of operations, Brackets
  if (/أولويات|أقواس|أسبقية|رتبة|operations|groups/i.test(text)) return 'groups';
  
  // 7. Equations, Inequalities, Balance
  if (/ميزان|معادلة|معادلات|متراجح|مجهول|طرفي/i.test(text)) return 'balance';
  
  // 8. Number line, Negative numbers, Intervals, Order
  if (/أعداد نسبية|سالب|مجال|مجالات|حصر|قيمة مطلقة|ترتيب|numline|sign/i.test(text)) return 'numline';
  
  // 9. Sequences
  if (/متتالي|تراجع|حدود متتابعة|حسابية|هندسية|stair|seq/i.test(text)) return 'stair';
  
  // 10. Probability & Counting
  if (/احتمال|عد|توفيقة|ترتيبة|تبديلة|شجرة|venn|دستور ثنائي الحد/i.test(text)) return 'venn';
  
  // 11. Complex numbers & Trigonometry
  if (/مركب|مركبة|عمدة|طويلة|مرافق|مثلثات|جيب|cos|sin|tan|cplx|arg/i.test(text)) return 'wave';
  
  // 12. Exponentials & Logarithms & Powers
  if (/أسية|قوى|أس|exp|e\^/i.test(text)) return 'exponential';
  if (/لوغاريتم|ln|log/i.test(text)) return 'logadd';
  
  // 13. Calculus: Integrals & Primitives
  if (/تكامل|أصلية|مساحة تحت|ريمان|riemann|integral/i.test(text)) return 'riemann';
  
  // 14. Calculus: Derivatives & Tangents
  if (/مشتق|اشتقاق|مماس|ميل|tangent|تآلفي/i.test(text)) return 'tangent';
  
  // 15. Functions, Limits, Asymptotes
  if (/نهاية|نهايات|مستقيم مقارب|استمرار|تزايد مقارن|مبرهنة القيم المتوسطة|تغيرات|دالة|منحنى/i.test(text)) return 'curve';
  
  return 'none';
}

function parseChallengeParams(text: string, baseModel: string): LegacyVisual | undefined {
  if (!text) return undefined;
  const nums = text.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return undefined;
  if (baseModel === 'fraction' && nums.length >= 4) {
    return { m: baseModel, a: Number(nums[0]), b: Number(nums[1]), c: Number(nums[2]), d: Number(nums[3]) };
  }
  return { m: baseModel, a: Number(nums[0]), b: Number(nums[1]) };
}

function inferParamsForMistake(b: LegacyMistake, model: string): LegacyVisual {
  if (b.vis && Object.keys(b.vis).length > 1) return b.vis;
  const combined = (b.expr || '') + ' ' + (b.mistake || '') + ' ' + (b.cause || '') + ' ' + (b.fix || '');
  const nums = combined.match(/\d+(?:\.\d+)?/g);
  if (model === 'gcd') {
    if (nums && nums.length >= 2) return { m: 'gcd', a: Number(nums[0]), b: Number(nums[1]) };
    return { m: 'gcd', a: 30, b: 18 };
  }
  if (model === 'fraction') {
    if (nums && nums.length >= 4) return { m: 'fraction', a: Number(nums[0]), b: Number(nums[1]), c: Number(nums[2]), d: Number(nums[3]) };
    if (nums && nums.length >= 2) return { m: 'fraction', a: Number(nums[0]), b: Number(nums[1]), c: 1, d: 3 };
    return { m: 'fraction', a: 1, b: 2, c: 1, d: 3 };
  }
  if (model === 'area') {
    if (nums && nums.length >= 2) return { m: 'area', a: Number(nums[0]), b: Number(nums[1]) };
    return { m: 'area', a: 3, b: 2 };
  }
  if (model === 'groups') {
    if (nums && nums.length >= 3) return { m: 'groups', a: Number(nums[1]), b: Number(nums[2]), c: Number(nums[0]) };
    return { m: 'groups', a: 2, b: 3, c: 4 };
  }
  if (model === 'numline') {
    if (nums && nums.length >= 2) return { m: 'numline', a: Number(nums[0]), b: Number(nums[1]) };
    return { m: 'numline', a: -5, b: 3 };
  }
  if (model === 'balance') {
    if (nums && nums.length >= 2) return { m: 'balance', a: 2, b: Number(nums[0]), c: Number(nums[1]) };
    return { m: 'balance', a: 2, b: 3, c: 7 };
  }
  if (model === 'stair') {
    return { m: 'stair', a: 0.5, b: 3, c: 0 };
  }
  if (model === 'venn') {
    return { m: 'venn', a: 0.6, b: 0.5, c: 0.3 };
  }
  if (model === 'tangent') {
    return { m: 'tangent', a: 1 };
  }
  return { m: model };
}

function mistakeScenes(b: LegacyMistake, hook: string, ch?: [string, string], vis?: LegacyVisual): SceneInit[] {
  const model = vis?.m ?? b.vis?.m;
  const effectiveModel = model && model !== 'off' ? model : inferVisualFromEntry(b);
  const effectiveParams = vis ?? (b.vis && Object.keys(b.vis).length > 1 ? b.vis : effectiveModel !== 'none' ? inferParamsForMistake(b, effectiveModel) : undefined);
  const hasModel = effectiveModel !== 'none';
  const out: SceneInit[] = [
    {
      title: 'الخطاف',
      body: hook,
      kind: 'hook',
      phase: 'Hook',
      ...(hasModel ? { model: effectiveModel, params: effectiveParams, stage: 'predict' as const } : {}),
      expression: b.mistake,
    },
    {
      title: 'إجابة التلميذ',
      body: `${b.mistake}\n${b.cause || 'فخ شائع يقع فيه الكثير من التلاميذ في البكالوريا'}`,
      kind: 'explain',
      phase: 'Diagnosis',
      ...(hasModel ? { model: effectiveModel, params: effectiveParams, stage: 'observe' as const } : {}),
      expression: b.mistake,
    },
    {
      title: 'السبب الحقيقي',
      body: b.cause,
      kind: 'explain',
      phase: 'Cause',
      ...(hasModel ? { model: effectiveModel, params: effectiveParams, stage: 'move' as const } : {}),
      expression: b.expr || b.mistake,
    },
    {
      title: 'التصحيح',
      body: b.fix,
      kind: 'rule',
      phase: 'Solution',
      ...(hasModel ? { model: effectiveModel, params: effectiveParams, stage: 'general' as const } : {}),
      expression: b.fix,
    },
  ];
  if (ch) {
    const chParams = hasModel ? parseChallengeParams(ch[0], effectiveModel) : undefined;
    out.push({
      title: 'تحدّي',
      body: ch[0],
      kind: 'explain',
      phase: 'Challenge',
      ...(hasModel ? { model: effectiveModel, params: chParams ?? effectiveParams, stage: 'predict' as const } : {}),
    });
    out.push({
      title: 'الجواب',
      body: ch[1],
      kind: 'rule',
      phase: 'Challenge',
      ...(hasModel ? { model: effectiveModel, params: chParams ?? effectiveParams, stage: 'general' as const } : {}),
    });
  }
  out.push({ title: 'الدعوة للعمل', body: CTA, kind: 'cta', phase: 'End card' });
  return out;
}

export function legacyToProject(entry: LegacyEntry): StudioProject | null {
  const n = Number(entry.id.split('-').pop());
  switch (entry.source) {
    case 'mistake': {
      const b = MISTAKES[n];
      if (!b) return null;
      return projectFrom(entry, buildScenes(mistakeScenes(b, entry.hook)), { mistake: b.mistake, expression: b.expr, remediation: b.fix });
    }
    case 'ready': {
      const r = READY[n];
      const b = r && readyBase(r);
      if (!r || !b) return null;
      return projectFrom(entry, buildScenes(mistakeScenes(b, r.hook, r.ch, r.vis)), { mistake: b.mistake, expression: b.expr, remediation: b.fix });
    }
    case 'intuition': {
      const x = INTUITION[n];
      if (!x) return null;
      const say = x.say ?? {};
      const chParams = x.m ? parseChallengeParams(x.ch?.[0] ?? '', x.m) : undefined;
      const inits: SceneInit[] = [
        { title: 'الخطاف', body: x.hook, kind: 'hook', phase: 'Hook', model: x.m, params: x.r1, stage: 'predict', ...(say['p'] ? { narration: say['p'] } : {}) },
        { title: 'خمّن', body: x.hook, kind: 'explain', phase: 'Predict', model: x.r1?.m ?? x.m, params: x.r1, stage: 'predict', legacy: { reps: x.r1 }, ...(say['p'] ? { narration: say['p'] } : {}) },
        { title: 'حرّك وشوف', body: x.rule, kind: 'explain', phase: 'Intuition', model: x.m, params: x.r1, stage: 'move', ...(say['m'] ? { narration: say['m'] } : {}) },
        { title: 'لاحظ', body: x.rule, kind: 'explain', phase: 'Observe', model: x.m, params: x.r1, stage: 'observe', ...(say['o'] ? { narration: say['o'] } : {}) },
      ];
      if (x.r2) inits.push({ title: 'المستوى الثاني', body: x.rule, kind: 'explain', phase: 'Predict', model: x.r2.m, params: x.r2, stage: 'predict', legacy: { reps: x.r2 }, ...(say['p2'] ? { narration: say['p2'] } : {}) });
      inits.push({ title: 'القاعدة', body: x.rule, kind: 'rule', phase: 'Solution', model: x.m, params: x.r2 ?? x.r1, stage: 'general', ...(say['g'] ? { narration: say['g'] } : {}) });
      if (x.ch) {
        inits.push(
          { title: 'تحدّي', body: x.ch[0], kind: 'explain', phase: 'Challenge', model: x.m, params: chParams ?? x.r2 ?? x.r1, stage: 'predict' },
          { title: 'الجواب', body: x.ch[1], kind: 'rule', phase: 'Challenge', model: x.m, params: chParams ?? x.r2 ?? x.r1, stage: 'general' }
        );
      }
      inits.push({ title: 'الدعوة للعمل', body: CTA, kind: 'cta', phase: 'End card' });
      return projectFrom(entry, buildScenes(inits), { remediation: x.rule });
    }
    case 'solve': {
      const x = SOLVE[n];
      if (!x) return null;
      const answer = Array.isArray(x.answer) ? x.answer.join('\n') : x.answer ?? '';
      const inits: SceneInit[] = [
        { title: 'الخطاف', body: x.hook, kind: 'hook', phase: 'Hook', model: x.ty },
        { title: 'نص التمرين', body: [x.stmt, x.ask].filter(Boolean).join('\n'), kind: 'explain', phase: 'Statement', model: x.ty, ...(x.say0 ? { narration: x.say0 } : {}) },
        ...x.steps.map((s): SceneInit => ({
          title: s.title, body: s.lines.join('\n'), kind: 'explain', phase: 'Step', narration: s.say, model: x.ty,
          legacy: { solveDiagram: s.d ?? null, solveType: x.ty },
        })),
      ];
      if (answer) inits.push({ title: 'الجواب النهائي', body: answer, kind: 'rule', phase: 'Solution', model: x.ty, ...(x.sayEnd ? { narration: x.sayEnd } : {}) });
      if (x.ch) inits.push(
        { title: 'تحدّي', body: [x.chAsk, x.ch[0]].filter(Boolean).join('\n'), kind: 'explain', phase: 'Challenge', model: x.ty },
        { title: 'الجواب', body: x.ch[1], kind: 'rule', phase: 'Challenge', model: x.ty }
      );
      inits.push({ title: 'الدعوة للعمل', body: CTA, kind: 'cta', phase: 'End card' });
      return projectFrom(entry, buildScenes(inits), { remediation: answer });
    }
  }
}
