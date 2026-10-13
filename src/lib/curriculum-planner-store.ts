import { listLegacy, type LegacyEntry, type LegacySource, legacyToProject } from './legacy-library';
import { type StudioProject, makeId } from './studio';

export type CurriculumLevel = '4AM' | '3AS';
export type VideoPlanStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export interface ChapterConcept {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface CurriculumChapter {
  id: string;
  name: string;
  level: CurriculumLevel;
  order: number;
  concepts: ChapterConcept[];
  targetVideos?: number;
}

export interface ProductionFormatInfo {
  source: LegacySource;
  label: string;
  badge: string;
  icon: string;
  description: string;
  pedagogicalRole: string;
  targetPerChapter: number;
}

export const PRODUCTION_FORMATS: ProductionFormatInfo[] = [
  {
    source: 'intuition',
    label: 'فيديو بناء الحدس البصري',
    badge: 'حدس بصري',
    icon: '💡',
    description: 'فهم عميق وتفاعلي للبديهية الهندسية',
    pedagogicalRole: 'بناء الصورة الذهنية والتفسير الهندسي للـ "لماذا؟" قبل الخوض في القوانين والحساب الجبري.',
    targetPerChapter: 1,
  },
  {
    source: 'mistake',
    label: 'فيديو تشخيص الأخطاء والفخاخ',
    badge: 'أخطاء شائعة',
    icon: '🩹',
    description: 'كشف الفخاخ القاتلة في الامتحانات الرسمية',
    pedagogicalRole: 'تحصين التلميذ ضد أكثر الأخطاء تكراراً في BEM/BAC وتفكيك الإجابات الخاطئة مع الدليل المقنع.',
    targetPerChapter: 2,
  },
  {
    source: 'ready',
    label: 'كبسولة سريعة / تحدي Shorts',
    badge: 'تحدي سريع',
    icon: '🎬',
    description: 'فيديو مركز وجذاب من 30-45 ثانية',
    pedagogicalRole: 'جذب الانتباه عبر خطاف صادم (Hook) ثم طرح تحدٍ تفاعلي يُثبّت القاعدة بأسلوب المنصات السريعة.',
    targetPerChapter: 2,
  },
  {
    source: 'solve',
    label: 'تمرين منهجي محلول بالتفصيل',
    badge: 'تمرين منهجي',
    icon: '📝',
    description: 'حل نموذجي مفصل ومطابق لسلم التنقيط',
    pedagogicalRole: 'تدريب التلميذ على المنهجية الصارمة وكتابة خطوات البرهان والحل كما يُطلب تماماً في التصحيح الرسمي.',
    targetPerChapter: 1,
  },
];

export interface ScheduledPlanItem {
  id: string;
  entryId: string;
  level: CurriculumLevel;
  date: string; // YYYY-MM-DD
  status: VideoPlanStatus;
  note?: string;
}

export interface PlanConfig {
  perDay: number;
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  weeks: number;
  startDate?: string;
}

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  perDay: 1,
  days: [6, 1, 3], // Saturday, Monday, Wednesday (Algerian academic cadence)
  weeks: 4,
};

