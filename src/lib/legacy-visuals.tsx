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

// 3Blue1Brown vibrant luminous palette (r,g,b)
const TE = '56,189,248'; // 3B1B Cyan / Sky Blue
const VI = '129,140,248'; // 3B1B Indigo / Purple
const AM = '251,191,36'; // 3B1B Gold / Amber
const RD = '248,113,113'; // 3B1B Soft Coral / Red
const WH = '248,250,252'; // Crisp White
const BL = '96,165,250'; // Bright Blue
const PK = '244,114,182'; // Rose Pink
const EM = '52,211,153'; // Emerald Green

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
    box: (x, y, w, h, c0, fa, sa, lw = 1.8) => {
      els.push(
        <rect
          key={n++}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={6}
          fill={fa ? C(c0, fa) : 'none'}
          stroke={sa ? C(c0, sa) : 'none'}
          strokeWidth={lw}
        />,
      );
    },
    dot: (x, y, r, c0, q) => {
      els.push(
        <circle
          key={n++}
          cx={x}
          cy={y}
          r={r}
          fill={C(c0, q)}
          stroke={C(c0, Math.min(1, q * 1.2))}
          strokeWidth={1.5}
        />,
      );
    },
    ln: (x1, y1, x2, y2, c0, q, lw = 2) => {
      els.push(
        <line
          key={n++}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={C(c0, q)}
          strokeWidth={lw}
          strokeLinecap="round"
        />,
      );
    },
    tx: (s, x, y, size, c0, q) => {
      els.push(
        <text
          key={n++}
          x={x}
          y={y}
          fontSize={size}
          fontWeight={800}
          fontFamily="Tajawal, Cairo, sans-serif"
          textAnchor="middle"
          dominantBaseline="central"
          fill={C(c0, q)}
          stroke="rgba(8,12,18,0.92)"
          strokeWidth={3.5}
          paintOrder="stroke"
          direction={hasAr(s) ? 'rtl' : 'ltr'}
        >
          {s}
        </text>,
      );
    },
    poly: (pts, c0, fa, sa, lw = 2) => {
      els.push(
        <polygon
          key={n++}
          points={pts.map(p => p.join(',')).join(' ')}
          fill={fa ? C(c0, fa) : 'none'}
          stroke={sa ? C(c0, sa) : 'none'}
          strokeWidth={lw}
          strokeLinejoin="round"
        />,
      );
    },
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

/** Shared plot frame: axes + a sampled curve, returns pixel mappers. */
function plotFrame(kit: Kit, f: (x: number) => number, xLo: number, xHi: number, curveColor: string, curveQ: number) {
  const sqz = Math.min(BW * 0.9, MH * 0.92), px0 = CX - sqz / 2, py0 = MY - sqz / 2;
  const ys: number[] = [];
  for (let i = 0; i <= 60; i++) { const y = f(xLo + (xHi - xLo) * i / 60); if (Number.isFinite(y) && Math.abs(y) < 1e4) ys.push(y); }
  const yLo = Math.min(...ys, 0), yHi = Math.max(...ys, 0), pad = (yHi - yLo) * 0.12 + 0.4;
  const X = (x: number) => px0 + (x - xLo) / (xHi - xLo) * sqz;
  const Y = (y: number) => py0 + sqz - (y - (yLo - pad)) / (yHi - yLo + 2 * pad) * sqz;
  kit.box(px0, py0, sqz, sqz, WH, 0.03, 0.4, 1);
  if (yLo < 0 && yHi > 0) kit.ln(px0, Y(0), px0 + sqz, Y(0), WH, 0.35, 1);
  if (xLo < 0 && xHi > 0) kit.ln(X(0), py0, X(0), py0 + sqz, WH, 0.35, 1);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 60; i++) { const x = xLo + (xHi - xLo) * i / 60, y = f(x); if (Number.isFinite(y) && Math.abs(y) < 1e4) pts.push([X(x), Y(y)]); }
  if (pts.length > 1) kit.poly(pts, curveColor, 0, curveQ, 3);
  return { X, Y, px0, py0, sqz };
}

