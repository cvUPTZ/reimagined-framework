import type { ReactNode } from 'react';

/**
 * SVG ports of the original canvas "visual intuition" models (js/04-visual-intuition.js).
 * Every renderer is a pure function of (params, stage, progress, elapsed) so the live
 * preview and the video export (renderToStaticMarkup → image) draw exactly the same frame.
 * Only inline SVG attributes are used: export keeps those and inlines `art-*` classes only.
 */

export type VisualStage = 'predict' | 'move' | 'observe' | 'general';
export interface VisualParams { [key: string]: unknown }
export interface LegacyVisualInput {
  model: string;
  params?: VisualParams | undefined;
  stage?: VisualStage | undefined;
  /** seconds since the scene started */
  elapsed: number;
  /** scene length in seconds */
  duration: number;
}

// colours of the original palette (r,g,b)
const TE = '46,230,197', VI = '167,139,250', AM = '255,176,32', RD = '255,77,94', WH = '240,244,250', BL = '77,163,255', PK = '255,122,198';

// local box (the host scales/translates it): 390 wide, ~400 tall, same proportions as the canvas version
const W = 390, CX = 195, BW = 360, BH = 400, CY = 200;
const TOP = CY - BH / 2 + 24, MH = BH - 100, MY = TOP + MH / 2;

const ez = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const f1 = (x: number) => Number(x.toFixed(1));
const num = (x: unknown): number | null => (x === '' || x == null || Number.isNaN(Number(x)) ? null : Number(x));
const gcdOf = (x: number, y: number): number => (y ? gcdOf(y, x % y) : x);

interface Kit {
  els: ReactNode[];
  box(x: number, y: number, w: number, h: number, c0: string, fa: number, sa: number, lw?: number): void;
  dot(x: number, y: number, r: number, c0: string, q: number): void;
  ln(x1: number, y1: number, x2: number, y2: number, c0: string, q: number, lw?: number): void;
  tx(s: string, x: number, y: number, size: number, c0: string, q: number): void;
  poly(points: Array<[number, number]>, c0: string, fa: number, sa: number, lw?: number): void;
}

function makeKit(al: number): Kit {
  const els: ReactNode[] = [];
  let n = 0;
  const C = (c0: string, q: number) => `rgba(${c0},${Math.max(0, Math.min(1, q * al))})`;
  const hasAr = (s: string) => /[\u0600-\u06FF]/.test(s);
  return {
    els,
    box: (x, y, w, h, c0, fa, sa, lw = 1.5) => { els.push(<rect key={n++} x={x} y={y} width={w} height={h} fill={fa ? C(c0, fa) : 'none'} stroke={sa ? C(c0, sa) : 'none'} strokeWidth={lw} />); },
    dot: (x, y, r, c0, q) => { els.push(<circle key={n++} cx={x} cy={y} r={r} fill={C(c0, q)} />); },
    ln: (x1, y1, x2, y2, c0, q, lw = 1.5) => { els.push(<line key={n++} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C(c0, q)} strokeWidth={lw} strokeLinecap="round" />); },
    tx: (s, x, y, size, c0, q) => {
      els.push(
        <text key={n++} x={x} y={y} fontSize={size} fontWeight={800} fontFamily="Tajawal, Cairo, sans-serif" textAnchor="middle" dominantBaseline="central" fill={C(c0, q)} stroke="rgba(8,12,18,0.85)" strokeWidth={3} paintOrder="stroke" direction={hasAr(s) ? 'rtl' : 'ltr'}>{s}</text>,
      );
    },
    poly: (pts, c0, fa, sa, lw = 1.5) => { els.push(<polygon key={n++} points={pts.map(p => p.join(',')).join(' ')} fill={fa ? C(c0, fa) : 'none'} stroke={sa ? C(c0, sa) : 'none'} strokeWidth={lw} strokeLinejoin="round" />); },
  };
}

