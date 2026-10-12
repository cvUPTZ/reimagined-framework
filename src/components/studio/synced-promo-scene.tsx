import type { Scene, StudioProject } from '@/lib/studio';
import { TELEGRAM_QR_SRC, TELEGRAM_BOT_HANDLE } from '@/assets/telegram-qr';

const ar = { unicodeBidi: 'plaintext' as const };
const reveal = (t: number, start = 0, length = .55) => 1 - Math.pow(1 - Math.min(1, Math.max(0, (t - start) / length)), 3);

/** Notebook campaign artwork keyed to the supplied narration's scene-local cues. */
export function SyncedPromoScene({ scene, project, width, height, elapsed: t }: { scene: Scene; project: StudioProject; width: number; height: number; elapsed: number }) {
  const layout = String(scene.legacy?.['promoLayout']).replace('synced-', '');
  const lines = scene.body.split('\n');
  const show = (start: number) => reveal(t, start);
  const stroke = (d: string, start = .5, color = 'var(--ink-orange)') => <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - show(start)}/>;
  const label = (text: string, x: number, y: number, start = .5, size = 22, color = 'var(--ink)') => <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="600" fill={color} style={ar} opacity={show(start)}>{text}</text>;
  const sheet = <g><rect x="60" y="112" width="350" height="350" rx="4" fill="var(--paper-sheet)"/>{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M60 ${140 + i * 22}H410`} stroke="var(--paper-line)"/>)}<path d="M380 112V462" stroke="var(--paper-margin)" strokeWidth="2"/></g>;
  const chain = (labels: string[], starts: number[]) => <g>{labels.map((text, i) => <g key={text} opacity={show(starts[i] ?? 0)}><rect x="80" y={130 + i * 105} width="310" height="68" rx="4" fill="var(--paper-sheet)" stroke={i === 0 ? 'var(--ink-green)' : 'var(--ink-blue)'} strokeWidth="2"/>{label(text, 235, 173 + i * 105, starts[i] ?? 0, 23)}{i < labels.length - 1 && stroke(`M235 ${204 + i * 105}v24m-8-8l8 8 8-8`, starts[i + 1] ?? 0, 'var(--ink-blue)')}</g>)}</g>;
  return <g fontFamily="Tajawal, sans-serif" transform={`scale(${width / 960} ${height / 540})`}>
    <rect width="960" height="540" fill="var(--paper)"/>
    <text x="48" y="54" fontFamily="Space Grotesk" fontSize="24" fontWeight="700" fill="var(--ink)">QED<tspan fill="var(--ink-orange)"> ■</tspan></text>
    <g opacity={show(.08)} transform={`translate(0 ${8 * (1 - show(.08))})`}>
      <text x="900" y="170" textAnchor="end" fontSize="38" fontWeight="700" fill="var(--ink)" style={ar}>{lines.map((line, i) => <tspan key={i} x="900" dy={i ? 54 : 0}>{line}</tspan>)}</text>
      {stroke(`M895 ${194 + (lines.length - 1) * 54}q-130 9-250 0`, .65)}
    </g>
    {layout === 'grade' && <>{sheet}{label('اختبار الفصل الأول', 235, 157, .15, 24)}{label('في الرياضيات', 235, 195, .6, 24)}{label('العلامة', 235, 294, 2.9, 56, 'var(--ink-orange)')}{stroke('M335 255c-25-45-210-45-210 25s190 65 215 10c10-20-5-35-20-40', 3.1)}{label('ماذا تعني حقاً؟', 235, 402, 4.2, 28)}</>}
    {layout === 'compare' && <>{[145, 325].map((x, i) => <g key={x} opacity={show(.3 + i * .4)}><circle cx={x} cy="206" r="28" fill="var(--paper-sheet)" stroke="var(--ink-blue)" strokeWidth="3"/>{stroke(`M${x - 42} 310v-40q42-50 84 0v40`, .7, 'var(--ink-blue)')}{label(`التلميذ ${i + 1}`, x, 355, .8, 22)}</g>)}{label('النقطة نفسها', 235, 130, .2, 28)}{label('≠', 235, 260, 3.2, 56, 'var(--ink-orange)')}{label('ليس بالضرورة المستوى نفسه', 235, 426, 4.2, 22)}</>}
    {layout === 'fraction' && <>{sheet}{label('خطأ في جمع الكسور', 235, 163, .2, 24)}<text x="235" y="263" textAnchor="middle" fontFamily="Space Grotesk" fontSize="34" fontWeight="700" fill="var(--ink-blue)" opacity={show(.3)}>½ + ⅓ = ⅖</text>{stroke('M305 231c-20-30-90-25-90 20s100 38 100-5', 3)}{label('البسط مع البسط', 235, 338, 4.1, 24, 'var(--ink-orange)')}{label('والمقام مع المقام', 235, 388, 6.4, 24, 'var(--ink-orange)')}</>}
    {layout === 'other' && <>{sheet}{label('التلميذ الثاني', 235, 175, .1, 26)}{label('خطأ آخر', 235, 280, .5, 40, 'var(--ink-blue)')}{stroke('M115 320q120 12 240-2', 1.1)}{label('نبحث عن سببه', 235, 405, 1.4, 27)}</>}
    {layout === 'roots' && <>{label('علامة واحدة', 235, 132, .1, 32)}{stroke('M235 160v55m0 0l-120 75m120-75v75m0-75l120 75', .3, 'var(--ink-blue)')}{['مفهوم سابق ناقص', 'خطأ في الإجراء', 'تصوّر خاطئ', 'صعوبة في الربط'].map((text, i) => label(text, i % 2 ? 330 : 140, 325 + Math.floor(i / 2) * 80, .6 + i * 1.3, 21, 'var(--ink-orange)'))}</>}
    {layout === 'exercises' && <>{Array.from({ length: 20 }, (_, i) => <g key={i} opacity={show(2.9 + i * .04)}><rect x={65 + i % 5 * 65} y={135 + Math.floor(i / 5) * 60} width="48" height="48" rx="3" fill="var(--paper-sheet)" stroke="var(--paper-line)"/>{stroke(`M${78 + i % 5 * 65} ${149 + Math.floor(i / 5) * 60}l22 22m0-22l-22 22`, 3.5 + i * .04)}</g>)}{label('20 تمريناً إضافياً', 235, 423, 3, 28)}{label('لن تصلح خللاً لم نحدّده', 235, 464, 4.1, 23)}</>}
    {layout === 'diagnosis' && <>{sheet}{label('نشخّص', 235, 223, .1, 52, 'var(--ink-blue)')}{stroke('M235 252v45m-12-12l12 12 12-12', .8)}{label('ثم نعالج', 235, 361, 1.2, 46, 'var(--ink-green)')}</>}
    {layout === 'skills' && <>{label('خريطة مهارات التلميذ', 235, 126, .1, 25)}{chain(['ما الذي أتقنه؟', 'ما الذي يعتمد عليه؟', 'أين يحتاج إلى دعم؟'], [.3, 2.1, 4])}</>}
    {layout === 'cause' && <>{chain(['حلّ المعادلات', 'جمع الكسور', 'توحيد المقامات'], [.1, 1.2, 2.3])}{stroke('M105 353q-35 43 5 79h255q45-43-2-78z', 2.8)}{label('هنا بدأ الخلل', 700, 360, 3, 30, 'var(--ink-orange)')}</>}
    {layout === 'path' && <>{chain(['المقام المشترك', 'جمع الكسور', 'حلّ المعادلة'], [1.8, 3.2, 4.8])}{label('من الجذر… خطوة بخطوة', 700, 360, .2, 27, 'var(--ink-green)')}</>}
    {layout === 'identity' && <>{label('QED ∎', 235, 245, 3, 70)}{label('وهو المطلوب إثباته', 235, 310, 4.6, 28)}{stroke('M105 335q120 12 255-1', 5)}{label('مسار علاجي مخصّص', 235, 415, .2, 27, 'var(--ink-blue)')}</>}
    {layout === 'cta' && <><rect x="75" y="130" width="320" height="320" rx="4" fill="var(--qr-paper)"/><image href={TELEGRAM_QR_SRC} x="100" y="155" width="270" height="270"/>{label('للأولياء: سجّلوا أبناءكم', 700, 335, 2.5, 27, 'var(--ink-blue)')}{label('للتلميذ: ابدأ أول درس', 700, 389, 5.1, 27, 'var(--ink-orange)')}{label(project.qrBotHandle ?? TELEGRAM_BOT_HANDLE, 235, 486, .1, 21)}</>}
  </g>;
}