/** Secant → tangent zoom on y = x²/4 at x₀ = a (3B1B derivative classic). */
const tangent: Model = ({ kit, a, st, p, pulse }) => {
  const f = (x: number) => x * x / 4, df = (x: number) => x / 2;
  const x0 = Math.max(0.5, Math.min(3, a || 1));
  const { X, Y } = plotFrame(kit, f, -3.6, 3.6, VI, 0.95);
  const h = st === 'move' ? 2.4 * (1 - p) + 0.12 : st === 'predict' ? 2.4 : 0.0001;
  const x1 = x0 + h;
  const slope = st === 'observe' || st === 'general' || h < 0.2 ? df(x0) : (f(x1) - f(x0)) / h;
  const line = (m: number, through: number, c0: string, q: number, lw: number) => {
    const yA = f(through) + m * (-3.4 - through), yB = f(through) + m * (3.4 - through);
    kit.ln(X(-3.4), Y(yA), X(3.4), Y(yB), c0, q, lw);
  };
  if (st === 'predict' || st === 'move') { line(slope, x0, TE, 0.9, 2.5); kit.dot(X(x1), Y(f(x1)), 7, TE, 0.95); }
  line(df(x0), x0, AM, st === 'predict' ? 0.25 : 0.95, 2.5);
  kit.dot(X(x0), Y(f(x0)), 8, AM, 1);
  if (st === 'observe') kit.tx('الميل = f′(x₀)', X(x0) + 66, Y(f(x0)) - 26, 13, AM, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? `الميل عند x=${f1(x0)} ؟` : st === 'move' ? `h = ${f1(h)}  ⇒  ميل ≈ ${f1(slope)}` : `f′(${f1(x0)}) = ${f1(df(x0))}`,
    formula: `f′(x₀) = lim(h→0) (f(x₀+h) − f(x₀)) / h`,
  };
};

/** Riemann rectangles converging to the area under y = √x + 1. */
const riemann: Model = ({ kit, a, st, p }) => {
  const f = (x: number) => Math.sqrt(Math.max(0, x)) + 1, lo = 0, hi = 4;
  const exact = 2 / 3 * Math.pow(hi, 1.5) + hi;
  const n = st === 'move' ? 2 + Math.round(p * 14) : st === 'predict' ? 4 : 16;
  const { X, Y, px0, sqz } = plotFrame(kit, f, lo - 0.3, hi + 0.3, VI, 0.95);
  const dx = (hi - lo) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = lo + i * dx, hgt = f(x);
    sum += hgt * dx;
    kit.box(X(x), Y(hgt), Math.max(1, X(x + dx) - X(x) - 1), Y(0) - Y(hgt), TE, 0.3, 0.85, 1.2);
  }
  kit.ln(px0, Y(0), px0 + sqz, Y(0), WH, 0.4, 1);
  return {
    readout: st === 'predict' ? 'المساحة تحت المنحنى ؟' : st === 'move' ? `${n} مستطيل  ⇒  Σ ≈ ${f1(sum)}` : `∫ = ${f1(exact)}`,
    formula: `lim(n→∞) Σ f(xᵢ)·Δx = ∫₀⁴ f = ${f1(exact)}`,
  };
};

/** Number line: tick marks, a marker sliding from a to b, and the gap error at observe. */
const numline: Model = ({ kit, a, b, st, p, pulse }) => {
  const lo = Math.min(0, a, b) - 1, hi = Math.max(a, b, 10) + 1;
  const y = MY + 20, x0 = CX - BW * 0.42, x1 = CX + BW * 0.42;
  const X = (z: number) => x0 + (z - lo) / (hi - lo) * (x1 - x0);
  kit.ln(x0, y, x1, y, WH, 0.8, 2.5);
  kit.poly([[x1, y], [x1 - 10, y - 5], [x1 - 10, y + 5]], WH, 0.8, 0);
  for (let z = Math.ceil(lo); z <= hi; z++) {
    kit.ln(X(z), y - 7, X(z), y + 7, WH, 0.6, 1.5);
    kit.tx(String(z), X(z), y + 22, 12, WH, 0.8);
  }
  const pos = st === 'move' ? a + (b - a) * p : st === 'predict' ? a : b;
  kit.ln(X(a), y - 26, X(a), y - 12, VI, 0.9, 2.5);
  kit.dot(X(pos), y, 9, AM, 1);
  kit.tx(f1(pos) === pos ? String(pos) : String(f1(pos)), X(pos), y - 22, 14, AM, 1);
  if (st === 'observe') {
    kit.ln(X(a), y - 44, X(b), y - 44, RD, 0.4 + 0.5 * pulse, 3);
    kit.tx(`الفرق = ${f1(Math.abs(b - a))}`, (X(a) + X(b)) / 2, y - 58, 13, RD, 1);
  }
  return {
    readout: st === 'predict' ? `من ${a} إلى ${b} ؟` : st === 'move' ? `الموضع = ${f1(pos)}` : st === 'observe' ? `المسافة = ${f1(Math.abs(b - a))}` : '',
    formula: `|${b} − ${a}| = ${f1(Math.abs(b - a))}`,
  };
};