export const CURRICULUM_CHAPTERS: Record<CurriculumLevel, CurriculumChapter[]> = {
  '4AM': [
    {
      id: '4am-ch1',
      name: 'القسمة والقاسم المشترك الأكبر (PGCD)',
      level: '4AM',
      order: 1,
      targetVideos: 6,
      concepts: [
        { id: '4am-c1-1', name: 'قواسم عدد طبيعي وقابلية القسمة', description: 'مفهوم القاسم، وبواقي القسمة الإقليدية', keywords: ['قاسم', 'قواسم', 'قابلية القسمة', 'قسمة'] },
        { id: '4am-c1-2', name: 'خوارزمية إقليدس لحساب PGCD', description: 'القسمات المتتالية وتفسيرها بتقسيم المستطيلات الهندسية', keywords: ['إقليدس', 'خوارزمية', 'pgcd', 'قاسم مشترك أكبر'] },
        { id: '4am-c1-3', name: 'العددان الأوليان فيما بينهما', description: 'تعريف أوليان فيما بينهما وشرط PGCD = 1', keywords: ['أوليان', 'أولية', 'فيما بينهما'] },
        { id: '4am-c1-4', name: 'اختزال الكسور إلى كسر غير قابل للاختزال', description: 'قسمة حدي الكسر على القاسم المشترك الأكبر', keywords: ['اختزال', 'غير قابل للاختزال', 'كسر'] },
        { id: '4am-c1-5', name: 'وضعيات إدماجية ومسائل واقعية لـ PGCD', description: 'مسائل تقسيم المساحات، التبليط، وتوزيع الأدوات بالتساوي', keywords: ['مسألة', 'وضعية', 'بلاط', 'تقسيم'] },
      ],
    },
    {
      id: '4am-ch2',
      name: 'الحساب على الجذور التربيعية',
      level: '4AM',
      order: 2,
      targetVideos: 6,
      concepts: [
        { id: '4am-c2-1', name: 'مفهوم الجذر والمربعات التامة', description: 'العلاقة العكسية بين التربيع والجذر ومربعات الأعداد', keywords: ['مربع عدد', 'مربعات', 'جذر عدد', '√'] },
        { id: '4am-c2-2', name: 'جداء وقسمة الجذور التربيعية', description: 'قواعد الضرب والقسمة والتحذير القاطع من جمع الجذور', keywords: ['جداء', 'ضرب الجذور', 'قسمة جذرين'] },
        { id: '4am-c2-3', name: 'التبسيط والكتابة على شكل a√b', description: 'تفكيك الجذور لأصغر عدد طبيعي تحت الجذر', keywords: ['تبسيط', 'كتابة على شكل', 'جذور'] },
        { id: '4am-c2-4', name: 'جعل مقام نسبة عدداً ناطقاً', description: 'ضرب البسط والمقام في الجذر المناسب للتخلص من الجذر بالمقام', keywords: ['مقام نسبة', 'عدد ناطق', 'حذف الجذر'] },
        { id: '4am-c2-5', name: 'حل المعادلات من الشكل x² = a', description: 'المناقشة الرياضية حسب إشارة a (حلان، حل معدوم، أو مستحيلة)', keywords: ['x²', 'معادلة x²', 'مربع'] },
      ],
    },
    {
      id: '4am-ch3',
      name: 'الحساب الحرفي والمتطابقات الشهيرة',
      level: '4AM',
      order: 3,
      targetVideos: 6,
      concepts: [
        { id: '4am-c3-1', name: 'النشر وتوزيع الضرب والإشارات', description: 'خاصية التوزيع وقواعد ضرب الإشارات السالبة والموجبة', keywords: ['نشر', 'توزيع', 'إشارة', 'أقواس'] },
        { id: '4am-c3-2', name: 'المتطابقات الشهيرة الثلاث', description: 'مربع مجموع ومربع فرق وجداء مجموع حدين وفرقهما هندسياً', keywords: ['متطابق', 'مربع مجموع', 'مربع فرق', 'جداء مجموعين'] },
        { id: '4am-c3-3', name: 'التحليل بإخراج العامل المشترك', description: 'استخراج العامل المشترك العددي والحرفي والمركب', keywords: ['عامل مشترك', 'تحليل عبارة', 'عامل'] },
        { id: '4am-c3-4', name: 'التحليل بالمتطابقات الشهيرة', description: 'التعرف على شكل المتطابقة وتفكيكها إلى جداء عاملين', keywords: ['فرق مربعين', 'تحليل متطابقة'] },
        { id: '4am-c3-5', name: 'معادلة جداء معدوم A(x) × B(x) = 0', description: 'إما الطرف الأول يساوي صفراً أو الثاني يساوي صفراً', keywords: ['جداء معدوم', 'a×b=0', 'حل معادلة'] },
      ],
    },
    {
      id: '4am-ch4',
      name: 'المعادلات والمتراجحات من الدرجة الأولى',
      level: '4AM',
      order: 4,
      targetVideos: 5,
      concepts: [
        { id: '4am-c4-1', name: 'حل معادلة من الدرجة الأولى بمجهول واحد', description: 'نموذج كفتي الميزان وعزل المجهول x', keywords: ['معادلة', 'مجهول', 'ميزان', 'حل'] },
        { id: '4am-c4-2', name: 'حل متراجحة وقاعدة القلب عند الضرب بسالب', description: 'تغيير اتجاه المتراجحة عند القسمة أو الضرب في عدد سالب', keywords: ['متراجحة', 'قسمة على سالب', 'أصغر', 'أكبر'] },
        { id: '4am-c4-3', name: 'التمثيل البياني لمجموعات الحلول', description: 'تعيين مجالات الحلول على مستقيم مدرج وتشطيب القيم المرفوضة', keywords: ['تمثيل بياني', 'مستقيم مدرج', 'حلول متراجحة', 'مجال'] },
        { id: '4am-c4-4', name: 'ترييض مشكل وصياغة الحل الواقعي', description: 'ترجمة النص إلى معادلة أو متراجحة والتحقق من واقعية النتيجة', keywords: ['ترييض', 'مشكل', 'مسألة'] },
      ],
    },
    {
      id: '4am-ch5',
      name: 'الهندسة المستوية (طالس وفيثاغورس وحساب المثلثات)',
      level: '4AM',
      order: 5,
      targetVideos: 7,
      concepts: [
        { id: '4am-c5-1', name: 'خاصية طالس وحساب الأطوال', description: 'تناسب الأطوال في المثلث بوجود مستقيمين متوازيين', keywords: ['طالس', 'توازي', 'أطوال', 'نسب'] },
        { id: '4am-c5-2', name: 'الخاصية العكسية لطالس لإثبات التوازي', description: 'ترتيب النقط وتساوي النسب لإثبات توازي المستقيمات', keywords: ['عكسية طالس', 'إثبات توازي'] },
        { id: '4am-c5-3', name: 'مبرهنة فيثاغورس والخاصية العكسية', description: 'حساب الوتر وإثبات تعامد الأضلاع والمثلثات القائمة', keywords: ['فيثاغورس', 'وتر', 'مثلث قائم', 'قائم'] },
        { id: '4am-c5-4', name: 'حساب المثلثات (cos, sin, tan)', description: 'النسب المثلثية في المثلث القائم والعلاقات بينها', keywords: ['ظل', 'جيب', 'جيب تمام', 'cos', 'sin', 'tan'] },
        { id: '4am-c5-5', name: 'الزوايا المحيطية والزوايا المركزية', description: 'العلاقة بين الزاوية المحيطية والمركزية التي تحصر نفس القوس', keywords: ['محيطية', 'مركزية', 'قوس', 'دائرة'] },
      ],
    },
    {
      id: '4am-ch6',
      name: 'الدوال الخطية والدوال التآلفية',
      level: '4AM',
      order: 6,
      targetVideos: 5,
      concepts: [
        { id: '4am-c6-1', name: 'الدالة الخطية والتمثيل التناسبي', description: 'f(x) = ax والتمثيل البياني المستقيم المار من المبدأ', keywords: ['دالة خطية', 'تناسبية', 'ax'] },
        { id: '4am-c6-2', name: 'الدالة التآلفية ومعامل التوجيه', description: 'g(x) = ax + b وقراءة الترتيب عند المبدأ ومعامل التوجيه', keywords: ['دالة تآلفية', 'ax+b', 'معامل توجيه', 'ترتيب'] },
        { id: '4am-c6-3', name: 'التمثيل البياني واستخراج العبارة جبرياً', description: 'إيجاد معامل الدالة انطلاقاً من نقطتين أو قراءة بيانية', keywords: ['تمثيل بياني', 'صورة', 'سابقة', 'منحنى'] },
        { id: '4am-c6-4', name: 'ترييض وضعيات بدوال (التسعيرات والعروض)', description: 'المفاضلة بين عروض الاشتراك والأسعار وحساب نقطة التعادل', keywords: ['تسعيرة', 'عرض', 'اشتراك', 'مقارنة عروض'] },
      ],
    },
    {
      id: '4am-ch7',
      name: 'جمل معادلتين والإحصاء والهندسة الفضائية',
      level: '4AM',
      order: 7,
      targetVideos: 5,
      concepts: [
        { id: '4am-c7-1', name: 'حل جملة معادلتين خطيتين جبرياً', description: 'طريقة التعويض وطريقة الجمع لحساب المجهولين x و y', keywords: ['جملة معادلتين', 'تعويض', 'جمع', 'جملة'] },
        { id: '4am-c7-2', name: 'الحل البياني لجملة معادلتين', description: 'تفسير حل الجملة كنقطة تقاطع مستقيمين في معلم متعامد ومتجانس', keywords: ['تقاطع مستقيمين', 'حل بياني'] },
        { id: '4am-c7-3', name: 'الإحصاء وسلاسل القيم', description: 'التكرار المجمع، التواتر، المتوسط الحسابي المتوازن والوسيط', keywords: ['إحصاء', 'تكرار', 'تواتر', 'متوسط', 'وسيط'] },
        { id: '4am-c7-4', name: 'المجسمات الفضائية والمقاطع المستوية', description: 'حساب حجوم الأهرامات والمخاريط ومقاطع المجسمات بمستو مواز للقاعدة', keywords: ['هرم', 'مخروط', 'أسطوانة', 'حجم', 'مقطع', 'فضاء'] },
      ],
    },
  ],
  '3AS': [
    {
      id: '3as-ch1',
      name: 'الباب 1 · النهايات والاستمرارية',
      level: '3AS',
      order: 1,
      targetVideos: 8,
      concepts: [
        { id: '3as-c1-1', name: 'حساب النهايات والمستقيمات المقاربة', description: 'المستقيم المقارب الأفقي والعمودي والمائل ودراسة الوضع النسبي', keywords: ['نهاية', 'نهايات', 'مقارب', 'أفقي', 'عمودي', 'مائل'] },
        { id: '3as-c1-2', name: 'إزالة حالات عدم التعيين الأربعة', description: 'طرق الإزالة: التحليل بالاختزال، الضرب في المرافق، العامل المشترك، والعدد المشتق', keywords: ['عدم تعيين', 'إزالة', 'مرافق', 'تحليل', 'عامل مشترك'] },
        { id: '3as-c1-3', name: 'مبرهنات المقارنة والحصر', description: 'حساب النهايات عند المالانهاية بالحصر (مبرهنة الساندويتش)', keywords: ['حصر', 'مقارنة', 'ساندويتش'] },
        { id: '3as-c1-4', name: 'الاستمرارية ومبرهنة القيم المتوسطة (TVI)', description: 'إثبات وجود حلول للمعادلة f(x) = k وتعيين حصر للجذر α', keywords: ['استمرار', 'قيم متوسطة', 'f(x)=0', 'حل وحيد', 'tvi'] },
      ],
    },
    {
      id: '3as-ch2',
      name: 'الباب 2 · الاشتقاقية وتطبيقاتها',
      level: '3AS',
      order: 2,
      targetVideos: 7,
      concepts: [
        { id: '3as-c2-1', name: 'العدد المشتق وقابلية الاشتقاق', description: 'تفسير العدد المشتق هندسياً كنصف مماس، نقطة زاوية أو مماس عمودي', keywords: ['اشتقاق', 'عدد مشتق', 'نصف مماس', 'نقطة زاوية'] },
        { id: '3as-c2-2', name: 'مشتقات الدوال المألوفة والدالة المركبة', description: 'قواعد اشتقاق الجداء، الكسر، القوى، ومشتق مركب دالتين (f∘g)', keywords: ['مشتقة', 'مركبة', 'u/v', 'uv', 'chain', 'مشتق'] },
        { id: '3as-c2-3', name: 'معادلة المماس والتقريب التآلفي', description: 'y = f\'(a)(x - a) + f(a) والتقريب التآلفي بجوار نقطة', keywords: ['مماس', 'معادلة المماس', 'تقريب تآلفي', 'tangent'] },
        { id: '3as-c2-4', name: 'نقط الانعطاف وتقعر المنحنى', description: 'المشتق الثاني وتغير إشارته ومماسات تخترق المنحنى', keywords: ['تغيرات', 'انعطاف', 'تقعر', 'f\'\''] },
      ],
    },
    {
      id: '3as-ch3',
      name: 'الباب 3 · الدوال الأسية واللوغاريتمية',
      level: '3AS',
      order: 3,
      targetVideos: 8,
      concepts: [
        { id: '3as-c3-1', name: 'الدالة الأسية النيبيرية e^x وخواصها', description: 'الخواص الجبرية للأسية، حل المعادلات والمتراجحات الأسية', keywords: ['أسية', 'exp', 'e^x', 'معادلات أسية'] },
        { id: '3as-c3-2', name: 'الدالة اللوغاريتمية النيبيرية ln(x)', description: 'مجموعة التعريف، خواص الجمع والضرب، وحل المعادلات اللوغاريتمية', keywords: ['لوغاريتم', 'ln', 'معادلات لوغاريتمية', 'log'] },
        { id: '3as-c3-3', name: 'النهايات الشهيرة للأسية واللوغاريتم', description: 'نهايات التزايد المقارن الشهيرة عند الصفر والمالانهاية', keywords: ['نهايات شهيرة', 'e^x/x', 'xlnx'] },
        { id: '3as-c3-4', name: 'دراسة دالة أسية/لوغاريتمية كاملة', description: 'خطوات دراسة الدالة: النهايات، المشتق، جدول التغيرات، والمناقشة البيانية', keywords: ['دراسة دالة', 'مناقشة بيانية', 'm', 'رسم المنحنى'] },
      ],
    },
    {
      id: '3as-ch4',
      name: 'الباب 4 · التزايد المقارن',
      level: '3AS',
      order: 4,
      targetVideos: 5,
      concepts: [
        { id: '3as-c4-1', name: 'مبرهنة التزايد المقارن بين الدوال', description: 'سرعات نمو الدالة الأسية مقارنة بكثيرات الحدود واللوغاريتم', keywords: ['تزايد مقارن', 'سرعة نمو', 'أقوى', 'تزايد'] },
        { id: '3as-c4-2', name: 'تطبيقات التزايد المقارن عند المالانهاية', description: 'إزالة عدم التعيين الفورية بالاعتماد على قوة الدالة المهيمنة', keywords: ['نهاية تزايد', 'حساب نهايات'] },
        { id: '3as-c4-3', name: 'السلوك التقاربي والفروع اللانهائية', description: 'تحديد اتجاه الفروع اللانهائية والمقارب المائل', keywords: ['فروع لانهائية', 'مقارب مائل', 'وضع نسبي'] },
      ],
    },
    {
      id: '3as-ch5',
      name: 'الباب 5 و6 · الدوال الأصلية والحساب التكاملي',
      level: '3AS',
      order: 5,
      targetVideos: 7,
      concepts: [
        { id: '3as-c5-1', name: 'تعيين الدوال الأصلية وقواعدها', description: 'البحث عن الدالة الأصلية باستعمال جداول المشتقات وعلاقات u\'/u و u\'u^n', keywords: ['أصلية', 'دالة أصلية', 'ثابت'] },
        { id: '3as-c5-2', name: 'التكامل المحدد وخواصه الهندسية', description: 'تعريف التكامل بعلاقة شال، خطية التكامل، والقيمة المتوسطة', keywords: ['تكامل', 'شال', 'حساب تكاملي', 'موجب'] },
        { id: '3as-c5-3', name: 'حساب المساحات بوحدة قياس المساحة', description: 'المساحة بين منحنيين، وتحت محور الفواصل، وتفسير إشارة الدالة', keywords: ['مساحة', 'مساحات', 'حجم', 'وحدة مساحة'] },
        { id: '3as-c5-4', name: 'التكامل بالتجزئة والدوال المعرفة بتكامل', description: 'دستور التكامل بالتجزئة ∫u\'v = [uv] - ∫uv\' واشتقاق الدوال التكاملية', keywords: ['تجزئة', 'تكامل بالتجزئة', 'معرفة بتكامل'] },
      ],
    },
    {
      id: '3as-ch6',
      name: 'الباب 7 · الاحتمالات وقوانين التوزيع',
      level: '3AS',
      order: 6,
      targetVideos: 6,
      concepts: [
        { id: '3as-c6-1', name: 'نماذج العد والتحليل التوافقي', description: 'التمييز بين القوائم (مع الإرجاع والترتيب)، الترتيبات، والتوفيقات (دون ترتيب ودون إرجاع)', keywords: ['عد', 'توفيقة', 'ترتيبة', 'قائمة', 'نموذج العد'] },
        { id: '3as-c6-2', name: 'شجرة الاحتمالات والاحتمال الشرطي', description: 'دستور الاحتمال الكلي، الحوادث المستقلة، وقانون بايز', keywords: ['شرطي', 'شجرة', 'استقلال', 'احتمال كلي'] },
        { id: '3as-c6-3', name: 'المتغير العشوائي وقانونه التوزيعي', description: 'قيم المتغير X، جدول قانون الاحتمال، الأمل الرياضي E(X)، والتباين', keywords: ['متغير عشوائي', 'أمل', 'تباين', 'انحراف معياري'] },
        { id: '3as-c6-4', name: 'قانون ثنائي الحد وتجارب برنولي', description: 'تكرار التجربة n مرة باستقلال، وحساب الاحتمال بدستور ثنائي الحد', keywords: ['ثنائي الحد', 'برنولي', 'نجاح', 'فشل'] },
      ],
    },
    {
      id: '3as-ch7',
      name: 'الباب 8 · المتتاليات العددية والبرهان بالتراجع',
      level: '3AS',
      order: 7,
      targetVideos: 7,
      concepts: [
        { id: '3as-c7-1', name: 'مبدأ البرهان بالتراجع', description: 'المرحلة الابتدائية، الوراثية، والاستنتاج في متتاليات الأعداد', keywords: ['تراجع', 'برهان بالتراجع', 'وراثية'] },
        { id: '3as-c7-2', name: 'المتتاليات الحسابية والهندسية ومجاميعها', description: 'عبارة الحد العام، إثبات طبيعة المتتالية، وحساب المجاميع الشهيرة', keywords: ['حسابية', 'هندسية', 'مجموع حدود', 'أساس'] },
        { id: '3as-c7-3', name: 'اتجاه التغير والتقارب والمحدودية', description: 'حساب u_{n+1} - u_n، مبرهنة كل متتالية رتيبة ومحدودة متقاربة', keywords: ['تقارب', 'رتابة', 'محدودة', 'اتجاه تغير'] },
        { id: '3as-c7-4', name: 'المتتالية التراجعية والمخطط العنكبوتي', description: 'u_{n+1} = f(u_n) ورسم درج السلّم البياني لتخمين التقارب نحو النقطة الصامدة l = f(l)', keywords: ['تراجعية', 'عنكبوتي', 'stair', 'تمثيل بياني'] },
      ],
    },
    {
      id: '3as-ch8',
      name: 'الباب 9 و10 و11 · القسمة والموافقات والأعداد الأولية',
      level: '3AS',
      order: 8,
      targetVideos: 7,
      concepts: [
        { id: '3as-c8-1', name: 'القسمة الإقليدية في Z وقابلية القسمة', description: 'القسمة لعدد سالب وضمان شرط الباقي 0 ≤ r < |b|', keywords: ['قسمة في Z', 'قواسم في Z', 'باقي سالب'] },
        { id: '3as-c8-2', name: 'الحساب بالموافقات بترديد n والبواقي الدورية', description: 'خواص الجمع والضرب والملاءمة، ودورات قوى عدد طبيعي', keywords: ['موافقات', 'ترديد', 'بواقي دورية', 'دور'] },
        { id: '3as-c8-3', name: 'مبرهنتا بيزو وغوص والمعادلات الديفونتية', description: 'au + bv = PGCD(a,b) وحل المعادلات ax + by = c في Z²', keywords: ['بيزو', 'غوص', 'إقليدس', 'حل معادلة ديفونتية'] },
        { id: '3as-c8-4', name: 'الأعداد الأولية وأنظمة التعداد', description: 'معايير الأولية، مبرهنة فيرما الصغرى، والتحويل بين أنظمة الأساس b', keywords: ['أولية', 'تحليل لعوامل', 'تعداد', 'نظام'] },
      ],
    },
    {
      id: '3as-ch9',
      name: 'الباب 12 · الأعداد المركبة والتحويلات النقطية',
      level: '3AS',
      order: 9,
      targetVideos: 7,
      concepts: [
        { id: '3as-c9-1', name: 'الشكل الجبري، الطويلة والعمدة ومرافق عدد مركب', description: 'العمليات الحسابية في C، الطويلة |z|، العمدة arg(z)، وخصائص المرافق', keywords: ['جبري', 'طويلة', 'عمدة', 'مرافق', 'مركب'] },
        { id: '3as-c9-2', name: 'الشكل المثلثي والأسي ودستور موافر', description: 'z = r(cos θ + i sin θ) = re^{iθ} وقوى الأعداد المركبة', keywords: ['مثلثي', 'أسي', 'موافر', 'e^iθ'] },
        { id: '3as-c9-3', name: 'حل المعادلات في C ومميز دلتا', description: 'معادلات الدرجة الثانية ذات معاملات حقيقية أو مركبة والجذور التربيعية', keywords: ['معادلة في C', 'درجة ثانية', 'جذور'] },
        { id: '3as-c9-4', name: 'التفسير الهندسي وطبيعة المثلثات والرباعيات', description: 'تفسير النسبة (z_C - z_A)/(z_B - z_A) لإثبات المثلثات القائمة ومتساوية الساقين', keywords: ['مثلث متقايس', 'قائم', 'طبيعة مثلث', 'زاوية'] },
        { id: '3as-c9-5', name: 'التحويلات النقطية في المستوي المركب', description: 'الكتابة المركبة للانسحاب (z\' = z + b)، التحاكي (z\' - ω = k(z - ω))، والدوران', keywords: ['انسحاب', 'تحاك', 'دوران', 'تحويل نقطي'] },
      ],
    },
    {
      id: '3as-ch10',
      name: 'الباب 13 · التشابه المباشر في المستوي',
      level: '3AS',
      order: 10,
      targetVideos: 5,
      concepts: [
        { id: '3as-c10-1', name: 'تعريف التشابه المباشر وعناصره المميزة', description: 'المركز الصامد Ω، نسبة التكبير/التصغير k، وزاوية الدوران θ', keywords: ['تشابه مباشر', 'نسبة التشابه', 'زاوية التشابه', 'مركز'] },
        { id: '3as-c10-2', name: 'العبارة المركبة للتشابه z\' = az + b', description: 'استخراج النسبة |a|، الزاوية arg(a)، وإحداثيات المركز', keywords: ['كتابة مركبة', 'z\'=az+b', 'تشابه'] },
        { id: '3as-c10-3', name: 'التحليل القانوني للتشابه كتركيب', description: 'تفكيك التشابه إلى تركيب تحاك ودوران لهما نفس المركز وبشكل تبديلي', keywords: ['تحليل قانوني', 'تركيب', 'تحاك ودوران'] },
        { id: '3as-c10-4', name: 'الخواص الهندسية وصور الأشكال ومجموعات النقط', description: 'حفظ استقامية النقط، قياسات الزوايا الموجهة، ونسب المساحات k²', keywords: ['خواص هندسية', 'صورة شكل', 'مجموعة نقط'] },
      ],
    },
    {
      id: '3as-ch11',
      name: 'الباب 14 و15 · الجداء السلمي والهندسة في الفضاء',
      level: '3AS',
      order: 11,
      targetVideos: 6,
      concepts: [
        { id: '3as-c11-1', name: 'الجداء السلمي في الفضاء والشعاع الناظمي', description: 'العبارة التحليلية xx\' + yy\' + zz\' وشرط تعامد مستقيم ومستو', keywords: ['جداء سلمي', 'ناظمي', 'تعامد', 'فضاء'] },
        { id: '3as-c11-2', name: 'معادلة مستو والتمثيل الوسيطي لمستقيم', description: 'كتابة ax + by + cz + d = 0 وجملة المعادلات الوسيطية بدلالة t', keywords: ['معادلة مستو', 'تمثيل وسيطي', 'مستقيم في الفضاء'] },
        { id: '3as-c11-3', name: 'حساب المسافات في الفضاء ثلاثي الأبعاد', description: 'مسافة نقطة عن مستو، مسافة نقطة عن مستقيم، ونصف قطر كرة', keywords: ['مسافة نقطة', 'بعد', 'مسافة'] },
        { id: '3as-c11-4', name: 'الأوضاع النسبية وتقاطع المستقيمات والمستويات وسطح الكرة', description: 'التقاطع، التوازي، التعامد، والمستقيمان غير متحدي المستوي', keywords: ['وضع نسبي', 'تقاطع', 'سطح كرة', 'مستقيمان غير متحدي'] },
      ],
    },
  ],
};

