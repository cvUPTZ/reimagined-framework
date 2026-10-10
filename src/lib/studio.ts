export type StudioTab = "ideas" | "scenes" | "audio" | "export";
export type VideoFormat = "portrait" | "landscape";

export interface Scene {
  id: string;
  title: string;
  label: string;
  body: string;
  duration: number;
  kind: "hook" | "explain" | "rule" | "cta";
}

export interface StudioProject {
  id: string;
  name: string;
  format: VideoFormat;
  topic: string;
  level: string;
  mistake: string;
  expression: string;
  remediation: string;
  cta: string;
  scenes: Scene[];
}

export const makeId = () => Math.random().toString(36).slice(2, 10);

export const defaultProject: StudioProject = {
  id: "qed-demo",
  name: "أولوية العمليات",
  format: "portrait",
  topic: "أولوية العمليات",
  level: "BAC 2026",
  mistake: "نحسب الضرب قبل الأقواس",
  expression: "(3 + 2) × 4",
  remediation: "الأقواس أولاً، ثم نكمل العملية بالترتيب.",
  cta: "جرّب التشخيص المجاني مع QED",
  scenes: [
    { id: "s1", title: "الخطاف", label: "01", body: "خطأ صغير\nيضيع نقطة كاملة", duration: 3, kind: "hook" },
    { id: "s2", title: "المشكلة", label: "02", body: "(3 + 2) × 4\nليس 11", duration: 4, kind: "explain" },
    { id: "s3", title: "التصحيح", label: "03", body: "الأقواس أولاً\n5 × 4 = 20", duration: 5, kind: "rule" },
    { id: "s4", title: "الخلاصة", label: "04", body: "القوس كتلة واحدة", duration: 3, kind: "rule" },
    { id: "s5", title: "الدعوة", label: "05", body: "اختبر فهمك الآن", duration: 3, kind: "cta" },
  ],
};

export function totalDuration(scenes: Scene[]) {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

export function moveScene(scenes: Scene[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= scenes.length || to >= scenes.length) return scenes;
  const next = [...scenes];
  const [moved] = next.splice(from, 1);
  if (!moved) return scenes;
  next.splice(to, 0, moved);
  return next.map((scene, index) => ({ ...scene, label: String(index + 1).padStart(2, "0") }));
}

export function duplicateScene(scenes: Scene[], index: number) {
  const source = scenes[index];
  if (!source) return scenes;
  const next = [...scenes];
  next.splice(index + 1, 0, { ...source, id: makeId(), title: `${source.title} — نسخة` });
  return next.map((scene, i) => ({ ...scene, label: String(i + 1).padStart(2, "0") }));
}

export function buildScenes(project: StudioProject): Scene[] {
  return [
    { id: makeId(), title: "الخطاف", label: "01", body: `أغلب الطلبة يخطئون في\n${project.topic}`, duration: 3, kind: "hook" },
    { id: makeId(), title: "الخطأ", label: "02", body: `${project.expression}\n${project.mistake}`, duration: 4, kind: "explain" },
    { id: makeId(), title: "التشخيص", label: "03", body: "توقّف هنا\nوابحث عن القاعدة", duration: 4, kind: "explain" },
    { id: makeId(), title: "التصحيح", label: "04", body: project.remediation, duration: 5, kind: "rule" },
    { id: makeId(), title: "الخلاصة", label: "05", body: "قاعدة واحدة\nتمنع الخطأ", duration: 3, kind: "rule" },
    { id: makeId(), title: "الدعوة", label: "06", body: project.cta, duration: 3, kind: "cta" },
  ];
}