/** Discriminant: parabola y = x² + bx + c, roots appear only when Δ ≥ 0. */
const disc: Model = ({ kit, b, c, st, pulse }) => {
  const f = (x: number) => x * x + b * x + c;
  const D = b * b - 4 * c;
  const vx = -b / 2, span = Math.max(3.5, Math.abs(vx) + 3);
  const { X, Y } = plotFrame(kit, f, vx - span, vx + span, VI, 0.95);
  const bad = st === 'observe';
  if (D >= 0) {
    const r1 = (-b - Math.sqrt(D)) / 2, r2 = (-b + Math.sqrt(D)) / 2;
    const q = st === 'predict' ? 0.3 : 1;
    kit.dot(X(r1), Y(0), 8, bad ? RD : TE, q); kit.dot(X(r2), Y(0), 8, bad ? RD : TE, q);
    if (st !== 'predict') { kit.tx(f1(r1) === r1 ? String(r1) : String(f1(r1)), X(r1), Y(0) + 20, 12, TE, 1); kit.tx(f1(r2) === r2 ? String(r2) : String(f1(r2)), X(r2), Y(0) + 20, 12, TE, 1); }
  } else if (st !== 'predict') {
    kit.tx('لا يقطع المحور!', CX, MY - MH * 0.32, 14, RD, 0.6 + 0.4 * pulse);
  }
  const dc = D > 0 ? TE : D === 0 ? AM : RD;
  kit.tx(`Δ = ${b}² − 4×1×${c} = ${D}`, CX, TOP + 26, 15, dc, 1);
  return {
    readout: st === 'predict' ? 'كم حلّاً للمعادلة ؟' : D > 0 ? `Δ = ${D} > 0  ⇒  حلّان` : D === 0 ? `Δ = 0  ⇒  حلّ مزدوج` : `Δ = ${D} < 0  ⇒  لا حلّ`,
    formula: `Δ = b² − 4ac = ${D}`, bad: D < 0,
  };
};

/** Square root: a square of area a, its side is √a. */
const sqrtModel: Model = ({ kit, a, st, p, pulse }) => {
  const area2 = Math.max(1, a * a || 9), side = Math.sqrt(area2);
  const U = Math.min(BW * 0.62, MH * 0.66) / side, s = side * U, x0 = CX - s / 2, y0 = MY - s / 2 + 10;
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  kit.box(x0, y0, s, s, VI, 0.22 + 0.1 * g, 0.9, 2);
  const gridN = Math.round(side);
  if (Number.isInteger(side) && gridN <= 12) for (let i = 1; i < gridN; i++) {
    kit.ln(x0 + i * U, y0, x0 + i * U, y0 + s, WH, 0.18 * g, 1);
    kit.ln(x0, y0 + i * U, x0 + s, y0 + i * U, WH, 0.18 * g, 1);
  }
  kit.ln(x0, y0 + s + 12, x0 + s, y0 + s + 12, AM, 0.95, 2.5);
  kit.tx(`√${area2}${Number.isInteger(side) ? ` = ${side}` : ` ≈ ${f1(side)}`}`, CX, y0 + s + 30, 15, AM, 1);
  kit.tx(`المساحة = ${area2}`, CX, y0 + s / 2, 18, WH, 0.9);
  if (st === 'observe' && !Number.isInteger(side)) kit.tx('ليس عدداً صحيحاً!', CX, y0 - 22, 14, RD, 0.5 + 0.5 * pulse);
  return {
    readout: st === 'predict' ? `√${area2} = ؟` : st === 'move' ? `الضلع × نفسه = ${area2}` : `√${area2} ${Number.isInteger(side) ? `= ${side}` : `≈ ${f1(side)}`}`,
    formula: `√${area2} × √${area2} = ${area2}`,
  };
};

