/** Pure helpers that turn ASCII-ish lesson math into clean typeset Unicode for the canvas. */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

export const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

/** Removes decorative emoji so on-screen text stays editorial rather than chatty. */
export function stripEmoji(text: string): string {
  return text.replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ').trim();
}

/** conj(z₁) → z̄₁, sqrt( → √(, ascii comparisons → proper symbols. */
export function prettifyMath(text: string): string {
  return stripEmoji(text)
    .replace(/conj\(\s*([A-Za-z])([₀-₉0-9]*)\s*\)/g, (_, v: string, idx: string) => `${v}\u0304${idx.replace(/[0-9]/g, d => SUB[Number(d)] ?? d)}`)
    .replace(/sqrt\s*\(/g, '√(')
    .replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠')
    .replace(/=>/g, '⇒').replace(/->/g, '→')
    .replace(/(\d|\))\s*\*\s*(?=[\w(√])/g, '$1·')
    .replace(/\binfinity\b|\binf\b/g, '∞');
}

/** Breaks an over-long formula only before "=" / "⇒" so an equation never splits mid-term. */
export function wrapFormula(line: string, maxChars: number): string[] {
  if (line.length <= maxChars || hasArabic(line)) return [line];
  const parts = line.split(/\s(?=[=⇒⟺≤≥<>])/);
  if (parts.length < 2) return [line];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur + ' ' + p).length > maxChars) { out.push(cur); cur = p; }
    else cur = cur ? `${cur} ${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

const PHASE_AR: Record<string, string> = {
  Hook: 'البداية', Statement: 'نص التمرين', Step: 'خطوة', Diagnosis: 'التشخيص', Intuition: 'الفهم',
  Solution: 'الحل', Challenge: 'تحدٍّ', 'End card': 'الخاتمة', Rule: 'القاعدة', Mistake: 'الخطأ الشائع',
};
/** Arabic label for a scene phase; unknown labels are returned untouched. */
export const phaseLabel = (phase: string) => PHASE_AR[phase] ?? phase;
