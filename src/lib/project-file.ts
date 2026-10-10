import { z } from 'zod';
import { defaultProject, type StudioProject } from './studio';

const sceneSchema = z.object({
  id: z.string().min(1), title: z.string(), label: z.string(), body: z.string(),
  duration: z.number().positive().finite(), kind: z.enum(['hook', 'explain', 'rule', 'cta']),
  phase: z.string().optional(), animation: z.enum(['Draw in', 'Fade', 'Slide up', 'None']).optional(),
  fontSize: z.number().positive().finite().optional(), visual: z.enum(['curve', 'tangent', 'none']).optional(),
  narration: z.string().optional(), expression: z.string().optional(), legacy: z.record(z.unknown()).optional(),
});
const projectSchema = z.object({
  id: z.string().min(1), name: z.string(), format: z.enum(['portrait', 'landscape']),
  topic: z.string(), level: z.string(), mistake: z.string(), expression: z.string(),
  remediation: z.string(), cta: z.string(), scenes: z.array(sceneSchema).min(1),
  legacy: z.record(z.unknown()).optional(), mediaName: z.string().optional(),
});
const legacySceneSchema = z.object({ dur: z.number().positive().finite(), txt: z.string().optional(),
  texts: z.array(z.object({ t: z.string() }).passthrough()).optional(), say: z.string().optional(),
  transcript: z.string().optional(), phase: z.string().optional(),
}).passthrough();
const legacyProjectSchema = z.object({ title: z.string().optional(), scenes: z.array(legacySceneSchema).min(1) }).passthrough();
const recordSchema = z.record(z.unknown());

export function parseProjectFile(input: unknown): { project: StudioProject; warnings: string[] } {
  const envelope = recordSchema.parse(input);
  if (typeof envelope.format === 'number' && envelope.format > 2) throw new Error('This project uses a newer file version.');
  const raw = recordSchema.parse(envelope.project ?? envelope);
  if (Array.isArray(raw.scenes) && raw.scenes.some(s => recordSchema.parse(s).dur !== undefined)) {
    const legacy = legacyProjectSchema.parse(raw);
    const phases: Record<string, string> = { hook: 'Hook', diag: 'Diagnosis', intu: 'Intuition', solve: 'Solution', cta: 'End card' };
    const project: StudioProject = {
      ...defaultProject, id: typeof raw.id === 'string' ? raw.id : 'imported-legacy',
      name: typeof envelope.name === 'string' ? envelope.name : legacy.title ?? 'Imported project',
      format: raw.landscape === true || raw.format === 'landscape' ? 'landscape' : 'portrait',
      expression: '', legacy: raw,
      scenes: legacy.scenes.map((s, i) => {
        const body = [s.txt ?? '', ...(s.texts ?? []).map(t => t.t)].filter(Boolean).join('\n');
        return { id: `legacy-${i + 1}`, label: String(i + 1).padStart(2, '0'), title: body.split('\n')[0] || `Scene ${i + 1}`,
          body, duration: s.dur, kind: 'explain', phase: phases[s.phase ?? ''] ?? 'Intuition',
          animation: 'Fade', visual: 'none', narration: s.say ?? s.transcript ?? body, legacy: s };
      }),
    };
    return { project, warnings: ['Original text, timing and narration imported. Original layers, effects, visuals and brand data are preserved in the file, but are not yet reproduced on the canvas.'] };
  }
  const project = projectSchema.parse(raw);
  const ids = new Set(project.scenes.map(s => s.id));
  if (ids.size !== project.scenes.length) throw new Error('Scene identifiers must be unique.');
  return { project, warnings: project.mediaName ? [`Reattach ${project.mediaName} to restore audio. Project files do not embed media.`] : [] };
}

export function projectFile(project: StudioProject) {
  return { app: 'QED Studio', format: 2, project };
}

export function sceneAtTime(project: StudioProject, time: number) {
  let start = 0;
  for (let index = 0; index < project.scenes.length; index++) {
    const scene = project.scenes[index];
    if (!scene) continue;
    if (time < start + scene.duration || index === project.scenes.length - 1) {
      return { index, scene, start, localTime: Math.max(0, Math.min(scene.duration, time - start)) };
    }
    start += scene.duration;
  }
  throw new Error('The project has no scenes.');
}

export function sceneMotion(scene: StudioProject['scenes'][number], time?: number) {
  const progress = time === undefined ? 1 : Math.max(0, Math.min(1, time / .7));
  return { opacity: scene.animation === 'Fade' || scene.animation === 'Slide up' ? progress : 1,
    offset: scene.animation === 'Slide up' ? (1 - progress) * 25 : 0,
    draw: scene.animation === 'Draw in' && time !== undefined ? Math.max(0, Math.min(1, time / 1.6)) : 1 };
}