const CHAPTER_PATTERNS: Record<string, RegExp> = {
  '4am-ch1': /قاسم|قسمة|PGCD|إقليدس/i,
  '4am-ch2': /جذور|جذر/i,
  '4am-ch3': /حرفي|متطابقات|نشر|تحليل|مربع مجموع|أعداد نسبية|كسر|تناسبية|نسبة مئوية/i,
  '4am-ch4': /معادلات|متراجحات|سالب/i,
  '4am-ch5': /طالس|فيثاغورس|مثلثات|ظل|جيب|هندسة|محيطية|تكبير|زاوية/i,
  '4am-ch6': /دوال خطية|تآلفية|دوال/i,
  '4am-ch7': /جمل|إحصاء|فضاء|مكعب|قوى/i,
  '3as-ch1': /نهايات|استمرار/i,
  '3as-ch2': /اشتقاق/i,
  '3as-ch3': /أسية|لوغاريتم/i,
  '3as-ch4': /تزايد/i,
  '3as-ch5': /تكامل|أصلية/i,
  '3as-ch6': /احتمال/i,
  '3as-ch7': /متتالي/i,
  '3as-ch8': /قسمة في Z|موافقات|أولية|قواسم/i,
  '3as-ch9': /مركبة|عمدة|طويلة/i,
  '3as-ch10': /تشابه/i,
  '3as-ch11': /فضاء|مستوي|كرة|شعاع|ناظمي|وسيطي/i,
};