/** Difference of squares: a² − b² rearranged into the rectangle (a−b)(a+b). */
const diffsq: Model = ({ kit, a, b, st, p }) => {
  const A = Math.max(2, a), B = Math.max(1, Math.min(b, A - 1));
  const U = Math.min(BW * 0.6, MH * 0.6) / A, s = A * U, x0 = CX - s / 2, y0 = MY - s / 2 + 8;
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  kit.box(x0, y0, s, s, VI, 0.25, 0.9, 2);
  kit.box(x0 + s - B * U, y0, B * U, B * U, RD, 0.45, 0.95, 1.5);
  // the strip that slides to the bottom to form the rectangle
  const stripW = (A - B) * U, stripH = B * U;
  const sx = x0, sy0 = y0 + B * U, sy1 = y0 + s; // from left-middle to bottom
  const sy = sy0 + (sy1 - sy0) * g;
  kit.box(sx, sy - stripH + (stripH) * 0, stripW, stripH, TE, 0.4, 0.95, 1.5);
  kit.tx(`${A}²`, x0 + s / 2, y0 + s / 2, 20, WH, 0.9);
  kit.tx(`−${B}²`, x0 + s - B * U / 2, y0 + B * U / 2, 15, RD, 1);
  if (g > 0.5) kit.tx(`(${A}−${B})×(${A}+${B}) = ${(A - B) * (A + B)}`, CX, y0 + s + 26, 14, AM, g);
  return {
    readout: st === 'predict' ? `${A}² − ${B}² = ؟` : st === 'move' ? 'نحرّك الشريط…' : `${A}² − ${B}² = ${A * A - B * B}`,
    formula: `a² − b² = (a − b)(a + b) = ${A - B}×${A + B}`,
  };
};

/** Thales: right angle inscribed in a semicircle, C sliding along the arc. */
const thales: Model = ({ kit, st, p, pulse }) => {
  const r = Math.min(BW, MH) * 0.36, cy = MY + 30, ax = CX - r, bx = CX + r;
  const t = st === 'move' ? 0.25 + 0.5 * p : 0.55;
  const cxp = CX + r * Math.cos(Math.PI * (1 - t)), cyp = cy - r * Math.sin(Math.PI * (1 - t));
  kit.els.push(<path key="semi" d={`M ${ax} ${cy} A ${r} ${r} 0 0 1 ${bx} ${cy}`} fill="none" stroke={`rgba(${VI},0.95)`} strokeWidth={3} />);
  kit.ln(ax, cy, bx, cy, WH, 0.8, 2.5);
  kit.ln(ax, cy, cxp, cyp, TE, 0.95, 2.5);
  kit.ln(bx, cy, cxp, cyp, AM, 0.95, 2.5);
  kit.dot(ax, cy, 6, WH, 0.9); kit.dot(bx, cy, 6, WH, 0.9); kit.dot(cxp, cyp, 8, TE, 1);
  // right-angle marker at C
  const v1 = Math.atan2(cy - cyp, ax - cxp), v2 = Math.atan2(cy - cyp, bx - cxp), m = 14;
  const p1: [number, number] = [cxp + m * Math.cos(v1), cyp + m * Math.sin(v1)];
  const p2: [number, number] = [cxp + m * Math.cos(v2), cyp + m * Math.sin(v2)];
  const p3: [number, number] = [p1[0] + p2[0] - cxp, p1[1] + p2[1] - cyp];
  kit.poly([p1, p3, p2], st === 'observe' ? RD : AM, 0, 0.9, 2);
  kit.tx('A', ax - 16, cy + 6, 14, WH, 1); kit.tx('B', bx + 16, cy + 6, 14, WH, 1); kit.tx('C', cxp, cyp - 20, 14, TE, 1);
  if (st === 'observe') kit.tx('90° دائماً!', CX, cy - r - 16, 15, AM, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? 'ما قياس الزاوية C ؟' : st === 'move' ? 'حرّك C على القوس…' : '∠ACB = 90°',
    formula: 'الزاوية المحيطية بالنصف قطر = 90°',
  };
};

