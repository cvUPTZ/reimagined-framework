import type { ReactNode } from 'react';
import type { Scene, StudioProject } from '@/lib/studio';
import { TELEGRAM_QR_SRC, TELEGRAM_BOT_HANDLE } from '@/assets/telegram-qr';
import parentPhoto from '@/assets/parent-tv-campaign.jpg?inline';

interface PromoMarketingSceneProps {
  layout: string;
  project: StudioProject;
  scene: Scene;
  width: number;
  height: number;
  elapsed: number;
  filterId: string;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3);
/** Reveal between start and start+length seconds. */
const at = (t: number, start: number, length = .6) => ease((t - start) / length);
const AR = { unicodeBidi: 'plaintext' as const };

/** Hand-drawn ink stroke that draws itself in. */
function Ink({ d, p, color = 'var(--ink-orange)', w = 5, filter }: { d: string; p: number; color?: string; w?: number; filter: string }) {
  return <path d={d} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" filter={filter}/>;
}

/** Ruled notebook sheet with a red margin, like the QED notebook campaign. */
function Sheet({ x, y, w, h, rotate = 0, children }: { x: number; y: number; w: number; h: number; rotate?: number; children?: ReactNode }) {
  const lines = [];
  for (let ly = 34; ly < h; ly += 22) lines.push(<path key={ly} d={`M0 ${ly}H${w}`} stroke="var(--paper-line)" strokeWidth="1"/>);
  return <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
    <rect x="3" y="8" width={w} height={h} rx="4" fill="var(--ink)" opacity=".12"/>
    <rect width={w} height={h} rx="4" fill="var(--paper-sheet)"/>
    {lines}
    <path d={`M${w - 34} 0V${h}`} stroke="var(--paper-margin)" strokeWidth="2"/>
    {children}
  </g>;
}

