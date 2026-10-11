import type { ReactNode } from 'react';
import type { Scene, StudioProject } from '@/lib/studio';
import { TELEGRAM_QR_SRC, TELEGRAM_BOT_HANDLE } from '@/assets/telegram-qr';
import { OpenMathDiagram } from './open-math-diagram';

interface PromoMarketingSceneProps {
  layout: string;
  project: StudioProject;
  scene: Scene;
  width: number;
  height: number;
  elapsed: number;
  filterId: string;
}

export function PromoMarketingScene({
  layout,
  project,
  scene,
  width,
  height,
  elapsed,
  filterId,
}: PromoMarketingSceneProps): ReactNode {
  const accent = project.brandKit?.accentColor ?? '#38bdf8';
  const pulse = 0.8 + 0.2 * Math.sin(elapsed * 4);

  switch (layout) {
    case 'problem-hook':
      return (
        <g className="promo-scene-problem" fontFamily="Tajawal, sans-serif">
          {/* Top Luminous Badge */}
          <g transform={`translate(${width / 2}, 48)`}>
            <rect x="-170" y="-14" width="340" height="28" rx="14" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" strokeWidth="1.5" />
            <circle cx="-146" cy="0" r="5" fill="#f43f5e" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>
              🔴 أزمة صامتة تؤرق الأولياء والتلاميذ في الرياضيات
            </text>
          </g>

          {/* Main Hero Hook Title */}
          <text x={width / 2} y="112" textAnchor="middle" fontSize="30" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            لماذا يتحول حب التعلم إلى خوف وإحباط في الامتحانات؟
          </text>
          <text x={width / 2} y="142" textAnchor="middle" fontSize="15" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            ساعات طويلة من الحفظ المرهق والدروس الخصوصية... والنتيجة نقاط مخيبة لا تعكس الجهد!
          </text>

          {/* 2 Warning Diagnosis Cards */}
          <g transform="translate(60, 168)">
            {/* Card 1: Rote Memorization */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="400" height="210" rx="16" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="1.5" />
              <rect x="18" y="16" width="364" height="34" rx="8" fill="rgba(244, 63, 94, 0.15)" />
              <text x="200" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>
                ⚠️ فخ الحفظ الأعمى للقوانين الجافة
              </text>
              <g transform="translate(24, 75)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="350" y="0" textAnchor="end">• التلميذ يحفظ الصيغة دون فهم معناها الهندسي والمنطقي</text>
                <text x="350" y="30" textAnchor="end">• عند أدنى تغيير في صياغة التمرين يُصاب بالارتباك والعجز</text>
                <text x="350" y="60" textAnchor="end">• تبخر المعلومات والتوتر الشديد فور دخول قاعة الامتحان</text>
                <text x="350" y="90" textAnchor="end">• الاعتماد على الحظ والصدفة بدلاً من المنهجية الصلبة</text>
              </g>
            </g>

            {/* Card 2: Time and Money Waste */}
            <g transform="translate(440, 0)">
              <rect x="0" y="0" width="400" height="210" rx="16" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
              <rect x="18" y="16" width="364" height="34" rx="8" fill="rgba(245, 158, 11, 0.15)" />
              <text x="200" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                💸 استنزاف الوقت والجهد وميزانية الأسرة
              </text>
              <g transform="translate(24, 75)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="350" y="0" textAnchor="end">• توتر أسري مستمر وخوف متواصل من تدني المعدل العام</text>
                <text x="350" y="30" textAnchor="end">• إهدار مئات الساعات في دروس خصوصية تلقينية مكررة</text>
                <text x="350" y="60" textAnchor="end">• ضياع نقاط مصيرية في شهادتي التعليم المتوسط BEM والباكالوريا BAC</text>
                <text x="350" y="90" textAnchor="end">• حرمان التلميذ من فرصة الالتحاق بالتخصص الذي يحلم به</text>
              </g>
            </g>
          </g>

          {/* Bottom Root Cause Banner */}
          <g transform={`translate(${width / 2}, 430)`}>
            <rect x="-380" y="-22" width="760" height="48" rx="24" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="8" textAnchor="middle" fontSize="15" fontWeight="700" fill="#38bdf8" style={{ unicodeBidi: 'plaintext' }}>
              💡 الحقيقة: المشكلة ليست في ذكاء ابنك... بل في غياب الفهم البصري والحدس الرياضي!
            </text>
          </g>
        </g>
      );

    case 'before-after':
      return (
        <g className="promo-scene-comparison" fontFamily="Tajawal, sans-serif">
          {/* Header Badge */}
          <g transform={`translate(${width / 2}, 44)`}>
            <rect x="-180" y="-13" width="360" height="26" rx="13" fill="rgba(56, 189, 248, 0.12)" stroke={accent} strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
              ⚡ المقارنة الحاسمة: اختر مستقبل ابنك الأكاديمي
            </text>
          </g>

          {/* Main Title */}
          <text x={width / 2} y="98" textAnchor="middle" fontSize="26" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            الفرق الجذري بين التعليم التقليدي ومنهجية QED البصرية
          </text>

          {/* Split Comparison Cards */}
          <g transform="translate(50, 122)">
            {/* Left Card: Traditional (Red/Dark) */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="415" height="340" rx="20" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="1.8" />
              <rect x="20" y="16" width="375" height="42" rx="10" fill="rgba(244, 63, 94, 0.15)" />
              <text x="207" y="42" textAnchor="middle" fontSize="16" fontWeight="800" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>
                ❌ التعليم التقليدي (حفظ وتلقين أعمى)
              </text>
              <g transform="translate(24, 90)" fontSize="13.5" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="365" y="0" textAnchor="end">✗ حفظ القوانين كطلاسم مجردة دون أي تخيل هندسي</text>
                <text x="365" y="38" textAnchor="end">✗ الوقوع المتكرر في فخاخ الامتحانات وأخطاء الحساب</text>
                <text x="365" y="76" textAnchor="end">✗ خوف مزمن وفقدان الثقة بالنفس والنفور من المادة</text>
                <text x="365" y="114" textAnchor="end">✗ درجات متذبذبة وخيبة أمل مستمرة للوالدين</text>
                <text x="365" y="152" textAnchor="end">✗ مجهود مضاعف ونتائج هزيلة لا تضمن النجاح</text>
              </g>
              {/* Bottom Result Pill */}
              <rect x="25" y="280" width="365" height="36" rx="8" fill="rgba(244, 63, 94, 0.1)" stroke="rgba(244, 63, 94, 0.3)" />
              <text x="207" y="303" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>
                النتيجة: إحباط، توتر، وضياع نقاط الامتحانات المصيرية
              </text>
            </g>

            {/* Right Card: QED Visual Method (Cyan/Emerald Glow) */}
            <g transform="translate(445, 0)">
              <rect x="0" y="0" width="415" height="340" rx="20" fill="rgba(11, 25, 44, 0.95)" stroke={accent} strokeWidth="2.2" filter={`url(#softBloom-${filterId})`} />
              <rect x="20" y="16" width="375" height="42" rx="10" fill="rgba(56, 189, 248, 0.2)" />
              <text x="207" y="42" textAnchor="middle" fontSize="16" fontWeight="800" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
                ✅ أكاديمية QED (الفهم والحدس البصري)
              </text>
              <g transform="translate(24, 90)" fontSize="13.5" fontWeight="600" fill="#f1f5f9" style={{ unicodeBidi: 'plaintext' }}>
                <text x="365" y="0" textAnchor="end">✓ بناء الحدس الهندسي والتفاعلي واستيعاب في ثوانٍ</text>
                <text x="365" y="38" textAnchor="end">✓ تحصين شامل ضد فخاخ BEM و BAC ومطابقة سلم التنقيط</text>
                <text x="365" y="76" textAnchor="end">✓ ثقة مطلقة وشغف حقيقي بحل أعقد المسائل الرياضية</text>
                <text x="365" y="114" textAnchor="end">✓ علامة 20/20 تصبح هدفاً واقعياً وملموساً للتلميذ</text>
                <text x="365" y="152" textAnchor="end">✓ استيعاب عميق يبقى راسخاً حتى المرحلة الجامعية</text>
              </g>
              {/* Bottom Result Pill */}
              <rect x="25" y="280" width="365" height="36" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke={accent} />
              <text x="207" y="303" textAnchor="middle" fontSize="13" fontWeight="700" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
                النتيجة: تفوق دراسي مستحق، ثقة، وراحة بال تامة للأولياء
              </text>
            </g>
          </g>

          {/* Center VS Beacon */}
          <g transform={`translate(${width / 2}, 290)`}>
            <circle cx="0" cy="0" r="22" fill="#0f172a" stroke={accent} strokeWidth="2" />
            <text x="0" y="6" textAnchor="middle" fontSize="14" fontWeight="900" fill="#f59e0b" fontFamily="Space Grotesk, sans-serif">
              VS
            </text>
          </g>
        </g>
      );

    case 'parents-pitch':
      return (
        <g className="promo-scene-parents" fontFamily="Tajawal, sans-serif">
          {/* Header Badge */}
          <g transform={`translate(${width / 2}, 44)`}>
            <rect x="-190" y="-13" width="380" height="26" rx="13" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
              👨‍👩‍👧 رسالة خاصة إلى كل أب وأم حريصين على نجاح أبنائهم
            </text>
          </g>

          {/* Main Headline */}
          <text x={width / 2} y="98" textAnchor="middle" fontSize="27" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            ودّعوا القلق على نتائج الرياضيات في BEM و BAC نهائياً
          </text>
          <text x={width / 2} y="126" textAnchor="middle" fontSize="14" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            نمنح ابنكم أساساً رياضياً متيناً يضمن له التميز واستقلالية التفكير
          </text>

          {/* 3 Pillar Benefit Cards for Parents */}
          <g transform="translate(50, 150)">
            {/* Card 1 */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="270" height="265" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
              <circle cx="135" cy="45" r="24" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="135" y="52" textAnchor="middle" fontSize="18">💎</text>
              <text x="135" y="95" textAnchor="middle" fontSize="16" fontWeight="700" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
                راحة البال والاستقرار
              </text>
              <g transform="translate(20, 125)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="230" y="0" textAnchor="end">• وداعاً للنزاعات والتوتر اليومي</text>
                <text x="230" y="24" textAnchor="end">  أثناء مراجعة الواجبات بالبيت.</text>
                <text x="230" y="54" textAnchor="end">• ابنك يتعلم كيف يفكر بنفسه</text>
                <text x="230" y="78" textAnchor="end">  ويحل أصعب المسائل باستقلالية.</text>
              </g>
            </g>

            {/* Card 2 */}
            <g transform="translate(295, 0)">
              <rect x="0" y="0" width="270" height="265" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" />
              <circle cx="135" cy="45" r="24" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1.5" />
              <text x="135" y="52" textAnchor="middle" fontSize="18">📈</text>
              <text x="135" y="95" textAnchor="middle" fontSize="16" fontWeight="700" fill="#10b981" style={{ unicodeBidi: 'plaintext' }}>
                قفزة حقيقية في المعدل
              </text>
              <g transform="translate(20, 125)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="230" y="0" textAnchor="end">• ارتفاع بمعدل +4 إلى +6 نقاط</text>
                <text x="230" y="24" textAnchor="end">  في مادة الرياضيات خلال أسابيع.</text>
                <text x="230" y="54" textAnchor="end">• علاج جذري لثغرات السنوات السابقة</text>
                <text x="230" y="78" textAnchor="end">  بما يضمن ثبات المستوى وتصاعده.</text>
              </g>
            </g>

            {/* Card 3 */}
            <g transform="translate(590, 0)">
              <rect x="0" y="0" width="270" height="265" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
              <circle cx="135" cy="45" r="24" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="135" y="52" textAnchor="middle" fontSize="18">📜</text>
              <text x="135" y="95" textAnchor="middle" fontSize="16" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                منهاج رسمي موثوق 100%
              </text>
              <g transform="translate(20, 125)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="230" y="0" textAnchor="end">• التزام صارم ببرنامج وزارة</text>
                <text x="230" y="24" textAnchor="end">  التربية الوطنية الجزائري الرسمي.</text>
                <text x="230" y="54" textAnchor="end">• تدريب دقيق على سلم التنقيط</text>
                <text x="230" y="78" textAnchor="end">  لضمان عدم ضياع أي كسر من النقطة.</text>
              </g>
            </g>
          </g>

          {/* Bottom Trust Banner */}
          <g transform={`translate(${width / 2}, 462)`}>
            <rect x="-380" y="-18" width="760" height="38" rx="19" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="1.2" />
            <text x="0" y="6" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
              ⭐ استثمارك الحقيقي في مستقبل ابنك يبدأ من الفهم السليم وليس الحفظ العقيم.
            </text>
          </g>
        </g>
      );

    case 'students-pitch':
      return (
        <g className="promo-scene-students" fontFamily="Tajawal, sans-serif">
          {/* Header Badge */}
          <g transform={`translate(${width / 2}, 44)`}>
            <rect x="-185" y="-13" width="370" height="26" rx="13" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a855f7" style={{ unicodeBidi: 'plaintext' }}>
              🚀 إلى أبطال شهادتي التعليم المتوسط BEM والباكالوريا BAC
            </text>
          </g>

          {/* Headline */}
          <text x={width / 2} y="98" textAnchor="middle" fontSize="27" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            الرياضيات سهلة وممتعة... عندما تراها تتحرك أمام عينيك!
          </text>
          <text x={width / 2} y="126" textAnchor="middle" fontSize="14" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            لست ضعيفاً في المادة، بل كانت تُشرح لك بطريقة جافة ومملة خالية من الروح!
          </text>

          {/* Split Content: Math Visual Demo + Student Value Callouts */}
          <g transform="translate(50, 148)">
            {/* Left Box: Animated Math Interactive Screen */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="410" height="270" rx="16" fill="rgba(11, 18, 30, 0.95)" stroke={accent} strokeWidth="1.8" />
              {/* Fake Window Controls */}
              <circle cx="24" cy="18" r="4" fill="#f43f5e" />
              <circle cx="36" cy="18" r="4" fill="#f59e0b" />
              <circle cx="48" cy="18" r="4" fill="#10b981" />
              <text x="205" y="22" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Space Grotesk, sans-serif">QED VISUAL ENGINE · 3B1B STYLE</text>
              <line x1="12" y1="32" x2="398" y2="32" stroke="rgba(255,255,255,0.08)" />

              {/* Render Living Tangent & Slope Animation inside */}
              <g transform="translate(10, 40) scale(0.68)">
                <OpenMathDiagram visual="tangent" expression="f'(x) = 2x" elapsed={elapsed} duration={scene.duration} />
              </g>
              {/* Caption */}
              <rect x="20" y="228" width="370" height="28" rx="6" fill="rgba(56, 189, 248, 0.15)" />
              <text x="205" y="246" textAnchor="middle" fontSize="12" fontWeight="700" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
                شاهد المماس اللحظي وهو ينزلق ومعدل التغير وهو يتولد حياً
              </text>
            </g>

            {/* Right Box: Student Superpowers */}
            <g transform="translate(435, 0)">
              <rect x="0" y="0" width="425" height="270" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
              <g transform="translate(24, 30)" fontSize="14" style={{ unicodeBidi: 'plaintext' }}>
                {/* Feature 1 */}
                <g transform="translate(0, 0)">
                  <circle cx="360" cy="12" r="14" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" />
                  <text x="360" y="16" textAnchor="middle" fontSize="13">🎮</text>
                  <text x="330" y="10" textAnchor="end" fontSize="15" fontWeight="700" fill="#f8fafc">رسوم متحركة سينمائية (3Blue1Brown)</text>
                  <text x="330" y="32" textAnchor="end" fontSize="12.5" fontWeight="500" fill="#94a3b8">تفكيك أصعب القوانين إلى أشكال هندسية واضحة وممتعة.</text>
                </g>

                {/* Feature 2 */}
                <g transform="translate(0, 75)">
                  <circle cx="360" cy="12" r="14" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                  <text x="360" y="16" textAnchor="middle" fontSize="13">⚡</text>
                  <text x="330" y="10" textAnchor="end" fontSize="15" fontWeight="700" fill="#38bdf8">حل أصعب المسائل في دقائق معدودة</text>
                  <text x="330" y="32" textAnchor="end" fontSize="12.5" fontWeight="500" fill="#94a3b8">بالذكاء الهندسي والحدس بدلاً من المعادلات الطويلة المرهقة.</text>
                </g>

                {/* Feature 3 */}
                <g transform="translate(0, 150)">
                  <circle cx="360" cy="12" r="14" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" />
                  <text x="360" y="16" textAnchor="middle" fontSize="13">🛡️</text>
                  <text x="330" y="10" textAnchor="end" fontSize="15" fontWeight="700" fill="#10b981">كشف فخاخ الامتحانات بلمح البصر</text>
                  <text x="330" y="32" textAnchor="end" fontSize="12.5" fontWeight="500" fill="#94a3b8">حصانة كاملة ضد الأخطاء التي تضيع علامة 20/20.</text>
                </g>
              </g>
            </g>
          </g>

          {/* Bottom Student Cheer */}
          <text x={width / 2} y="465" textAnchor="middle" fontSize="15" fontWeight="800" fill="#a855f7" style={{ unicodeBidi: 'plaintext' }}>
            🔥 اشعر بمتعة العبقرية واجعل الرياضيات مادتك المفضلة ومصدر فخرك أمام الجميع!
          </text>
        </g>
      );

    case 'four-pillars':
      return (
        <g className="promo-scene-pillars" fontFamily="Tajawal, sans-serif">
          {/* Header Badge */}
          <g transform={`translate(${width / 2}, 42)`}>
            <rect x="-180" y="-13" width="360" height="26" rx="13" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#10b981" style={{ unicodeBidi: 'plaintext' }}>
              🏆 المنظومة التعليمية الرباعية المتكاملة للامتياز
            </text>
          </g>

          {/* Headline */}
          <text x={width / 2} y="92" textAnchor="middle" fontSize="26" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            سر التفوق: 4 مسارات متوازية لتغطية كل فصل في المنهاج
          </text>
          <text x={width / 2} y="118" textAnchor="middle" fontSize="14" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            منهجية علمية شاملة لا تترك أي ثغرة للصدفة أو المفاجآت يوم الامتحان الرسمي
          </text>

          {/* 4 Pillars Grid (2x2) */}
          <g transform="translate(50, 138)">
            {/* Pillar 1: Intuition */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="415" height="135" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.4" />
              <rect x="16" y="14" width="36" height="36" rx="8" fill="rgba(56, 189, 248, 0.15)" />
              <text x="34" y="38" textAnchor="middle" fontSize="20">💡</text>
              <text x="64" y="32" fontSize="16" fontWeight="700" fill="#38bdf8" style={{ unicodeBidi: 'plaintext' }}>1. بناء الحدس البصري (Visual Intuition)</text>
              <text x="64" y="56" fontSize="12" fontWeight="500" fill="#64748b" style={{ unicodeBidi: 'plaintext' }}>Geometric / Mental Models Before Formulas</text>
              <text x="24" y="94" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                تمثيل هندسي وتفاعلي حيّ لكل مفهوم قبل الانتقال إلى الحساب الجبري المعقد.
              </text>
            </g>

            {/* Pillar 2: Trap Inoculation */}
            <g transform="translate(445, 0)">
              <rect x="0" y="0" width="415" height="135" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="1.4" />
              <rect x="16" y="14" width="36" height="36" rx="8" fill="rgba(244, 63, 94, 0.15)" />
              <text x="34" y="38" textAnchor="middle" fontSize="20">🩹</text>
              <text x="64" y="32" fontSize="16" fontWeight="700" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>2. تشخيص الفخاخ والتحصين (Trap Inoculation)</text>
              <text x="64" y="56" fontSize="12" fontWeight="500" fill="#64748b" style={{ unicodeBidi: 'plaintext' }}>Common Mistakes & Misconceptions</text>
              <text x="24" y="94" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                تشريح الأخطاء الشائعة في شهادات التعليم والتحصين المنهجي منها لتفادي ضياع النقاط.
              </text>
            </g>

            {/* Pillar 3: Shorts Challenge */}
            <g transform="translate(0, 155)">
              <rect x="0" y="0" width="415" height="135" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.4" />
              <rect x="16" y="14" width="36" height="36" rx="8" fill="rgba(245, 158, 11, 0.15)" />
              <text x="34" y="38" textAnchor="middle" fontSize="20">🎬</text>
              <text x="64" y="32" fontSize="16" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>3. كبسولات التحدي السريعة (Visual Shorts)</text>
              <text x="64" y="56" fontSize="12" fontWeight="500" fill="#64748b" style={{ unicodeBidi: 'plaintext' }}>Fast 30-45s Interactive Challenges</text>
              <text x="24" y="94" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                فيديوهات رأسية مشوقة تطرح ألغازاً ذكية لترسيخ القواعد وتدريب سرعة البديهة.
              </text>
            </g>

            {/* Pillar 4: Solved Exam Problem */}
            <g transform="translate(445, 155)">
              <rect x="0" y="0" width="415" height="135" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.4" />
              <rect x="16" y="14" width="36" height="36" rx="8" fill="rgba(16, 185, 129, 0.15)" />
              <text x="34" y="38" textAnchor="middle" fontSize="20">📝</text>
              <text x="64" y="32" fontSize="16" fontWeight="700" fill="#10b981" style={{ unicodeBidi: 'plaintext' }}>4. حلول نموذجية مفصلة (Exam Mastery)</text>
              <text x="64" y="56" fontSize="12" fontWeight="500" fill="#64748b" style={{ unicodeBidi: 'plaintext' }}>Step-by-Step Rigorous Official Methodology</text>
              <text x="24" y="94" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                حل نماذج امتحانات رسمية خطوة بخطوة بالالتزام الحرفي بسلم التنقيط الوزاري.
              </text>
            </g>
          </g>

          {/* Bottom Banner */}
          <g transform={`translate(${width / 2}, 466)`}>
            <rect x="-380" y="-18" width="760" height="36" rx="18" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#10b981" style={{ unicodeBidi: 'plaintext' }}>
              نظام تدريب متكامل يضمن استيعاب كل مفهوم بنسبة 100% قبل يوم الامتحان!
            </text>
          </g>
        </g>
      );

    case 'curriculum-mastery':
      return (
        <g className="promo-scene-curriculum" fontFamily="Tajawal, sans-serif">
          {/* Header Badge */}
          <g transform={`translate(${width / 2}, 44)`}>
            <rect x="-195" y="-13" width="390" height="26" rx="13" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#38bdf8" style={{ unicodeBidi: 'plaintext' }}>
              🇩🇿 منهاج وزارة التربية الوطنية الجزائري الرسمي 2026
            </text>
          </g>

          {/* Headline */}
          <text x={width / 2} y="96" textAnchor="middle" fontSize="26" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            تغطية شاملة لكل محاور 4 متوسط (BEM) و 3 ثانوي (BAC)
          </text>
          <text x={width / 2} y="122" textAnchor="middle" fontSize="14" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            كل باب دراسي مفكك إلى مفاهيمه الدقيقة مع نماذج بصرية مخصصة ومطابقة للامتحانات الرسمية
          </text>

          {/* 2 Big Level Panels: 4AM & 3AS */}
          <g transform="translate(50, 145)">
            {/* 4AM Panel */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="415" height="275" rx="18" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
              <rect x="20" y="16" width="375" height="38" rx="8" fill="rgba(245, 158, 11, 0.15)" />
              <text x="207" y="41" textAnchor="middle" fontSize="15" fontWeight="800" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                🎓 شهادة التعليم المتوسط (BEM 4AM)
              </text>
              <g transform="translate(24, 80)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="365" y="0" textAnchor="end">• الأعداد الطبيعية والناطقة، القواسم وخوارزمية PGCD</text>
                <text x="365" y="28" textAnchor="end">• الحساب على الجذور التربيعية وتبسيط العبارات</text>
                <text x="365" y="56" textAnchor="end">• الحساب الحرفي، النشر والتحليل، والمعادلات والمتراجحات</text>
                <text x="365" y="84" textAnchor="end">• مبرهنتا طالس وفيثاغورس والنسب المثلثية</text>
                <text x="365" y="112" textAnchor="end">• الأشعة والمعالم في المستوي والدوال الخطية والتآلفية</text>
                <text x="365" y="140" textAnchor="end">• جمل المعادلات وحل المسائل الإدماجية المركبة</text>
              </g>
              <rect x="20" y="235" width="375" height="26" rx="6" fill="rgba(245, 158, 11, 0.1)" />
              <text x="207" y="252" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                7 أبواب كاملة مفككة ومغطاة بنماذج بصرية وتطبيقات محلولة
              </text>
            </g>

            {/* 3AS Panel */}
            <g transform="translate(445, 0)">
              <rect x="0" y="0" width="415" height="275" rx="18" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
              <rect x="20" y="16" width="375" height="38" rx="8" fill="rgba(56, 189, 248, 0.15)" />
              <text x="207" y="41" textAnchor="middle" fontSize="15" fontWeight="800" fill="#38bdf8" style={{ unicodeBidi: 'plaintext' }}>
                🎓 شهادة البكالوريا (BAC 3AS)
              </text>
              <g transform="translate(24, 80)" fontSize="13" fontWeight="500" fill="#cbd5e1" style={{ unicodeBidi: 'plaintext' }}>
                <text x="365" y="0" textAnchor="end">• الدوال العددية، النهايات، حالات عدم التعيين، والاستمرارية</text>
                <text x="365" y="28" textAnchor="end">• الاشتقاقية، المماس، ونقاط الانعطاف ودراسة التغيرات</text>
                <text x="365" y="56" textAnchor="end">• الدالتان الأسية واللوغاريتمية والتزايد المقارن</text>
                <text x="365" y="84" textAnchor="end">• المتتاليات العددية والبرهان بالتراجع والتقارب</text>
                <text x="365" y="112" textAnchor="end">• الحساب التكاملي، الدوال الأصلية، وحساب المساحات</text>
                <text x="365" y="140" textAnchor="end">• الاحتمالات، الهندسة الفضائية، والأعداد المركبة</text>
              </g>
              <rect x="20" y="235" width="375" height="26" rx="6" fill="rgba(56, 189, 248, 0.1)" />
              <text x="207" y="252" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#38bdf8" style={{ unicodeBidi: 'plaintext' }}>
                11 باباً مع التركيز على المسائل الشاملة لسلم تنقيط البكالوريا
              </text>
            </g>
          </g>

          {/* Bottom Authority Seal */}
          <text x={width / 2} y="460" textAnchor="middle" fontSize="14" fontWeight="700" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            تحت إشراف ومتابعة نخبة من أساتذة ومفتشي مادة الرياضيات ذوي الخبرة الميدانية العالية
          </text>
        </g>
      );

    case 'tv-grand-cta':
      return (
        <g className="promo-scene-cta" fontFamily="Tajawal, sans-serif">
          {/* Top Luminous Header Alert */}
          <g transform={`translate(${width / 2}, 42)`}>
            <rect x="-210" y="-14" width="420" height="28" rx="14" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="1.5" />
            <circle cx="-185" cy="0" r="5" fill="#f43f5e" opacity={pulse} />
            <text x="0" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f43f5e" style={{ unicodeBidi: 'plaintext' }}>
              🔥 عرض خاص وحصري عبر شاشات العرض — امسح الرمز الآن!
            </text>
          </g>

          {/* Main Title */}
          <text x={width / 2} y="96" textAnchor="middle" fontSize="28" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            ابدأ رحلة التفوق مع QED Studio مجاناً واضمن علامة الامتياز
          </text>

          {/* Main Split: Giant Scannable QR + Irresistible Free Gift Stack */}
          <g transform="translate(50, 122)">
            {/* Left Box: Giant Glowing QR Code Card */}
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="380" height="340" rx="22" fill="rgba(11, 18, 30, 0.95)" stroke={accent} strokeWidth="2.5" filter={`url(#neonGlow-${filterId})`} />
              {/* White Backing for Camera Scannability */}
              <rect x="90" y="24" width="200" height="200" rx="16" fill="#ffffff" stroke="rgba(255,255,255,0.9)" strokeWidth="1" />
              <image href={TELEGRAM_QR_SRC} x="100" y="34" width="180" height="180" preserveAspectRatio="xMidYMid meet" />

              {/* Bot Handle Pill */}
              <rect x="65" y="238" width="250" height="32" rx="8" fill="rgba(15, 23, 42, 0.95)" stroke={accent} strokeWidth="1.4" />
              <text x="190" y="259" textAnchor="middle" fontSize="13" fontWeight="bold" fill={accent} fontFamily="Space Grotesk, monospace">
                {project.qrBotHandle ?? TELEGRAM_BOT_HANDLE}
              </text>

              {/* Scan Prompt */}
              <text x="190" y="295" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
                📲 وجّه كاميرا هاتفك نحو الرمز للدخول الفوري
              </text>
              <text x="190" y="318" textAnchor="middle" fontSize="11" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
                تطبيق فوري مباشر عبر تيليجرام دون الحاجة لتثبيت برامج
              </text>
            </g>

            {/* Right Box: 3 Free High-Value Gifts Stack */}
            <g transform="translate(410, 0)">
              <rect x="0" y="0" width="450" height="340" rx="22" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1.8" />
              <text x="225" y="38" textAnchor="middle" fontSize="17" fontWeight="800" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                🎁 باقة الهدايا المجانية الفورية بمجرد المسح:
              </text>

              <g transform="translate(24, 65)" style={{ unicodeBidi: 'plaintext' }}>
                {/* Gift 1 */}
                <g transform="translate(0, 0)">
                  <rect x="0" y="0" width="402" height="66" rx="12" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.3)" />
                  <text x="382" y="26" textAnchor="end" fontSize="15" fontWeight="700" fill="#38bdf8">1. تشخيص شامل ودقيق لمستوى ابنك مجاناً</text>
                  <text x="382" y="48" textAnchor="end" fontSize="12" fontWeight="500" fill="#cbd5e1">اختبار ذكي يكشف ثغرات التلميذ والفخاخ التي يسقط فيها في 5 دقائق.</text>
                </g>

                {/* Gift 2 */}
                <g transform="translate(0, 80)">
                  <rect x="0" y="0" width="402" height="66" rx="12" fill="rgba(244, 63, 94, 0.1)" stroke="rgba(244, 63, 94, 0.3)" />
                  <text x="382" y="26" textAnchor="end" fontSize="15" fontWeight="700" fill="#f43f5e">2. حقيبة كبسولات الفخاخ الامتحانية الشائعة</text>
                  <text x="382" y="48" textAnchor="end" fontSize="12" fontWeight="500" fill="#cbd5e1">دليل بصري لأهم 20 فخاً في شهادتي BEM و BAC وكيفية تفاديها فوراً.</text>
                </g>

                {/* Gift 3 */}
                <g transform="translate(0, 160)">
                  <rect x="0" y="0" width="402" height="66" rx="12" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" />
                  <text x="382" y="26" textAnchor="end" fontSize="15" fontWeight="700" fill="#10b981">3. درس بصري تفاعلي مفتوح بدون أي مقابل</text>
                  <text x="382" y="48" textAnchor="end" fontSize="12" fontWeight="500" fill="#cbd5e1">جرّب متعة الفهم مع ابنك واكتشف بنفسك كيف تتحول الرياضيات إلى شغف.</text>
                </g>
              </g>

              {/* Bottom Limited Seat Urgency */}
              <text x="225" y="318" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#f59e0b" style={{ unicodeBidi: 'plaintext' }}>
                ⚡ انضم الآن إلى نخبة المتفوقين — الفرصة متاحة لفترة محدودة!
              </text>
            </g>
          </g>
        </g>
      );

    case 'loop-outro':
      return (
        <g className="promo-scene-outro" fontFamily="Tajawal, sans-serif">
          {/* Luminous Center Logo */}
          <g transform={`translate(${width / 2}, 110)`}>
            <text x="0" y="0" textAnchor="middle" fontSize="38" fontWeight="900" fill="#f8fafc" letterSpacing="2" fontFamily="Space Grotesk, Tajawal, sans-serif">
              QED STUDIO <tspan fill={accent}>∎</tspan>
            </text>
            <text x="0" y="32" textAnchor="middle" fontSize="15" fontWeight="700" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
              الأكاديمية البصرية للرياضيات والتميز الأكاديمي
            </text>
          </g>

          {/* Big Emotional Headline */}
          <text x={width / 2} y="195" textAnchor="middle" fontSize="32" fontWeight="800" fill="#f8fafc" style={{ unicodeBidi: 'plaintext' }}>
            لأن الفهم العميق... يصنع الفارق الأكبر في حياة أبنائكم.
          </text>
          <text x={width / 2} y="235" textAnchor="middle" fontSize="18" fontWeight="500" fill="#94a3b8" style={{ unicodeBidi: 'plaintext' }}>
            وضوح بسيط · ثقة مطلقة · نتائج تفوق التوقعات
          </text>

          {/* Living Harmonious Wave Model in Center */}
          <g transform={`translate(${width / 2 - 195}, 245) scale(0.72)`}>
            <OpenMathDiagram visual="wave" expression="sin(x)" elapsed={elapsed} duration={scene.duration} />
          </g>

          {/* Bottom Continuous Loop Badge */}
          <g transform={`translate(${width / 2}, 470)`}>
            <rect x="-190" y="-16" width="380" height="32" rx="16" fill="rgba(56, 189, 248, 0.12)" stroke={accent} strokeWidth="1.2" />
            <circle cx="-165" cy="0" r="4" fill={accent} opacity={pulse} />
            <text x="0" y="5" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={accent} style={{ unicodeBidi: 'plaintext' }}>
              🔄 العرض يتكرر تلقائياً · امسح الرمز بكاميرا هاتفك للبدء فوراً
            </text>
          </g>
        </g>
      );

    default:
      return null;
  }
}