interface Env {
  kit: Kit; a: number; b: number; c: number; params: VisualParams; st: VisualStage; p: number; pulse: number; u: number;
}
interface Result { readout?: string; formula?: string; bad?: boolean }
type Model = (e: Env) => Result;

/* ------------------------------------------------------------------ models */

const groups: Model = ({ kit, a, b, c, params, st, p, pulse }) => {
  const n = a + b, right = n * c, wrong = num(params['wr']) ?? (a + b * c);
  const d = Math.min(52, BW * 0.86 / (n + 1)), rs = Math.min(58, MH / (c + 0.4)), x0 = CX - (n - 1) * d / 2, y0 = MY - (c - 1) * rs / 2;
  const rows = st === 'move' ? Math.max(1, Math.ceil(p * c - 1e-6)) : c;
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * rs;
    kit.box(x0 - d * 0.6, y - rs * 0.4, (n - 1) * d + d * 1.2, rs * 0.8, AM, 0.06, st === 'predict' ? 0.3 : 0.45 + 0.4 * (st === 'observe' ? pulse : 1));
    for (let i = 0; i < n; i++, idx++) {
      const lit = st !== 'observe' || idx < wrong;
      kit.dot(x0 + i * d, y, d * 0.34, lit ? (i < a ? VI : TE) : RD, lit ? 0.95 : 0.3 + 0.55 * pulse);
    }
  }
  kit.tx(`كل مجموعة = ${a} + ${b} = ${n}`, CX, y0 - rs * 0.4 - 16, 13, AM, 1);
  if (st === 'observe') kit.tx(`✗ ضربنا ${b} برك في ${c}`, CX, y0 + (c - 1) * rs + rs * 0.4 + 20, 13, RD, 1);
  return {
    readout: st === 'predict' ? `${c}×(${a}+${b}) = ؟` : st === 'move' ? `${rows}×(${a}+${b}) = ${rows * n}` : st === 'observe' ? `${wrong} ≠ ${right}` : '',
    formula: `${c}×(${a}+${b}) = ${c}×${n} = ${right}`, bad: st === 'observe',
  };
};

const area: Model = ({ kit, a, b, c, st, p, pulse }) => {
  const n = a + b, sq = !c, h = sq ? n : c, U = Math.min(BW * 0.86 / n, (MH - 34) / h), x0 = CX - n * U / 2, y0 = MY - h * U / 2 + 14;
  const sp = st === 'move' ? a + Math.sin(p * 6.2832) * Math.max(0.5, Math.min(a, b) * 0.9) : a, q = n - sp;
  let res: Result;
  if (!sq) {
    kit.box(x0, y0, sp * U, h * U, VI, 0.35, 0.9); kit.box(x0 + sp * U, y0, q * U, h * U, TE, 0.35, 0.9);
    kit.tx(String(f1(sp * h)), x0 + sp * U / 2, y0 + h * U / 2, 22, WH, 1); kit.tx(String(f1(q * h)), x0 + (sp + q / 2) * U, y0 + h * U / 2, 22, WH, 1);
    res = { readout: st === 'predict' ? `${c}×(${a}+${b}) = ؟` : st === 'observe' ? `المجموع ثابت = ${n * h}` : `${f1(sp * h)} + ${f1(q * h)} = ${n * h}`, formula: `${c}×(${a}+${b}) = ${c}×${a} + ${c}×${b} = ${c * a + c * b}` };
  } else {
    const bad = st === 'observe', cr = bad ? RD : AM, ca = bad ? 0.25 + 0.4 * pulse : 0.35;
    kit.box(x0, y0, sp * U, sp * U, VI, 0.35, 0.9); kit.box(x0 + sp * U, y0, q * U, sp * U, cr, ca, 0.9);
    kit.box(x0, y0 + sp * U, sp * U, q * U, cr, ca, 0.9); kit.box(x0 + sp * U, y0 + sp * U, q * U, q * U, TE, 0.35, 0.9);
    if (sp * U > 24) kit.tx(String(f1(sp * sp)), x0 + sp * U / 2, y0 + sp * U / 2, 20, WH, 1);
    if (q * U > 24) {
      kit.tx(String(f1(q * q)), x0 + (sp + q / 2) * U, y0 + (sp + q / 2) * U, 20, WH, 1);
      kit.tx(String(f1(sp * q)), x0 + (sp + q / 2) * U, y0 + sp * U / 2, 18, WH, 1);
      kit.tx(String(f1(sp * q)), x0 + sp * U / 2, y0 + (sp + q / 2) * U, 18, WH, 1);
    }
    res = { readout: st === 'predict' ? `(${a}+${b})² = ؟` : st === 'observe' ? `${a}²+${b}² = ${a * a + b * b} ≠ ${n * n}` : `${f1(sp * sp)} + 2×${f1(sp * q)} + ${f1(q * q)} = ${n * n}`, formula: `(${a}+${b})² = ${a}² + 2×${a}×${b} + ${b}² = ${n * n}`, bad };
  }
  kit.tx(String(f1(sp)), x0 + sp * U / 2, y0 - 14, 13, VI, 1); kit.tx(String(f1(q)), x0 + (sp + q / 2) * U, y0 - 14, 13, TE, 1);
  kit.tx(String(h), x0 - 16, y0 + h * U / 2, 13, WH, 1);
  if (sq && st === 'observe') kit.tx(`✗ نسينا 2×${a}×${b} = ${2 * a * b}`, CX, y0 + h * U + 20, 13, RD, 1);
  return res;
};

