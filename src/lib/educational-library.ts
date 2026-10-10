import { makeId, type Scene, type StudioProject } from './studio';
import type { MathVisualModel } from './math-engine';

export interface EducationalLesson {
  id: string;
  level: string; // e.g. 'BAC 2026', '2AS', '1AS', '4AM'
  category: 'analysis' | 'algebra' | 'functions' | 'arithmetic' | 'calculus';
  categoryLabel: string;
  topic: string;
  title: string;
  summary: string;
  expression: string;
  mistake: string;
  diagnostic: string;
  remediation: string;
  cta: string;
  visualModel: MathVisualModel;
  storyArc: {
    hook: string;
    problem: string;
    diagnosis: string;
    rule: string;
    summary: string;
    cta: string;
  };
}

export const educationalLessons: EducationalLesson[] = [
  {
    id: 'lesson-order-of-operations',
    level: '1AS / 4AM',
    category: 'arithmetic',
    categoryLabel: 'الحساب الجبري',
    topic: 'أولوية العمليات',
    title: 'أولوية العمليات: الأقواس أولاً',
    summary: 'تجنب الخلط بين الضرب والأقواس في العمليات المتتالية.',
    expression: '(3 + 2) × 4',
    mistake: 'نحسب الضرب قبل الأقواس: 3 + (2 × 4) = 11',
    diagnostic: 'الخلط الشائع بين أولوية الضرب الداخلية والخارجية للأقواس.',
    remediation: 'الأقواس كتلة واحدة مستقلة تُحسب أولاً: 5 × 4 = 20.',
    cta: 'جرّب التحدي الحسابي القادم مع QED',
    visualModel: 'number-line',
    storyArc: {
      hook: 'خطأ صغير في الترتيب\nيضيّع نقطة الامتحان كاملة!',
      problem: '(3 + 2) × 4\nالنتيجة ليست 11!',
      diagnosis: 'توقّف هنا!\nالأقواس تسبق أي عملية ضرب.',
      rule: 'احسب ما داخل القوس أولاً:\n(3 + 2) = 5\nثم 5 × 4 = 20',
      summary: 'القوس كتلة مقفلة\nلا تفكها قبل حسابها.',
      cta: 'اختبر فهمك مع المسألة التالية!',
    },
  },
  {
    id: 'lesson-derivative-tangent',
    level: 'BAC 2026',
    category: 'calculus',
    categoryLabel: 'التحليل والاشتقاق',
    topic: 'معادلة المماس والاشتقاق',
    title: 'المماس كتقريب خطي للدالة',
    summary: 'فهم المعنى الهندسي لمعامل توجيه المماس f\'(x₀).',
    expression: "f(x) = x² → f'(1) = 2",
    mistake: 'اعتبار المماس خطاً يقطع المنحنى في نقطتين بدلاً من ملامسته محلياً.',
    diagnostic: 'عدم الربط بين المشتقة الهندسية وميل المماس اللحظي.',
    remediation: 'معادلة المماس عند x₀ هي: y = f\'(x₀)(x - x₀) + f(x₀).',
    cta: 'طبّق معادلة المماس على دوال أخرى الآن',
    visualModel: 'tangent',
    storyArc: {
      hook: 'ما هو المماس حقيقةً؟\nولماذا نحسب العدد المشتق؟',
      problem: 'y = f(x)\nكيف نعرف اتجاه الحركة عند نقطة واحدة؟',
      diagnosis: 'ميل القاطع يقترب من المماس\nعندما تؤول المسافة إلى الصفر.',
      rule: "العدد المشتق f'(x₀)\nهو ميل المماس الدقيق عند النقطة.",
      summary: 'معادلة المماس:\ny = f\'(x₀)(x - x₀) + f(x₀)',
      cta: 'تدرب على كتابة معادلة المماس في ثوانٍ!',
    },
  },
  {
    id: 'lesson-exponential-growth',
    level: 'BAC 2026',
    category: 'functions',
    categoryLabel: 'الدوال الأسية',
    topic: 'الدالة الأسية وتزايدها المقارن',
    title: 'سلوك الدالة الأسية exp(x)',
    summary: 'فهم خواص الدالة الأسية: موجبة دوماً وتتزايد أسرع من أي كثير حدود.',
    expression: 'lim (e^x / x) = +∞',
    mistake: 'الاعتقاد بأن e^x يمكن أن تنعدم أو تأخذ قيماً سالبة.',
    diagnostic: 'نسيان أن مجال صور الدالة الأسية هو ]0, +∞[ فقط.',
    remediation: 'الدالة الأسية موجبة تماماً: e^x > 0 لجميع الأعداد الحقيقية x.',
    cta: 'اكتشف نهايات التزايد المقارن في تمارين البكالوريا',
    visualModel: 'exponential',
    storyArc: {
      hook: 'الدالة التي لا تقبل الصفر\nولا تهزمها أي قوة!',
      problem: 'e^x = 0 ؟\nمستحيل! لماذا يقع الكثير في هذا الفخ؟',
      diagnosis: 'منحنى الدالة الأسية\nيعلو دائماً محور الفواصل.',
      rule: 'لكل x حقيقي:\ne^x > 0 دائماً ومشتقتها هي نفسها!',
      summary: 'التزايد المقارن:\nالأسية تغلب قوى x عند +∞ دائماً.',
      cta: 'احفظ هذه القاعدة الذهبية للبكالوريا!',
    },
  },
  {
    id: 'lesson-definite-integral',
    level: 'BAC 2026',
    category: 'analysis',
    categoryLabel: 'الحساب التكاملي',
    topic: 'التكامل وحساب المساحات',
    title: 'المساحة تحت المنحنى والتكامل',
    summary: 'الربط الهندسي بين الدالة الأصلية والمساحة المحصورة تحت المنحنى.',
    expression: '∫[a,b] f(x) dx = F(b) - F(a)',
    mistake: 'حساب التكامل كأنه جمع بسيط دون مراعاة إشارة الدالة فوق أو تحت المحور.',
    diagnostic: 'الخلط بين التكامل الجبري والمساحة الهندسية الموجبة دائماً.',
    remediation: 'إذا كانت f موجبة، فالتكامل يمثل المساحة بدقة: A = ∫ f(x) dx.',
    cta: 'احسب المساحة بين منحنيين في خطوة واحدة',
    visualModel: 'integral',
    storyArc: {
      hook: 'كيف نحسب مساحة شكل منحني\nبدون مسطرة أو فرجار؟',
      problem: 'تقسيم المساحة إلى مستطيلات صغيرة\nيعطي تقريباً فقط!',
      diagnosis: 'عندما يؤول عدد المستطيلات إلى المالانهاية:\nيولد التكامل المحدد.',
      rule: 'مبرهنة الحساب التكاملي:\nالمساحة = F(b) - F(a) بدقة متناهية.',
      summary: 'التكامل هو تجميع لانهائي\nلمساحات شرائح متناهية الصغر.',
      cta: 'جرّب تمرين المساحات المتقدم الآن!',
    },
  },
  {
    id: 'lesson-sine-wave',
    level: '2AS / BAC',
    category: 'functions',
    categoryLabel: 'الدوال المثلثية',
    topic: 'الدوال الدورية وموجة الجيب',
    title: 'الدور والسعة في الدالة sin(x)',
    summary: 'فهم الحركة الدورية والتذبذب بين -1 و +1.',
    expression: '-1 ≤ sin(x) ≤ 1',
    mistake: 'نسيان أن حلول المعادلات المثلثية دورية ولها دور 2π.',
    diagnostic: 'إهمال دور الدالة عند حل المتراجحات المثلثية.',
    remediation: 'دالة الجيب دورية دورها T = 2π ومحصورة بين [-1, 1].',
    cta: 'تعلم استخراج الحلول على الدائرة المثلثية',
    visualModel: 'wave',
    storyArc: {
      hook: 'نبض الرياضيات في الطبيعة:\nموجة تتكرر إلى ما لا نهاية!',
      problem: 'sin(x) = 2 ؟\nمعادلة مستحيلة الحل، فما السبب؟',
      diagnosis: 'مدى دالة الجيب محصور بدقة\nبين قمتين: -1 و +1.',
      rule: 'دالة الجيب دورية:\nsin(x + 2kπ) = sin(x)\nوقيمتها لا تتعدى المجال [-1, 1].',
      summary: 'كل حركة اهتزازية في الكون\nتخضع لدالة الجيب وجيب التمام.',
      cta: 'شاهد تحول الدائرة المثلثية إلى موجة!',
    },
  },
];

