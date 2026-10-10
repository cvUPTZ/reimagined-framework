import { type Scene, type StudioProject } from './studio';

export function sceneStart(scenes: Scene[], index: number) {
  return scenes.slice(0, Math.max(0, index)).reduce((sum, scene) => sum + scene.duration, 0);
}

export function trimScene(project: StudioProject, id: string, seconds: number): StudioProject {
  if (!Number.isFinite(seconds)) return project;
  const duration = Math.max(.1, Math.min(600, Math.round(seconds * 10) / 10));
  return { ...project, scenes: project.scenes.map(scene => scene.id === id ? { ...scene, duration } : scene) };
}

export function timelineMetrics(scenes: Scene[], availableWidth: number, zoom: number) {
  const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const pixelsPerSecond = Math.max(1, availableWidth) / Math.max(.1, duration) * zoom;
  let start = 0;
  const clips = scenes.map(scene => {
    const clip = { id: scene.id, start, left: start * pixelsPerSecond, width: scene.duration * pixelsPerSecond };
    start += scene.duration;
    return clip;
  });
  const interval = [1, 2, 5, 10, 30, 60, 120, 300, 600].find(n => n * pixelsPerSecond >= 55) ?? Math.ceil(duration / 10);
  return { clips, pixelsPerSecond, width: duration * pixelsPerSecond, duration, interval };
}