/** Function curve: parabola with vertex, variation arrows, and a limit point. */
const curveModel: Model = ({ kit, a, b, c, st, p, pulse }) => {
  const f = (x: number) => a * x * x / 4 + b * x / 2 + c;
  const vx = a ? -b / a : 0, span = 3.5;
  const { X, Y } = plotFrame(kit, f, vx - span, vx + span, VI, 0.95);
  const vy = f(vx);
  if (st !== 'predict') {
    kit.dot(X(vx), Y(vy), 8, AM, 1);
    kit.tx(`(${f1(vx)} ، ${f1(vy)})`, X(vx), Y(vy) - 20, 12, AM, 1);
  }
  // variation arrows along the curve
  const dir = a >= 0 ? 1 : -1;
  const ar = (x1: number, x2: number, up: boolean, q: number) => {
    const y1 = f(x1), y2 = f(x2);
    kit.ln(X(x1), Y(y1), X(x2), Y(y2), TE, q, 2);
    const ang = Math.atan2(Y(y2) - Y(y1), X(x2) - X(x1));
    kit.poly([[X(x2), Y(y2)], [X(x2) - 9 * Math.cos(ang - 0.4), Y(y2) - 9 * Math.sin(ang - 0.4)], [X(x2) - 9 * Math.cos(ang + 0.4), Y(y2) - 9 * Math.sin(ang + 0.4)]], TE, q, 0);
    void up;
  };
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  if (g > 0) { ar(vx - 2.6 * dir * 0 - 2.6, vx, false, 0.9 * g); ar(vx, vx + 2.6, true, 0.9 * g); }
  const mx = vx + (st === 'move' ? -2.6 + 5.2 * p : 2);
  kit.dot(X(mx), Y(f(mx)), 7, WH, 0.9);
  if (st === 'observe') kit.tx(a >= 0 ? 'تناقص ثم تزايد' : 'تزايد ثم تناقص', CX, TOP + 26, 14, TE, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? 'ما شكل المنحنى ؟' : st === 'move' ? `x = ${f1(mx)}  ⇒  f(x) = ${f1(f(mx))}` : `القمة عند x = ${f1(vx)}`,
    formula: `f(x) = ${a ? `${a}x²` : ''}${b ? ` + ${b}x` : ''}${c ? ` + ${c}` : ''}`.replace(/\+ -/g, '− '),
  };
};

/** Inverse variation: hyperbola y = a/x with dashed asymptotes. */
const inverseModel: Model = ({ kit, a, st, p, pulse }) => {
  const k = a || 1, f = (x: number) => k / x;
  const { X, Y, px0, py0, sqz } = plotFrame(kit, f, -4, 4, VI, 0);
  // two branches, split around the asymptote
  for (const [lo, hi] of [[-4, -0.15], [0.15, 4]] as const) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 40; i++) { const x = lo + (hi - lo) * i / 40; pts.push([X(x), Y(f(x))]); }
    kit.poly(pts, VI, 0, 0.95, 3);
  }
  // dashed asymptotes
  for (let i = 0; i < 12; i++) {
    kit.ln(X(0), py0 + i * sqz / 12, X(0), py0 + (i + 0.55) * sqz / 12, RD, 0.55, 1.5);
    kit.ln(px0 + i * sqz / 12, Y(0), px0 + (i + 0.55) * sqz / 12, Y(0), RD, 0.55, 1.5);
  }
  const mx = st === 'move' ? 0.4 + 3 * p : 2;
  if (st !== 'predict') { kit.dot(X(mx), Y(f(mx)), 7, AM, 1); kit.tx(`(${f1(mx)} ، ${f1(f(mx))})`, X(mx) + 4, Y(f(mx)) - 18, 12, AM, 1); }
  if (st === 'observe') kit.tx('لا تلمس المحاور أبداً!', CX, TOP + 26, 14, RD, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? `y = ${k}/x  ؟` : st === 'move' ? `x → 0  ⇒  y → ∞` : 'مقاربتان: x=0 و y=0',
    formula: `y = ${k}/x  ·  xy = ${k}`,
  };
};

