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

// Photo and QR are inline assets: SVG frame decoding must not depend on external requests.
export function PromoMarketingScene({ layout, project, scene, width, height, elapsed, filterId }: PromoMarketingSceneProps): ReactNode {
  const progress = Math.min(1, Math.max(0, elapsed / .8));
  const isCta = layout === 'tv-grand-cta' || layout === 'loop-outro';
  const isMethod = layout === 'four-pillars';
  const headline = scene.body.split('\n');
  const supporting: Record<string, string[]> = {
    'problem-hook': ['قبل أن تطلب منه مجهوداً أكبر،', 'جرّب معه طريقة أوضح.'],
    'before-after': ['شرح بصري · أخطاء شائعة · حل خطوة بخطوة'],
    'parents-pitch': ['شرح يرى فيه الفكرة، لا يحفظها فقط.'],
    'students-pitch': ['فكرة أوضح. بداية أقل غموضاً.'],
    'four-pillars': ['اكتشفوا الطريقة معاً.'],
    'curriculum-mastery': ['رياضيات بصرية للرابعة متوسط والثالثة ثانوي.'],
    'tv-grand-cta': ['افتح كاميرا هاتفك وامسح الرمز.', 'انتقل إلى QED على تيليجرام.'],
    'loop-outro': ['اكتشف الطريقة مع ابنك عبر تيليجرام.'],
  };
  return <g fontFamily="Tajawal, sans-serif" transform={`scale(${width / 960} ${height / 540})`}>
    <defs>
      <linearGradient id={`parent-shade-${filterId}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--background)" stopOpacity="0.05"/>
        <stop offset=".43" stopColor="var(--background)" stopOpacity=".35"/>
        <stop offset=".62" stopColor="var(--background)" stopOpacity=".96"/>
        <stop offset="1" stopColor="var(--background)"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="var(--background)"/>
    {!isMethod && !isCta && <>
      <image href={parentPhoto} width="960" height="540" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="540" fill={`url(#parent-shade-${filterId})`}/>
    </>}
    <text x="48" y="52" fontFamily="Space Grotesk" fontSize="23" fontWeight="700" fill="var(--foreground)">QED<tspan fill="var(--primary)"> ∎</tspan></text>
    <text x="912" y="52" textAnchor="end" fontSize="17" fill="var(--primary)" style={{ unicodeBidi: 'plaintext' }}>للأولياء الذين يريدون فهماً أوضح لأبنائهم</text>
    <g opacity={progress} transform={`translate(0 ${12 * (1 - progress)})`}>
      <text x="906" y={isMethod ? 140 : 185} textAnchor="end" fontSize={isMethod ? 42 : 46} fontWeight="700" fill="var(--foreground)" style={{ unicodeBidi: 'plaintext' }}>
        {headline.map((line, index) => <tspan key={index} x="906" dy={index ? 61 : 0}>{line}</tspan>)}
      </text>
      {(supporting[layout] ?? []).map((line, index) => <text key={line} x="906" y={(isMethod ? 235 : 298) + index * 30} textAnchor="end" fontSize="20" fill="var(--foreground)" opacity=".8" style={{ unicodeBidi: 'plaintext' }}>{line}</text>)}
      {layout === 'curriculum-mastery' && <text x="906" y="378" textAnchor="end" fontFamily="Space Grotesk" fontSize="30" fontWeight="700" fill="var(--gold)">BEM · BAC</text>}
      {isMethod && <g>
        {[['يرى الفكرة', 'فيديوهات بصرية'], ['يفهم الخطأ', 'شرح الأخطاء الشائعة'], ['يتدرّب على الحل', 'تمارين خطوة بخطوة']].map(([title, subtitle], index) => {
          const x = 770 - index * 290;
          const reveal = Math.min(1, Math.max(0, (elapsed - .6 - index * .65) / .5));
          return <g key={index} opacity={reveal}>
            <text x={x} y="320" textAnchor="middle" fontFamily="Space Grotesk" fontSize="24" fill="var(--gold)">0{index + 1}</text>
            <path d={`M${x - 110} 344H${x + 110}`} stroke="var(--border-strong)"/>
            <text x={x} y="384" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--foreground)" style={{ unicodeBidi: 'plaintext' }}>{title}</text>
            <text x={x} y="420" textAnchor="middle" fontSize="18" fill="var(--muted-foreground)" style={{ unicodeBidi: 'plaintext' }}>{subtitle}</text>
          </g>;
        })}
      </g>}
      {isCta && <g>
        <rect x="60" y="124" width="264" height="264" rx="4" fill="var(--qr-paper)"/>
        <image href={TELEGRAM_QR_SRC} x="76" y="140" width="232" height="232"/>
        <text x="192" y="424" textAnchor="middle" fontFamily="Space Grotesk" fontSize="21" fill="var(--primary)">{project.qrBotHandle ?? TELEGRAM_BOT_HANDLE}</text>
        <text x="192" y="456" textAnchor="middle" fontSize="18" fill="var(--foreground)" style={{ unicodeBidi: 'plaintext' }}>امسح الرمز واكتشف QED</text>
      </g>}
    </g>
    <path d="M48 482H912" stroke="var(--border-strong)"/>
    <text x="48" y="516" fontFamily="Space Grotesk" fontSize="15" fill="var(--muted-foreground)">BEM / BAC</text>
    <text x="912" y="516" textAnchor="end" fontSize="19" fontWeight="700" fill="var(--primary)" style={{ unicodeBidi: 'plaintext' }}>{isCta ? 'QED — الرياضيات بصورة أوضح' : 'اكتشف QED مع ابنك · امسح الرمز في نهاية العرض'}</text>
  </g>;
}