const stair: Model = ({ kit, a: P, b: Q, c, st, p, pulse }) => {
  const N = 6, F = (z: number) => P * z + Q, U: number[] = [c];
  for (let i = 0; i < N; i++) U.push(Math.max(-1e3, Math.min(1e3, F(U[i] ?? 0))));
  const lf = P === 1 ? null : Q / (1 - P);
  const pts = U.concat(lf == null ? [] : [lf], [0]), lo0 = Math.min(...pts), hi0 = Math.max(...pts), pad = (hi0 - lo0) * 0.1 + 0.5, lo = lo0 - pad, hi = hi0 + pad;
  const sqz = Math.min(BW * 0.9, MH * 0.95), px0 = CX - sqz / 2, py0 = MY - sqz / 2;
  const X = (z: number) => px0 + (z - lo) / (hi - lo) * sqz, Y = (z: number) => py0 + sqz - (z - lo) / (hi - lo) * sqz;
  const n = st === 'move' ? Math.ceil(p * N - 1e-6) : st === 'predict' ? 0 : N;
  const u = (i: number) => U[i] ?? 0;
  kit.box(px0, py0, sqz, sqz, WH, 0.03, 0.4, 1);
  if (lo < 0 && hi > 0) { kit.ln(px0, Y(0), px0 + sqz, Y(0), WH, 0.35, 1); kit.ln(X(0), py0, X(0), py0 + sqz, WH, 0.35, 1); }
  const clipId = 'stair-clip';
  kit.els.push(<clipPath key="cp" id={clipId}><rect x={px0} y={py0} width={sqz} height={sqz} /></clipPath>);
  kit.ln(X(lo), Y(lo), X(hi), Y(hi), AM, 0.8, 2); kit.ln(X(lo), Y(F(lo)), X(hi), Y(F(hi)), TE, 0.95, 3);
  // staircase lines are clipped to the plot square
  const inner = makeKit(1);
  let cur: [number, number] = [u(0), 0];
  for (let i = 0; i < n; i++) {
    inner.ln(X(u(i)), Y(cur[1]), X(u(i)), Y(u(i + 1)), VI, 0.95, 2.5);
    inner.ln(X(u(i)), Y(u(i + 1)), X(u(i + 1)), Y(u(i + 1)), VI, 0.95, 2.5);
    cur = [u(i + 1), u(i + 1)];
  }
  if (st === 'observe') inner.ln(X(u(0)), Y(u(1)), X(u(0)), Y(0), RD, 0.35 + 0.6 * pulse, 4);
  kit.els.push(<g key="stairs" clipPath={`url(#${clipId})`}>{inner.els}</g>);
  kit.dot(X(u(0)), Y(0), 6, WH, 0.9); kit.dot(X(cur[0]), Y(cur[1]), 8, AM, 1);
  const showL = lf != null && lf > lo && lf < hi && (st === 'observe' || st === 'general');
  if (showL && lf != null) kit.dot(X(lf), Y(lf), 9, TE, 0.9);
  if (st === 'observe') kit.tx('✗ y=x ؟', X(u(0)) + 40, (Y(u(1)) + Y(0)) / 2, 15, RD, 1);
  kit.tx('y = x', px0 + 40, py0 + 14, 12, AM, 1); kit.tx('y = f(x)', px0 + 52, py0 + 38, 12, TE, 1);
  kit.tx('u₀', X(u(0)), Y(0) + 16, 14, WH, 0.95);
  for (let i = 1; i <= Math.min(n, 3); i++) kit.tx(`u${'₀₁₂₃'[i] ?? i}`, X(u(i)) + 18, Y(u(i)) - 14, 11, VI, 1);
  if (showL && lf != null) kit.tx(`l = ${f1(lf)}`, X(lf) - 8, Y(lf) - 22, 14, TE, 1);
  return {
    readout: st === 'predict' ? `u₀=${c}  ⇒  u₁=؟` : st === 'move' ? `u${n} = ${f1(u(n))}` : st === 'observe' ? `u₁ = ${f1(u(1))} ≠ ${f1(u(0))}` : '',
    formula: lf == null ? `u(n+1) = u(n) + ${Q}` : Math.abs(P) < 1 ? `u(n+1) = ${P}u(n)+${Q}  ⇒  u → ${f1(lf)}` : `l = f(l) = ${f1(lf)} لكن u تبتعد`, bad: st === 'observe',
  };
};