/** Linear function: line with a slope triangle. */
const linearModel: Model = ({ kit, a, b, st, p }) => {
  const m = a || 2, f = (x: number) => m * x + b;
  const { X, Y } = plotFrame(kit, f, -4, 4, VI, 0.95);
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  if (g > 0) {
    const x1 = 0, x2 = 1;
    kit.ln(X(x1), Y(f(x1)), X(x2), Y(f(x1)), TE, 0.9 * g, 2);
    kit.ln(X(x2), Y(f(x1)), X(x2), Y(f(x2)), AM, 0.9 * g, 2);
    kit.tx('1', (X(x1) + X(x2)) / 2, Y(f(x1)) + 16, 12, TE, g);
    kit.tx(String(m), X(x2) + 14, (Y(f(x1)) + Y(f(x2))) / 2, 12, AM, g);
  }
  if (st !== 'predict') kit.dot(X(0), Y(b), 7, TE, 1);
  return {
    readout: st === 'predict' ? `y = ${m}x + ${b}  ؟` : st === 'move' ? 'كل خطوة +1 في x تضيف a في y' : `الميل = ${m}`,
    formula: `y = ${m}x + ${b}  ·  الميل = ${m}`,
  };
};

/** System of two lines: intersection point is the solution. */
const systemModel: Model = ({ kit, a, b, c, st, p, pulse }) => {
  const m1 = a || 1, b1 = b, m2 = -(c || 1), b2 = (c || 1) * 2;
  const f1n = (x: number) => m1 * x + b1, f2n = (x: number) => m2 * x + b2;
  const xi = (b2 - b1) / (m1 - m2), yi = f1n(xi);
  const lo = xi - 4, hi = xi + 4;
  const { X, Y } = plotFrame(kit, f1n, lo, hi, TE, 0.95);
  const pts2: Array<[number, number]> = [];
  for (let i = 0; i <= 40; i++) { const x = lo + (hi - lo) * i / 40; pts2.push([X(x), Y(f2n(x))]); }
  kit.poly(pts2, AM, 0, 0.95, 3);
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  if (g > 0.4) {
    kit.dot(X(xi), Y(yi), 9, WH, 1);
    kit.tx(`(${f1(xi)} ، ${f1(yi)})`, X(xi), Y(yi) - 22, 13, WH, 1);
  }
  if (st === 'observe') kit.tx('نقطة التقاطع هي الحلّ!', CX, TOP + 26, 14, TE, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? 'أين يتقاطع الخطّان ؟' : st === 'move' ? 'نبحث عن النقطة المشتركة…' : `x = ${f1(xi)} ، y = ${f1(yi)}`,
    formula: `${m1}x + ${b1} = ${m2}x + ${b2}  ⇒  x = ${f1(xi)}`,
  };
};

