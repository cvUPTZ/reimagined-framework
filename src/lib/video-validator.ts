import { evaluateMathExpression, extractPlottableExpression } from './math-engine';
import { prettifyMath, stripEmoji } from './math-text';
import { hasLegacyRenderer } from './legacy-visuals';
import type { Scene, StudioProject } from './studio';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  category: 'math' | 'tone' | 'visual' | 'timeline';
  message: string;
  sceneId?: string;
  sceneLabel?: string;
  details?: unknown;
}

export interface ProjectValidationReport {
  projectId: string;
  projectName: string;
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const EMOJI_REGEX = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
const AI_FILLER_REGEX = /في هذا الفيديو سن|مرحباً بكم يا أصدقائي|لا تقلق عزيزي التلميذ|دعونا نستكشف سوياً|أهلاً بكم في رحلة/i;
const UNFORMATTED_CODE_MATH = /\bconj\s*\(|\bsqrt\s*\(|<=|>=|!=|\binfinity\b/i;

/** Topic keyword rules to determine allowed visual models */
const TOPIC_VISUAL_RULES: Array<{
  pattern: RegExp;
  category: string;
  allowedVisuals: string[];
  disallowedVisuals: string[];
  recommendedLegacy?: string;
}> = [
  {
    pattern: /احتمال|متغير عشوائي|أمل رياضياتي|تباين|نرد|سحب كرات|شجرة الاحتمالات/i,
    category: 'probability',
    allowedVisuals: ['none', 'venn'],
    disallowedVisuals: ['number-line', 'curve', 'tangent', 'wave', 'integral'],
  },
  {
    pattern: /هندسة فضائية|فضاء ثلاثي|مستوي في الفضاء|شعاع ناظمي|معادلة ديكارتية للمستوي/i,
    category: 'space-geometry',
    allowedVisuals: ['none'],
    disallowedVisuals: ['curve', 'tangent', 'number-line', 'wave', 'integral'],
  },
  {
    pattern: /مركب|مركبة|عمدة|طويلة|مرافق|الشكل الأسي|أويلر|دستور موافر/i,
    category: 'complex-numbers',
    allowedVisuals: ['none'],
    disallowedVisuals: ['wave', 'number-line'],
    recommendedLegacy: 'cplx',
  },
  {
    pattern: /تكامل|ريمان|مساحة محصورة|أصلية|دالة أصلية/i,
    category: 'integrals',
    allowedVisuals: ['integral', 'curve', 'none'],
    disallowedVisuals: ['number-line', 'wave'],
  },
  {
    pattern: /مشتق|اشتقاق|مماس|معامل توجيه|ميل المماس|تقريب خطي|انعطاف/i,
    category: 'derivatives',
    allowedVisuals: ['tangent', 'curve', 'none'],
    disallowedVisuals: ['number-line', 'wave', 'integral'],
  },
  {
    pattern: /موجة|موجات|دوران|جيبي|دورية|مثلثية|الدائرة المثلثية|\bsin\b|\bcos\b/i,
    category: 'periodic-waves',
    allowedVisuals: ['wave', 'curve', 'none'],
    disallowedVisuals: ['number-line', 'integral'],
  },
  {
    pattern: /أولوية العمليات|أقواس|ضرب قبل الجمع|حساب جبري|أعداد نسبية/i,
    category: 'arithmetic',
    allowedVisuals: ['number-line', 'none'],
    disallowedVisuals: ['wave', 'tangent', 'integral'],
  },
];

/** Validates math expression display, domain plottability, and formatting */
export function validateMath(expression: string, visual: Scene['visual']): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!expression || !expression.trim()) return issues;

  const trimmed = expression.trim();

  // Check for raw unformatted ASCII tokens
  if (UNFORMATTED_CODE_MATH.test(trimmed)) {
    issues.push({
      severity: 'error',
      category: 'math',
      message: `Math expression contains raw unformatted ASCII code: "${trimmed}"`,
    });
  }

  // If the visual requires plotting (curve, tangent, exponential, integral)
  if (visual && ['curve', 'tangent', 'exponential', 'integral'].includes(visual)) {
    const plottable = extractPlottableExpression(trimmed);
    const testValues = [-1, 0.5, 1, 2];
    let finiteCount = 0;

    for (const x of testValues) {
      const res = evaluateMathExpression(plottable, x);
      if (!res.error && Number.isFinite(res.value)) {
        finiteCount++;
      }
    }

    if (finiteCount === 0) {
      issues.push({
        severity: 'warning',
        category: 'math',
        message: `Expression "${trimmed}" (plottable as "${plottable}") yielded no finite evaluation points in standard range`,
      });
    }
  }

  return issues;
}

/** Validates editorial tone, absence of emojis, and clean pedagogical phrasing */
export function validateTone(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!text) return issues;