const balance: Model = ({ kit, a, b: Q, c, st, p, pulse }) => {
  const P = a || 1, R = c || (P * 4 + Q), xs = (R - Q) / P, py = MY + 70;
  const t1 = st === 'move' ? Math.min(1, p / 0.5) : 0, rem = Math.floor(t1 * Q + 0.001);
  const lq = st === 'observe' || st === 'general' ? 0 : Q - rem, rr = st === 'observe' ? R : st === 'general' ? R - Q : R - rem;
  const ang = st === 'observe' ? 0.17 * (0.6 + 0.4 * pulse) : 0, hl = 130, ex = hl * Math.cos(ang), ey = hl * Math.sin(ang), by = py - 60;
  const LX = CX - ex, LY = by - ey, RX = CX + ex, RY = by + ey;
  kit.poly([[CX, by], [CX - 26, py + 10], [CX + 26, py + 10]], WH, 0.22, 0);
  kit.ln(LX, LY, RX, RY, st === 'observe' ? RD : AM, 0.95, 5); kit.ln(LX - 62, LY, LX + 62, LY, WH, 0.9, 4); kit.ln(RX - 62, RY, RX + 62, RY, WH, 0.9, 4);
  const pos = (X: number, Y: number, i: number): [number, number] => [X - 33 + (i % 4) * 22, Y - 14 - Math.floor(i / 4) * 22];
  for (let i = 0; i < P; i++) { const [x, y] = pos(LX, LY, i); kit.box(x - 9, y - 9, 18, 18, VI, 0.8, 1); kit.tx('x', x, y, 14, WH, 1); }
  const off = Math.ceil(P / 4) * 4, hot = (st === 'general' || (st === 'move' && p > 0.55)) && Number.isInteger(xs);
  for (let j = 0; j < lq; j++) { const [x, y] = pos(LX, LY, off + j); kit.dot(x, y, 8, TE, 0.95); }
  for (let i = 0; i < rr; i++) { const [x, y] = pos(RX, RY, i); kit.dot(x, y, 8, hot && i < xs ? AM : TE, 0.95); }
  kit.tx('الطرف الأيسر', LX, py + 26, 12, WH, 1); kit.tx('الطرف الأيمن', RX, py + 26, 12, WH, 1);
  if (st === 'move' && t1 > 0 && p < 0.55) kit.tx(`− ${Q} من الطرفين`, CX, by - 84, 14, AM, 1);
  if (st === 'move' && p >= 0.55 && P > 1) kit.tx(`÷ ${P} من الطرفين`, CX, by - 84, 14, AM, 1);
  if (st === 'observe') kit.tx('⚠️ من طرف واحد فقط!', CX, by - 84, 14, RD, 1);
  return {
    readout: st === 'predict' ? `${P}x + ${Q} = ${R}` : st === 'move' ? (p > 0.85 ? `x = ${f1(xs)}` : p > 0.55 ? `${P}x = ${R - Q}` : `${P}x + ${Q - rem} = ${R - rem}`) : st === 'observe' ? 'من طرف واحد فقط؟ الميزان يميل!' : '',
    formula: `${P}x + ${Q} = ${R}  ⇒  ${P}x = ${R - Q}  ⇒  x = ${f1(xs)}`, bad: st === 'observe',
  };
};