// Notebook-style parent campaign inspired by the "التشخيص قبل العلاج" video:
// warm paper, ruled sheets, hand-drawn orange/blue ink, one idea per screen.
// Photo and QR are inline assets so isolated SVG frame decoding needs no requests.
export function PromoMarketingScene({ layout, project, scene, width, height, elapsed: t, filterId }: PromoMarketingSceneProps): ReactNode {
  const wob = `url(#wob-${filterId})`;
  const isCta = layout === 'tv-grand-cta';
  const isOutro = layout === 'loop-outro';
  const headline = scene.body.split('\n');
  const intro = at(t, .1, .7);
  const supporting: Record<string, string> = {
    'problem-hook': 'قبل أن تطلب منه مجهوداً أكبر، ابحث عن سبب الخطأ.',
    'before-after': 'ابحث عن المفهوم الناقص بدل تكديس التمارين.',
    'parents-pitch': 'شرح يرى فيه الفكرة، لا يحفظها فقط.',
    'students-pitch': 'خطأ واحد مفهوم… يغيّر طريقة الحل كلها.',
    'four-pillars': 'التشخيص قبل العلاج.',
    'curriculum-mastery': 'رياضيات بصرية للرابعة متوسط والثالثة ثانوي.',
    'tv-grand-cta': 'افتح كاميرا هاتفك وامسح الرمز.',
  };
  const headlineX = 900;
  const text = <g opacity={intro} transform={`translate(0 ${10 * (1 - intro)})`}>
    <text x={headlineX} y="150" textAnchor="end" fontSize="44" fontWeight="700" fill="var(--ink)" style={AR}>
      {headline.map((line, i) => <tspan key={i} x={headlineX} dy={i ? 58 : 0}>{line}</tspan>)}
    </text>
    <Ink filter={wob} p={at(t, .9, .7)} d={`M${headlineX} ${150 + 58 * (headline.length - 1) + 20}q-120 7-250 0`} w={5}/>
    {supporting[layout] && <text x={headlineX} y={150 + 58 * (headline.length - 1) + 64} textAnchor="end" fontSize="21" fill="var(--ink)" opacity={.75 * at(t, 1.2)} style={AR}>{supporting[layout]}</text>}
  </g>;

  return <g fontFamily="Tajawal, sans-serif" transform={`scale(${width / 960} ${height / 540})`}>
    <defs>
      <filter id={`wob-${filterId}`}><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
      <pattern id={`grid-${filterId}`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="var(--ink)" strokeOpacity=".06"/></pattern>
      <clipPath id={`photo-${filterId}`}><rect width="250" height="190"/></clipPath>
    </defs>
    <rect width="960" height="540" fill="var(--paper)"/>
    <rect width="960" height="540" fill={`url(#grid-${filterId})`}/>

    {!isOutro && <text x="48" y="54" fontFamily="Space Grotesk" fontSize="24" fontWeight="700" fill="var(--ink)">QED<tspan fill="var(--ink-orange)"> ■</tspan></text>}

    {layout === 'problem-hook' && <>
      {text}
      <Sheet x={70} y={110} w={320} h={360} rotate={-4}>
        <text x="270" y="40" textAnchor="end" fontSize="17" fontWeight="700" fill="var(--ink)" style={AR}>اختبار الرياضيات</text>
        {[110, 160, 210, 260, 310].map((y, i) => <Ink key={y} filter={wob} color="var(--ink-blue)" w={2.5} p={at(t, .3 + i * .15, .5)} d={`M250 ${y}q-50 -6-100 0t-100 0`}/>)}
        <g opacity={at(t, 1.6, .2)}><text x="105" y="128" textAnchor="middle" fontFamily="Space Grotesk" fontSize="54" fontWeight="700" fill="var(--ink-orange)" transform="rotate(-8 105 110)">8/20</text></g>
        <Ink filter={wob} p={at(t, 1.8, .8)} d="M175 95c-20-40-150-40-160 5s110 60 165 15c10-12 0-30-30-35"/>
      </Sheet>
    </>}

    {layout === 'before-after' && <>
      {text}
      {Array.from({ length: 12 }, (_, i) => {
        const x = 70 + (i % 4) * 58, y = 150 + Math.floor(i / 4) * 72;
        return <g key={i} opacity={at(t, .3 + i * .08, .3)}>
          <rect x={x} y={y} width="46" height="58" rx="3" fill="var(--paper-sheet)" stroke="var(--paper-line)"/>
          <path d={`M${x + 8} ${y + 16}h30M${x + 8} ${y + 26}h22`} stroke="var(--paper-line)" strokeWidth="2"/>
          <Ink filter={wob} w={3} p={at(t, 1.4 + i * .05, .3)} d={`M${x + 18} ${y + 36}l14 14m0-14l-14 14`}/>
        </g>;
      })}
      <text x="155" y="390" textAnchor="middle" fontSize="20" fill="var(--ink)" opacity={at(t, 2.2)} style={AR}>12 تمريناً… والخطأ نفسه</text>
      <Ink filter={wob} color="var(--ink-blue)" p={at(t, 3, .6)} d="M300 270c30-10 60-10 90 0m-14-12l14 12-16 9"/>
      <Sheet x={410} y={330} w={170} h={150} rotate={3}>
        <text x="120" y="50" textAnchor="end" fontSize="16" fill="var(--ink)" opacity={at(t, 3.5)} style={AR}>المفهوم الناقص</text>
        <Ink filter={wob} color="var(--ink-green)" w={6} p={at(t, 4, .6)} d="M45 95l22 22 45-50"/>
      </Sheet>
    </>}

    {layout === 'parents-pitch' && <>
      {text}
      <g transform="translate(85 130) rotate(-3 135 120)" opacity={at(t, .3, .6)}>
        <rect x="-4" y="6" width="278" height="250" fill="var(--ink)" opacity=".12"/>
        <rect width="270" height="246" fill="var(--paper-sheet)"/>
        <g transform="translate(10 10)" clipPath={`url(#photo-${filterId})`}><image href={parentPhoto} width="250" height="190" preserveAspectRatio="xMidYMid slice"/></g>
        <text x="135" y="230" textAnchor="middle" fontSize="18" fill="var(--ink-blue)" style={AR}>«فهمت!»</text>
        <rect x="100" y="-12" width="70" height="24" fill="var(--ink-orange)" opacity=".35" transform="rotate(4 135 0)"/>
      </g>
      <Ink filter={wob} p={at(t, 1.6, .9)} d="M380 220c-20-40-50-40-60 0"/>
    </>}

    {layout === 'students-pitch' && <>
      {text}
      <Sheet x={70} y={110} w={340} h={360} rotate={-2}>
        <text x="290" y="44" textAnchor="end" fontSize="17" fontWeight="700" fill="var(--ink)" style={AR}>حلّ المعادلة:</text>
        {['2x + 6 = 14', '2x = 14 + 6', '2x = 8', 'x = 4'].map((line, i) => <text key={line} x="170" y={100 + i * 62} textAnchor="middle" fontFamily="Space Grotesk" fontSize="30" fontWeight="700" fill={i === 1 ? 'var(--ink-orange)' : 'var(--ink-blue)'} opacity={i < 2 ? at(t, .4 + i * .5) : at(t, 3 + (i - 2) * .6)}>{line}</text>)}
        <Ink filter={wob} p={at(t, 1.8, .6)} d="M80 140c20 30 160 30 180 0c-10-30-160-35-180-5"/>
        <text x="300" y="175" textAnchor="end" fontSize="14" fill="var(--ink-orange)" opacity={at(t, 2.4)} style={AR}>النقل: + تصبح −</text>
        <Ink filter={wob} color="var(--ink-green)" w={5} p={at(t, 4.2, .5)} d="M250 290l14 14 28-32"/>
      </Sheet>
    </>}

    {layout === 'four-pillars' && <>
      {text}
      {[['يرى الفكرة', 'فيديو بصري'], ['يفهم الخطأ', 'تشخيص السبب'], ['يتدرّب', 'حل خطوة بخطوة']].map(([title, sub], i) => {
        const x = 760 - i * 290, r = at(t, .8 + i * .9, .5);
        return <g key={i} opacity={r}>
          <rect x={x - 105} y="320" width="210" height="96" rx="12" fill="var(--paper-sheet)" stroke={i === 1 ? 'var(--ink-orange)' : 'var(--ink-blue)'} strokeWidth="2.5" filter={wob}/>
          <text x={x} y="360" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--ink)" style={AR}>{title}</text>
          <text x={x} y="394" textAnchor="middle" fontSize="17" fill="var(--ink)" opacity=".65" style={AR}>{sub}</text>
          {i < 2 && <Ink filter={wob} color="var(--ink-blue)" w={3} p={at(t, 1.3 + i * .9, .5)} d={`M${x - 115} 368h-60m12-10l-12 10 12 10`}/>}
        </g>;
      })}
    </>}

    {layout === 'curriculum-mastery' && <>
      {text}
      <Sheet x={80} y={140} w={330} h={280} rotate={-3}>
        <text x="150" y="130" textAnchor="middle" fontFamily="Space Grotesk" fontSize="56" fontWeight="700" fill="var(--ink-blue)" opacity={at(t, .5)}>BEM</text>
        <text x="150" y="220" textAnchor="middle" fontFamily="Space Grotesk" fontSize="56" fontWeight="700" fill="var(--ink-blue)" opacity={at(t, 1)}>BAC</text>
        <Ink filter={wob} p={at(t, 1.8, .8)} d="M70 75c40-30 170-25 175 30s-150 55-175 15c-12-25 10-45 40-50"/>
      </Sheet>
    </>}

    {isCta && <>
      {text}
      <g transform="translate(80 110) rotate(-2 140 150)" opacity={at(t, .4, .6)}>
        <rect x="-4" y="8" width="288" height="272" rx="6" fill="var(--ink)" opacity=".12"/>
        <rect width="280" height="272" rx="6" fill="var(--qr-paper)"/>
        <image href={TELEGRAM_QR_SRC} x="24" y="20" width="232" height="232"/>
        <rect x="105" y="-12" width="70" height="24" fill="var(--ink-orange)" opacity=".35"/>
      </g>
      <Ink filter={wob} color="var(--ink-blue)" w={4} p={at(t, 1.6, .8)} d="M560 360c-60 30-120 20-170 -10m14 -4l-14 4 6 14"/>
      <g opacity={at(t, 2.2)}>
        <rect x="610" y="380" width="290" height="58" rx="29" fill="var(--ink-orange)"/>
        <text x="755" y="417" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--paper-sheet)" style={AR}>امسح الرمز · تيليجرام</text>
      </g>
    </>}

    {isOutro && <g opacity={intro}>
      <text x="480" y="210" textAnchor="middle" fontFamily="Space Grotesk" fontSize="88" fontWeight="700" fill="var(--ink)">QED<tspan fill="var(--ink-orange)" dx="8" fontSize="54">■</tspan></text>
      <text x="480" y="285" textAnchor="middle" fontSize="40" fontWeight="700" fill="var(--ink)" style={AR}>{headline[0]}</text>
      <Ink filter={wob} p={at(t, .9, .7)} d="M600 305q-120 8-240 0"/>
      <g opacity={at(t, 1.4)}>
        <rect x="500" y="355" width="280" height="56" rx="28" fill="var(--ink-orange)"/>
        <text x="640" y="391" textAnchor="middle" fontSize="21" fontWeight="700" fill="var(--paper-sheet)" style={AR}>للأولياء: اكتشفوا QED</text>
        <rect x="180" y="355" width="280" height="56" rx="28" fill="none" stroke="var(--ink)" strokeWidth="2.5"/>
        <text x="320" y="391" textAnchor="middle" fontSize="21" fontWeight="700" fill="var(--ink)" style={AR}>للتلاميذ: ابدأ أول درس</text>
      </g>
      <text x="480" y="470" textAnchor="middle" fontSize="19" fill="var(--ink)" opacity={.6 * at(t, 2)} style={AR}>التشخيص قبل العلاج · {project.qrBotHandle ?? TELEGRAM_BOT_HANDLE}</text>
    </g>}
  </g>;
}
