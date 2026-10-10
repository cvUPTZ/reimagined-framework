import { defaultProject, type StudioProject } from './studio';

export const referenceProject: StudioProject = {
  ...defaultProject,
  id: 'qed-visual-derivative',
  name: 'The derivative, made visual',
  topic: 'Understanding derivatives',
  expression: 'f(x) = x²',
  scenes: [
    { id: 'visual-1', label: '01', title: 'A different way to see it', body: 'What does a derivative\nactually mean?', duration: 4, kind: 'hook', phase: 'Hook', animation: 'Draw in', visual: 'curve', fontSize: 42 },
    { id: 'visual-2', label: '02', title: 'The common mistake', body: 'The value is not\nthe rate of change.', duration: 5, kind: 'explain', phase: 'Diagnosis', animation: 'Fade', visual: 'curve', fontSize: 42 },
    { id: 'visual-3', label: '03', title: 'Meet the tangent', body: 'One point.\nA whole new perspective.', duration: 7, kind: 'explain', phase: 'Intuition', animation: 'Draw in', visual: 'tangent', fontSize: 42 },
    { id: 'visual-4', label: '04', title: 'Connect the dots', body: 'The slope tells\nthe story.', duration: 6, kind: 'rule', phase: 'Solution', animation: 'Slide up', visual: 'tangent', expression: 'f′(x) = 2x', fontSize: 42 },
    { id: 'visual-5', label: '05', title: 'Your turn', body: 'What is the slope\nat x = 1?', duration: 5, kind: 'cta', phase: 'Challenge', animation: 'Fade', visual: 'curve', fontSize: 42 },
    { id: 'visual-6', label: '06', title: 'A little clarity', body: 'A little clarity.\nA big difference.', duration: 4, kind: 'cta', phase: 'End card', animation: 'Fade', visual: 'none', expression: 'QED ∎', fontSize: 42 },
  ],
};
export const phaseNames = ['Hook', 'Diagnosis', 'Intuition', 'Solution', 'Challenge', 'End card'];
export function phaseOf(scene: StudioProject['scenes'][number]) {
  return scene.phase ?? ({ hook: 'Hook', explain: 'Intuition', rule: 'Solution', cta: 'End card' })[scene.kind];
}
export function phaseClass(phase: string) { return `phase-${phase.toLowerCase().replaceAll(' ', '-')}`; }
export function timecode(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