const venn: Model = ({ kit, a, b, c, st, p, pulse }) => {
  const pa = a, pb = b, pi = c, r = BW * 0.27, dd = r * (2 - 1.5 * Math.min(1, pi / Math.min(pa, pb))), ax = CX - dd / 2, bx = CX + dd / 2, vy = MY - 34;
  const g = st === 'predict' ? 0 : st === 'move' ? p : 1;
  kit.els.push(
    <circle key="ca" cx={ax} cy={vy} r={r} fill={`rgba(${VI},0.28)`} stroke={`rgba(${VI},0.95)`} strokeWidth={2.5} />,
    <circle key="cb" cx={bx} cy={vy} r={r} fill={`rgba(${TE},0.28)`} stroke={`rgba(${TE},0.95)`} strokeWidth={2.5} />,
  );
  if (g > 0) {
    kit.els.push(
      <clipPath key="vc" id="venn-clip"><circle cx={ax} cy={vy} r={r} /></clipPath>,
      <circle key="vi" cx={bx} cy={vy} r={r} clipPath="url(#venn-clip)" fill={`rgba(${RD},${g * (0.4 + 0.3 * pulse)})`} />,
    );
  }
  kit.tx('A', ax - r * 0.55, vy, 24, WH, 0.9); kit.tx('B', bx + r * 0.55, vy, 24, WH, 0.9);
  const by = MY + r + 10, bw = BW * 0.8, bx0 = CX - bw / 2;
  const bar = (y: number, w: number, c0: string) => { kit.box(bx0, y, bw, 14, WH, 0.06, 0.4, 1); kit.box(bx0, y, bw * w, 14, c0, 0.85, 0); };
  bar(by, (pa + pb) * g, st === 'observe' ? RD : AM); bar(by + 26, (pa + pb - pi) * g, TE);
  kit.tx(`P(A) = ${a}`, ax - r * 0.45, vy - r - 14, 12, VI, 1); kit.tx(`P(B) = ${b}`, bx + r * 0.45, vy - r - 14, 12, TE, 1);
  if (g > 0) kit.tx(`A∩B = ${c}  ← مرتين!`, CX, vy + r + 18, 12, RD, 1);
  if (g > 0.2) kit.tx(`أحمر: P(A)+P(B) = ${f1(a + b)}  ·  أخضر: P(A∪B) = ${f1(a + b - c)}`, CX, by + 58, 11, WH, 1);
  return { readout: st === 'predict' ? 'P(A∪B) = ؟' : st === 'move' ? 'الجزء الأحمر محسوب مرتين' : st === 'observe' ? `${f1(pa + pb)} ≠ ${f1(pa + pb - pi)}` : '', formula: 'P(A∪B) = P(A)+P(B)−P(A∩B)', bad: st === 'observe' };
};