/** Unit circle + sine wave: the 3B1B rotating-radius classic. */
const waveModel: Model = ({ kit, st, p, pulse }) => {
  const r = Math.min(BW, MH) * 0.26, ccx = CX - BW * 0.22, ccy = MY - 10;
  const theta = (st === 'move' ? p : st === 'predict' ? 0.15 : 1) * Math.PI * 2 * 1.5 + 0.4;
  const px = ccx + r * Math.cos(theta), py = ccy - r * Math.sin(theta);
  // circle + rotating radius
  kit.els.push(<circle key="uc" cx={ccx} cy={ccy} r={r} fill="none" stroke={`rgba(${VI},0.9)`} strokeWidth={2.5} />);
  kit.ln(ccx, ccy, px, py, AM, 0.95, 3);
  kit.dot(px, py, 7, AM, 1);
  kit.els.push(<path key="arc" d={`M ${ccx + r * 0.4} ${ccy} A ${r * 0.4} ${r * 0.4} 0 ${theta % (2 * Math.PI) > Math.PI ? 1 : 0} 0 ${ccx + r * 0.4 * Math.cos(theta)} ${ccy - r * 0.4 * Math.sin(theta)}`} fill="none" stroke={`rgba(${AM},0.8)`} strokeWidth={2} />);
  kit.tx('θ', ccx + r * 0.55, ccy - 14, 13, AM, 0.9);
  // sine wave to the right, traced up to theta
  const wx0 = CX + BW * 0.02, wx1 = CX + BW * 0.44, wy = ccy;
  const XW = (t: number) => wx0 + (t / (Math.PI * 2 * 1.5)) * (wx1 - wx0);
  kit.ln(wx0, wy, wx1, wy, WH, 0.3, 1);
  const pts: Array<[number, number]> = [];
  const tMax = st === 'predict' ? 0.001 : theta;
  for (let i = 0; i <= 60; i++) { const t = tMax * i / 60; pts.push([XW(t), wy - r * Math.sin(t)]); }
  if (pts.length > 1) kit.poly(pts, TE, 0, 0.95, 3);
  // connector from circle point to wave point
  if (st !== 'predict') {
    kit.ln(px, py, XW(theta), wy - r * Math.sin(theta), WH, 0.35 + 0.2 * pulse, 1.2);
    kit.dot(XW(theta), wy - r * Math.sin(theta), 7, TE, 1);
  }
  kit.tx('sin θ', wx1 - 20, wy - r - 16, 13, TE, 0.9);
  kit.tx('1', ccx + r + 12, ccy - 6, 12, WH, 0.7);
  return {
    readout: st === 'predict' ? 'ماذا يرسم نصف القطر الدوّار ؟' : st === 'move' ? `θ = ${f1(theta * 180 / Math.PI)}°  ⇒  sin θ = ${f1(Math.sin(theta))}` : 'الدائرة ترسم الموجة!',
    formula: 'sin θ = الإحداثي العمودي على دائرة الوحدة',
  };
};

/** Exponential growth: y = a^x with doubling dots; logadd uses the inverse log curve. */
const expModel: Model = ({ kit, a, st, p, pulse }) => {
  const base = Math.max(2, Math.min(3, a || 2)), f = (x: number) => Math.pow(base, x);
  const { X, Y } = plotFrame(kit, f, -3, 3, VI, 0.95);
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  const nDots = Math.round(g * 4);
  for (let i = 0; i <= nDots; i++) {
    const x = i - 1;
    kit.dot(X(x), Y(f(x)), 7, i === nDots && st === 'move' ? AM : TE, 1);
    if (i > 0 && g > 0) kit.tx(`×${base}`, (X(x - 1) + X(x)) / 2, Math.min(Y(f(x - 1)), Y(f(x))) - 14, 11, AM, 0.9);
  }
  if (st !== 'predict') kit.tx(`y = ${base}ˣ`, X(2.2), Y(f(2.2)) - 20, 14, VI, 1);
  if (st === 'observe') kit.tx('تنمو أسرع من أيّ كثيرة حدود!', CX, TOP + 26, 13, TE, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? `كم تساوي ${base}ˣ بعد x خطوات ؟` : st === 'move' ? `كل خطوة تضرب في ${base}` : `${base}ˣ تنفجر بسرعة`,
    formula: `y = ${base}ˣ  ·  كل خطوة × ${base}`,
  };
};

/** Logarithm: the inverse of exponential — grows slower and slower. */
const logModel: Model = ({ kit, a, st, p, pulse }) => {
  const base = Math.max(2, Math.min(10, a || 2)), f = (x: number) => Math.log(x) / Math.log(base);
  const { X, Y } = plotFrame(kit, f, 0.05, 8, VI, 0);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 60; i++) { const x = 0.05 + 7.95 * i / 60; pts.push([X(x), Y(f(x))]); }
  kit.poly(pts, VI, 0, 0.95, 3);
  const g = st === 'move' ? p : st === 'predict' ? 0 : 1;
  if (g > 0) {
    for (const x of [1, base, base * base]) {
      if (x > 8) break;
      kit.dot(X(x), Y(f(x)), 7, TE, g);
      kit.tx(`${base}^${f1(f(x))} = ${x}`, X(x), Y(f(x)) - 18, 11, TE, g);
    }
  }
  if (st === 'observe') kit.tx('نموّ بطيء جداً!', CX, TOP + 26, 14, AM, 0.6 + 0.4 * pulse);
  return {
    readout: st === 'predict' ? `log₍${base}₎ x = ؟` : st === 'move' ? 'السؤال المعكوس: أيّ أسّ يعطي x ؟' : `log₍${base}₎(${base}²) = 2`,
    formula: `log₍${base}₎ x = y  ⇔  ${base}^y = x`,
  };
};