export function searchEducationalLessons(query = '', levelFilter = ''): EducationalLesson[] {
  const q = query.trim().toLowerCase();
  return educationalLessons.filter(lesson => {
    const matchesLevel = !levelFilter || levelFilter === 'all' || lesson.level.includes(levelFilter);
    const matchesQuery = !q ||
      lesson.title.toLowerCase().includes(q) ||
      lesson.topic.toLowerCase().includes(q) ||
      lesson.summary.toLowerCase().includes(q) ||
      lesson.expression.toLowerCase().includes(q) ||
      lesson.mistake.toLowerCase().includes(q);
    return matchesLevel && matchesQuery;
  });
}

export function lessonToStudioProject(lesson: EducationalLesson): StudioProject {
  const scenes: Scene[] = [
    {
      id: makeId(),
      title: 'الخطاف',
      label: '01',
      body: lesson.storyArc.hook,
      duration: 3.5,
      kind: 'hook',
      phase: 'Hook',
      animation: 'Fade',
      visual: lesson.visualModel,
      expression: lesson.expression,
      fontSize: 40,
    },
    {
      id: makeId(),
      title: 'المشكلة والخطأ',
      label: '02',
      body: lesson.storyArc.problem,
      duration: 4.5,
      kind: 'explain',
      phase: 'Diagnosis',
      animation: 'Slide up',
      visual: lesson.visualModel,
      expression: lesson.expression,
      fontSize: 40,
    },
    {
      id: makeId(),
      title: 'التشخيص والفهم',
      label: '03',
      body: lesson.storyArc.diagnosis,
      duration: 4.5,
      kind: 'explain',
      phase: 'Intuition',
      animation: 'Draw in',
      visual: lesson.visualModel,
      expression: lesson.expression,
      fontSize: 40,
    },
    {
      id: makeId(),
      title: 'القاعدة والحل',
      label: '04',
      body: lesson.storyArc.rule,
      duration: 5.0,
      kind: 'rule',
      phase: 'Solution',
      animation: 'Slide left',
      visual: lesson.visualModel,
      expression: lesson.expression,
      fontSize: 38,
    },
    {
      id: makeId(),
      title: 'الخلاصة',
      label: '05',
      body: lesson.storyArc.summary,
      duration: 3.5,
      kind: 'rule',
      phase: 'Intuition',
      animation: 'Fade',
      visual: lesson.visualModel,
      expression: lesson.expression,
      fontSize: 40,
    },
    {
      id: makeId(),
      title: 'الدعوة للعمل',
      label: '06',
      body: lesson.storyArc.cta,
      duration: 3.5,
      kind: 'cta',
      phase: 'End card',
      animation: 'Zoom in',
      visual: 'none',
      expression: lesson.expression,
      fontSize: 42,
    },
  ];

  return {
    id: `project-${lesson.id}-${makeId()}`,
    name: lesson.topic,
    format: 'portrait',
    topic: lesson.topic,
    level: lesson.level,
    mistake: lesson.mistake,
    expression: lesson.expression,
    remediation: lesson.remediation,
    cta: lesson.cta,
    scenes,
  };
}