const gcd: Model = ({ kit, a, b, st, p, pulse }) => {
  const sqs: Array<{ x: number; y: number; s: number }> = [];
  { let x = 0, y = 0, w = a, h = b; let guard = 0;
    while (w > 0 && h > 0 && guard++ < 200) {
      if (w >= h) { const m = Math.floor(w / h); for (let i = 0; i < m; i++) sqs.push({ x: x + i * h, y, s: h }); x += m * h; w -= m * h; }
      else { const m = Math.floor(h / w); for (let i = 0; i < m; i++) sqs.push({ x, y: y + i * w, s: w }); y += m * w; h -= m * w; }
    } }
  const g = sqs[sqs.length - 1]?.s ?? 1, Um = Math.min(BW * 0.9 / a, MH * 0.7 / b), rx = CX - a * Um / 2, ry = MY - b * Um / 2;
  const n = st === 'move' ? Math.ceil(p * sqs.length - 1e-6) : st === 'predict' ? 0 : sqs.length;
  const sizes = [...new Set(sqs.map(q => q.s))], cols = [VI, TE, PK, BL];
  kit.box(rx, ry, a * Um, b * Um, WH, 0.03, 0.5, 1.5);
  sqs.forEach((q, i) => {
    if (i >= n) return;
    const fin = q.s === g && (st === 'observe' || st === 'general');
    kit.box(rx + q.x * Um, ry + q.y * Um, q.s * Um, q.s * Um, fin ? AM : cols[sizes.indexOf(q.s) % 4] ?? VI, fin ? 0.45 + 0.3 * pulse : 0.4, 0.9);
  });
  kit.tx(String(a), CX, ry - 18, 14, WH, 1); kit.tx(String(b), rx - 24, MY, 14, WH, 1);
  return { readout: st === 'predict' ? `PGCD(${a} ، ${b}) = ؟` : st === 'move' ? `${n} / ${sqs.length} مربّع` : `PGCD(${a} ، ${b}) = ${g}`, formula: `PGCD(${a} ، ${b}) = ${g}` };
};

const fraction: Model = ({ kit, a, b, c, params, st, p, pulse }) => {
  const dd = num(params['d']) ?? 3, L = b * dd / gcdOf(b, dd), R = a * L / b + c * L / dd;
  const bx0 = CX - BW * 0.42, bw = BW * 0.84, bh = 36, ys = [MY - 78, MY - 14, MY + 62] as const;
  const wn = a + c, wd = b + dd, wf = wn / wd, rf = R / L, g = st === 'move' ? Math.min(1, p * 1.3) : st === 'predict' ? 0 : 1;
  const bar = (y: number, parts: number, fill: number, c0: string) => {
    kit.box(bx0, y, bw, bh, WH, 0.04, 0.5, 1.2); kit.box(bx0, y, bw * fill / parts, bh, c0, 0.55, 0);
    for (let i = 1; i < parts; i++) kit.ln(bx0 + bw * i / parts, y, bx0 + bw * i / parts, y + bh, WH, 0.55, 1.2);
  };
  bar(ys[0], b, a, VI); bar(ys[1], dd, c, TE);
  if (g > 0) for (const y of [ys[0], ys[1]]) for (let i = 1; i < L; i++) kit.ln(bx0 + bw * i / L, y + bh * 0.62, bx0 + bw * i / L, y + bh, AM, 0.9 * g, 1);
  kit.tx(`${a}/${b}`, CX, ys[0] - 14, 17, VI, 1); kit.tx(`${c}/${dd}`, CX, ys[1] - 14, 17, TE, 1);
  kit.box(bx0, ys[2], bw, bh, WH, 0.04, 0.5, 1.2);
  kit.box(bx0, ys[2], bw * (a / b) * g, bh, VI, 0.55, 0); kit.box(bx0 + bw * (a / b) * g, ys[2], bw * (c / dd) * g, bh, TE, 0.55, 0);
  if (g > 0) for (let i = 1; i < L; i++) kit.ln(bx0 + bw * i / L, ys[2], bx0 + bw * i / L, ys[2] + bh, WH, 0.5 * g, 1);
  if (st === 'observe' || st === 'general') {
    if (st === 'observe') { kit.ln(bx0 + bw * wf, ys[2] - 8, bx0 + bw * wf, ys[2] + bh + 8, RD, 0.5 + 0.5 * pulse, 3.5); kit.tx(`${wn}/${wd} ✗`, bx0 + bw * wf, ys[2] + bh + 22, 16, RD, 1); }
    kit.ln(bx0 + bw * rf, ys[2] - 8, bx0 + bw * rf, ys[2] + bh + 8, TE, 1, 3.5);
    if (st === 'observe') kit.tx(`${R}/${L} ✓`, bx0 + bw * rf, ys[2] - 20, 16, TE, 1);
  }
  if (g > 0.3) kit.tx(`نقسّم لقطع متساوية: 1/${L}`, CX, ys[1] + bh + 24, 12, AM, 1);
  kit.tx('المجموع', bx0 + 34, ys[2] - 16, 12, WH, 1);
  const mx = Math.max(a / b, c / dd);
  return {
    readout: st === 'predict' ? `${a}/${b} + ${c}/${dd} = ؟` : st === 'move' ? (g > 0.4 ? `${a * L / b}/${L} + ${c * L / dd}/${L}` : `${a}/${b} + ${c}/${dd}`) : st === 'observe' ? (wf < mx ? `${wn}/${wd} < ${f1(mx)} !` : `${wn}/${wd} ≠ ${R}/${L}`) : `${R}/${L}`,
    formula: `${a}/${b} + ${c}/${dd} = ${a * L / b}/${L} + ${c * L / dd}/${L} = ${R}/${L}`, bad: st === 'observe',
  };
};