export const LEGACY_RENDERERS: Record<string, Model> = {
  groups, area, stair, balance, venn, gcd, fraction,
  tangent, secant: tangent, zoom: tangent, chain: tangent, flip: tangent,
  riemann, ftc: riemann, signarea: riemann, revolve: riemann, volume: riemann,
  numline, off: numline, num: numline, gap: numline, bounds: numline,
  disc, sqrt: sqrtModel, diffsq, thales, inscr: thales,
  // Curves, limits & variation
  curve: curveModel, limit: curveModel, asym: curveModel, variation: curveModel, convex: curveModel,
  quad: curveModel, func: curveModel, ivt: curveModel, squeeze: curveModel, dist: curveModel,
  geo: curveModel, triangle: curveModel,
  inverse: inverseModel, linear: linearModel, system: systemModel,
  // Trig, waves & complex numbers
  wave: waveModel, trig: waveModel, sinx: waveModel, clock: waveModel, crot: waveModel,
  carg: waveModel, cplx: waveModel,
  // Exponentials, growth & logarithms
  exponential: expModel, expk: expModel, growth: expModel, powers: expModel, logadd: logModel,
};

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
    <g data-legacy-model={input.model} className="legacy-3b1b-visual">
      {/* 3B1B Luminous Model Backdrop Grid Frame */}
      <rect
        x={CX - BW / 2}
        y={TOP - 10}
        width={BW}
        height={MH + 60}
        rx={12}
        fill="rgba(15, 23, 42, 0.45)"
        stroke="rgba(56, 189, 248, 0.2)"
        strokeWidth={1.2}
      />
      {kit.els}
      {res.readout ? (() => {
        const textLen = res.readout.length;
        const pillW = Math.min(344, Math.max(160, textLen * 11.5 + 32));
        const pillFont = textLen > 24 ? 14 : textLen > 18 ? 16 : 19;
        return (
          <g transform={`translate(${CX}, 14)`}>
            <rect
              x={-pillW / 2}
              y={-18}
              width={pillW}
              height={34}
              rx={8}
              fill="rgba(8, 12, 20, 0.88)"
              stroke={bad ? 'rgba(248, 113, 113, 0.85)' : 'rgba(56, 189, 248, 0.75)'}
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={5}
              fontSize={pillFont}
              fontWeight={800}
              fontFamily="Tajawal, Cairo, sans-serif"
              textAnchor="middle"
              fill={`rgba(${bad ? RD : WH},${al})`}
              stroke="rgba(8,12,18,0.9)"
              strokeWidth={3}
              paintOrder="stroke"
              style={{ unicodeBidi: "plaintext" }}
            >
              {res.readout}
            </text>
          </g>
        );
      })() : null}
      {res.formula && st === 'general' ? (() => {
        const formulaLen = res.formula.length;
        const pillW = Math.min(348, Math.max(180, formulaLen * 8.2 + 28));
        const formulaFont = formulaLen > 36 ? 11 : formulaLen > 28 ? 12.5 : 13.5;
        return (
          <g transform={`translate(${CX}, ${TOP + MH + 50})`}>
            <rect
              x={-pillW / 2}
              y={-14}
              width={pillW}
              height={28}
              rx={6}
              fill="rgba(8, 12, 20, 0.85)"
              stroke="rgba(251, 191, 36, 0.75)"
              strokeWidth={1.2}
            />
            <text
              x={0}
              y={4}
              fontSize={formulaFont}
              fontWeight={800}
              fontFamily="Tajawal, Cairo, sans-serif"
              textAnchor="middle"
              fill={`rgba(${AM},${al})`}
              style={{ unicodeBidi: "plaintext" }}
            >
              {res.formula}
            </text>
          </g>
        );
      })() : null}
    </g>
  );
}

export const LEGACY_VISUAL_WIDTH = W;