export const STAGES = [
  { source: 'intuition' as const, label: 'بناء الحدس', short: 'حدس', badgeColor: 'var(--gold)' },
  { source: 'mistake' as const, label: 'تشخيص الأخطاء', short: 'أخطاء', badgeColor: 'var(--coral)' },
  { source: 'ready' as const, label: 'فيديوهات جاهزة', short: 'جاهز', badgeColor: 'var(--primary)' },
  { source: 'solve' as const, label: 'حل التمارين', short: 'تمارين', badgeColor: 'var(--blue)' },
] as const;

export function getAllCurriculumEntries(): LegacyEntry[] {
  return STAGES.flatMap(stage => listLegacy(stage.source));
}

export function matchesChapter(entry: LegacyEntry, chapter: CurriculumChapter): boolean {
  if (entry.level !== chapter.level) return false;
  const pattern = CHAPTER_PATTERNS[chapter.id];
  if (!pattern) return false;
  return pattern.test(`${entry.chapter} ${entry.topic} ${entry.hook}`);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateYMD(s: string): Date {
  const parts = s.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

export function addDaysYMD(s: string, days: number): string {
  const d = parseDateYMD(s);
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}

export const PLAN_STORAGE_KEY = 'qed_curriculum_plan_v1';

export function loadStoredPlan(): Record<string, ScheduledPlanItem> {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredPlan(plan: Record<string, ScheduledPlanItem>): void {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // browser quota limit
  }
}

/** Auto-schedule algorithm: distributes unscheduled videos over academic publishing cadence. */
export function generateAutoSchedule(
  entries: LegacyEntry[],
  existing: Record<string, ScheduledPlanItem>,
  level: CurriculumLevel,
  config: PlanConfig = DEFAULT_PLAN_CONFIG,
): Record<string, ScheduledPlanItem> {
  const levelEntries = entries.filter(e => e.level === level && !existing[e.id]);
  if (!levelEntries.length) return existing;

  const nextPlan: Record<string, ScheduledPlanItem> = { ...existing };
  const startDateStr = config.startDate || formatDateYMD(new Date());
  let current = parseDateYMD(startDateStr);
  let count = 0;
  const maxSlots = config.weeks * config.days.length * config.perDay;

  // Prioritize Intuition -> Mistake -> Ready -> Solve in round-robin fashion
  const queueBySource: Record<LegacySource, LegacyEntry[]> = {
    intuition: levelEntries.filter(e => e.source === 'intuition'),
    mistake: levelEntries.filter(e => e.source === 'mistake'),
    ready: levelEntries.filter(e => e.source === 'ready'),
    solve: levelEntries.filter(e => e.source === 'solve'),
  };

  const sequence: LegacySource[] = ['intuition', 'mistake', 'ready', 'solve'];
  const orderedList: LegacyEntry[] = [];
  let hasMore = true;

  while (hasMore && orderedList.length < levelEntries.length) {
    hasMore = false;
    for (const src of sequence) {
      if (queueBySource[src].length > 0) {
        orderedList.push(queueBySource[src].shift()!);
        hasMore = true;
      }
    }
  }

  for (let i = 0; i < orderedList.length && count < maxSlots; i++) {
    const entry = orderedList[i];
    if (!entry) continue;
    // Find next matching publishing day of week
    while (!config.days.includes(current.getDay())) {
      current.setDate(current.getDate() + 1);
    }

    const dateStr = formatDateYMD(current);
    nextPlan[entry.id] = {
      id: crypto.randomUUID(),
      entryId: entry.id,
      level,
      date: dateStr,
      status: 'scheduled',
    };

    count++;
    // Move to next day for subsequent slot
    current.setDate(current.getDate() + 1);
  }

  return nextPlan;
}

/** Exports plan as CSV formatted string with BOM for Excel Arabic support. */
export function exportPlanAsCSV(
  plan: Record<string, ScheduledPlanItem>,
  entries: LegacyEntry[],
): string {
  const rows = [
    ['ID', 'Date', 'Level', 'Chapter', 'Topic', 'Stage', 'Status', 'Hook'],
  ];

  Object.values(plan)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(item => {
      const entry = entries.find(e => e.id === item.entryId);
      if (!entry) return;
      rows.push([
        item.id,
        item.date,
        item.level,
        entry.chapter,
        entry.topic,
        entry.source,
        item.status,
        entry.hook.replace(/\n/g, ' '),
      ]);
    });

  const csvContent = rows
    .map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return '\ufeff' + csvContent;
}

export interface ConceptCoverageItem {
  concept: ChapterConcept;
  availableFormats: LegacySource[];
  missingFormats: LegacySource[];
  matchingEntries: LegacyEntry[];
  status: 'complete' | 'partial' | 'missing';
}

export interface ChapterProductionStats {
  chapterId: string;
  totalAvailable: number;
  byFormat: Record<LegacySource, number>;
  targetTotal: number;
  readinessPercent: number;
  conceptCoverage: ConceptCoverageItem[];
}

export function matchEntryToConcept(entry: LegacyEntry, concept: ChapterConcept): boolean {
  const text = `${entry.chapter} ${entry.topic} ${entry.hook} ${entry.summary}`.toLowerCase();
  return concept.keywords.some(kw => text.includes(kw.toLowerCase()));
}

export function getChapterProductionStats(
  chapter: CurriculumChapter,
  allEntries: LegacyEntry[]
): ChapterProductionStats {
  const chapterEntries = allEntries.filter(e => matchesChapter(e, chapter));
  const byFormat: Record<LegacySource, number> = {
    intuition: chapterEntries.filter(e => e.source === 'intuition').length,
    mistake: chapterEntries.filter(e => e.source === 'mistake').length,
    ready: chapterEntries.filter(e => e.source === 'ready').length,
    solve: chapterEntries.filter(e => e.source === 'solve').length,
  };

  const concepts = chapter.concepts || [];
  const conceptCoverage = concepts.map(concept => {
    const matching = chapterEntries.filter(entry => matchEntryToConcept(entry, concept));
    const availableFormats = [...new Set(matching.map(e => e.source))];
    const missingFormats: LegacySource[] = (['intuition', 'mistake', 'ready', 'solve'] as LegacySource[]).filter(
      fmt => !availableFormats.includes(fmt)
    );
    const status: 'complete' | 'partial' | 'missing' =
      availableFormats.length >= 3 ? 'complete' : availableFormats.length > 0 ? 'partial' : 'missing';
    return {
      concept,
      availableFormats,
      missingFormats,
      matchingEntries: matching,
      status,
    };
  });

  const targetTotal = chapter.targetVideos || Math.max(6, (concepts.length || 4) * 2);
  const readinessPercent = Math.min(100, Math.round((chapterEntries.length / Math.max(1, targetTotal)) * 100));

  return {
    chapterId: chapter.id,
    totalAvailable: chapterEntries.length,
    byFormat,
    targetTotal,
    readinessPercent,
    conceptCoverage,
  };
}

export function createProjectForConcept(
  chapter: CurriculumChapter,
  concept: ChapterConcept,
  source: LegacySource = 'intuition',
): StudioProject {
  const model =
    chapter.level === '4AM' && /قاسم|pgcd|إقليدس/i.test(concept.name) ? 'gcd'
    : chapter.level === '4AM' && /جذر/i.test(concept.name) ? 'sqrt'
    : chapter.level === '4AM' && /كسر/i.test(concept.name) ? 'fraction'
    : chapter.level === '4AM' && /نشر|متطابق|تحليل/i.test(concept.name) ? 'area'
    : chapter.level === '4AM' && /طالس|فيثاغورس|هندسة/i.test(concept.name) ? 'thales'
    : chapter.level === '4AM' && /معادلة|ميزان/i.test(concept.name) ? 'balance'
    : /متتالي/i.test(concept.name) ? 'stair'
    : /احتمال/i.test(concept.name) ? 'venn'
    : /اشتقاق|مماس/i.test(concept.name) ? 'tangent'
    : /تكامل|مساحة/i.test(concept.name) ? 'riemann'
    : /أسية/i.test(concept.name) ? 'exponential'
    : /لوغاريتم/i.test(concept.name) ? 'logadd'
    : 'curve';

  const entry: LegacyEntry = {
    id: `custom-${concept.id}-${Date.now()}`,
    source,
    level: chapter.level,
    chapter: chapter.name,
    topic: concept.name,
    hook: `${concept.name} في ${chapter.level}\nهل تعرف السر الحقيقي؟`,
    model,
    summary: concept.description,
  };

  const proj = legacyToProject(entry);
  if (proj) return proj;

  return {
    id: `project-${entry.id}-${makeId()}`,
    name: concept.name,
    format: 'portrait',
    topic: concept.name,
    level: chapter.level,
    mistake: '',
    expression: '',
    remediation: concept.description,
    cta: 'شخّص ثغرتك مجاناً مع QED',
    scenes: [
      {
        id: makeId(),
        title: 'الخطاف',
        label: '01',
        body: `${concept.name}\nهل تعرف كيف تطبقه بذكاء؟`,
        duration: 4,
        kind: 'hook',
        phase: 'Hook',
        visual: 'curve',
        fontFamily: 'Tajawal',
      },
      {
        id: makeId(),
        title: 'المفهوم الجوهري',
        label: '02',
        body: concept.description,
        duration: 6,
        kind: 'explain',
        phase: 'Concept',
        visual: 'curve',
        fontFamily: 'Tajawal',
      },
      {
        id: makeId(),
        title: 'الدعوة للعمل',
        label: '03',
        body: 'شخّص ثغرتك مجاناً مع QED',
        duration: 4,
        kind: 'cta',
        phase: 'End card',
        visual: 'none',
        fontFamily: 'Tajawal',
      },
    ],
  };
}