  if (EMOJI_REGEX.test(text)) {
    const matches = text.match(EMOJI_REGEX) || [];
    issues.push({
      severity: 'error',
      category: 'tone',
      message: `Contains decorative emoji(s): ${matches.join(' ')}`,
      details: matches,
    });
  }

  if (AI_FILLER_REGEX.test(text)) {
    issues.push({
      severity: 'warning',
      category: 'tone',
      message: `Contains conversational AI filler phrase: "${text.slice(0, 40)}..."`,
    });
  }

  return issues;
}

/** Validates whether a scene's visual model matches its topic and category */
export function validateTopicVisualMatch(
  topicContext: string,
  visual: Scene['visual'] = 'none',
  legacyModel?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const text = topicContext.toLowerCase();

  for (const rule of TOPIC_VISUAL_RULES) {
    if (rule.pattern.test(text)) {
      // If a legacy renderer is actively used, check legacy compatibility
      if (legacyModel && hasLegacyRenderer(legacyModel)) {
        if (rule.recommendedLegacy && legacyModel !== rule.recommendedLegacy) {
          issues.push({
            severity: 'warning',
            category: 'visual',
            message: `Topic in ${rule.category} using legacy model "${legacyModel}" (recommended: "${rule.recommendedLegacy}")`,
          });
        }
        continue;
      }

      // Check standard visual
      if (rule.disallowedVisuals.includes(visual)) {
        issues.push({
          severity: 'error',
          category: 'visual',
          message: `Mismatched visual "${visual}" for ${rule.category} topic. Disallowed models: ${rule.disallowedVisuals.join(', ')}.`,
        });
      }
    }
  }

  return issues;
}

/** Validates scene timing and animation appropriateness */
export function validateSceneTiming(scene: Scene, index: number, total: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (scene.duration < 1.5 || scene.duration > 25) {
    issues.push({
      severity: 'error',
      category: 'timeline',
      message: `Scene duration ${scene.duration}s is out of recommended range [1.5s, 25s]`,
    });
  }

  // Hook scene animation check
  if (index === 0 && (scene.kind === 'hook' || scene.phase === 'Hook')) {
    if (scene.animation === 'Zoom in') {
      issues.push({
        severity: 'warning',
        category: 'timeline',
        message: 'Hook scene should use "Draw in" or "Fade", not "Zoom in"',
      });
    }
  }

  // End card animation check
  if (index === total - 1 && (scene.kind === 'cta' || scene.phase === 'End card')) {
    if (scene.animation === 'Draw in') {
      issues.push({
        severity: 'warning',
        category: 'timeline',
        message: 'CTA end card scene should use "Zoom in" or "Fade", not "Draw in"',
      });
    }
  }

  return issues;
}

/** Full comprehensive project audit */
export function validateProjectHealth(project: StudioProject): ProjectValidationReport {
  const issues: ValidationIssue[] = [];
  const projectTopicContext = `${project.name} ${project.topic} ${project.mistake} ${project.remediation} ${project.expression}`;

  // Check top-level project fields for tone & emoji
  const projectTone = validateTone(projectTopicContext);
  issues.push(...projectTone);

  project.scenes.forEach((scene, index) => {
    const sceneLabel = scene.label || String(index + 1).padStart(2, '0');
    const sceneContext = `${projectTopicContext} ${scene.title} ${scene.body} ${scene.narration ?? ''}`;
    const legacyModel = typeof scene.legacy?.['visualModel'] === 'string' ? (scene.legacy['visualModel'] as string) : undefined;

    // 1. Math check
    const mathIssues = validateMath(scene.expression || project.expression || '', scene.visual);
    mathIssues.forEach(i => issues.push({ ...i, sceneId: scene.id, sceneLabel }));

    // 2. Tone & Emoji check
    const sceneTone = validateTone(`${scene.title} ${scene.body} ${scene.narration ?? ''}`);
    sceneTone.forEach(i => issues.push({ ...i, sceneId: scene.id, sceneLabel }));

    // 3. Visual-Topic Alignment check
    const localSceneContext = `${scene.title} ${scene.body} ${scene.expression ?? ''} ${scene.narration ?? ''}`;
    const contextToValidate = TOPIC_VISUAL_RULES.some(r => r.pattern.test(localSceneContext))
      ? localSceneContext
      : projectTopicContext;
    const visualIssues = validateTopicVisualMatch(contextToValidate, scene.visual, legacyModel);
    visualIssues.forEach(i => issues.push({ ...i, sceneId: scene.id, sceneLabel }));

    // 4. Timing & Animation check
    const timingIssues = validateSceneTiming(scene, index, project.scenes.length);
    timingIssues.forEach(i => issues.push({ ...i, sceneId: scene.id, sceneLabel }));
  });

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return {
    projectId: project.id,
    projectName: project.name,
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