export const LEGACY_RENDERERS: Record<string, Model> = { groups, area, stair, balance, venn, gcd, fraction };

export const hasLegacyRenderer = (model: string) => model in LEGACY_RENDERERS;
export const renderedLegacyModels = () => Object.keys(LEGACY_RENDERERS);

/** Defaults the original used when a parameter is missing (tangent → a=1, others a=3, b=2). */
function readParams(model: string, params: VisualParams | undefined) {
  const v = params ?? {};
  return { v, a: num(v['a']) ?? (model === 'tangent' ? 1 : 3), b: num(v['b']) ?? 2, c: num(v['c']) ?? 0 };
}

export function renderLegacyVisual(input: LegacyVisualInput): ReactNode | null {
  const model = LEGACY_RENDERERS[input.model];
  if (!model) return null;
  const st = input.stage ?? 'general';
  const { v, a, b, c } = readParams(input.model, input.params);
  const dur = Math.max(0.5, input.duration);
  const u = clamp01(input.elapsed / dur);
  const p = st === 'move' ? ez(Math.min(1, u * 1.08)) : st === 'predict' ? 0 : 1;
  const pulse = 0.6 + 0.4 * Math.sin(input.elapsed * 5);
  const al = ez(clamp01(input.elapsed / 0.6));
  const kit = makeKit(al);
  const res = model({ kit, a, b, c, params: v, st, p, pulse, u });
  const bad = res.bad;
  return (
    <g data-legacy-model={input.model}>
      {kit.els}
      {res.readout ? <text x={CX} y={6} fontSize={22} fontWeight={800} fontFamily="Tajawal, Cairo, sans-serif" textAnchor="middle" fill={`rgba(${bad ? RD : WH},${al})`} stroke="rgba(8,12,18,0.85)" strokeWidth={4} paintOrder="stroke">{res.readout}</text> : null}
      {res.formula && st === 'general' ? <text x={CX} y={TOP + MH + 52} fontSize={13} fontWeight={700} fontFamily="Tajawal, Cairo, sans-serif" textAnchor="middle" fill={`rgba(${AM},${al})`}>{res.formula}</text> : null}
    </g>
  );
}

export const LEGACY_VISUAL_WIDTH = W;
