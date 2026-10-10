import { referenceProject } from './reference-project';
import { defaultProject, makeId, type StudioProject } from './studio';
import { parseProjectFile, projectFile } from './project-file';

export interface ProjectMeta {
  id: string;
  name: string;
  format: 'portrait' | 'landscape';
  topic: string;
  level: string;
  sceneCount: number;
  duration: number;
  updatedAt: string;
}

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  name: string;
  timestamp: string;
  project: StudioProject;
}

const INDEX_KEY = 'qed-studio-projects-index-v1';
const DATA_PREFIX = 'qed-studio-project-data:';
const SNAPSHOT_PREFIX = 'qed-studio-snapshots:';

function getStoredIndex(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore read errors
  }
  return [];
}

function setStoredIndex(index: ProjectMeta[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // LocalStorage full
  }
}

export function listProjects(): ProjectMeta[] {
  const index = getStoredIndex();
  if (index.length === 0) {
    // Seed with reference project and current project if available
    const initialList: ProjectMeta[] = [];
    try {
      const currentRaw = localStorage.getItem('qed-studio-project-v1');
      if (currentRaw) {
        const { project } = parseProjectFile(JSON.parse(currentRaw));
        saveProject(project, false);
      }
    } catch {
      // Ignore
    }
    // Also save reference demo
    saveProject(referenceProject, false);
    return getStoredIndex();
  }
  return index.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getProject(id: string): StudioProject | null {
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${id}`);
    if (raw) {
      const parsed = parseProjectFile(JSON.parse(raw));
      return parsed.project;
    }
  } catch {
    // Ignore
  }
  if (id === referenceProject.id) return referenceProject;
  if (id === defaultProject.id) return defaultProject;
  return null;
}

export function saveProject(project: StudioProject, createAutoSnapshot = true): void {
  const now = new Date().toISOString();
  const updated: StudioProject = { ...project, updatedAt: now };
  const duration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  try {
    localStorage.setItem(`${DATA_PREFIX}${project.id}`, JSON.stringify(projectFile(updated)));
    // Also update current active project slot for backward compatibility
    localStorage.setItem('qed-studio-project-v1', JSON.stringify(projectFile(updated)));
  } catch {
    // Storage may be full
  }

  const index = getStoredIndex().filter(p => p.id !== project.id);
  const meta: ProjectMeta = {
    id: project.id,
    name: project.name || 'Untitled project',
    format: project.format,
    topic: project.topic,
    level: project.level,
    sceneCount: project.scenes.length,
    duration,
    updatedAt: now,
  };
  index.unshift(meta);
  setStoredIndex(index);

  if (createAutoSnapshot) {
    createSnapshot(updated);
  }
}

export function deleteProject(id: string): boolean {
  try {
    localStorage.removeItem(`${DATA_PREFIX}${id}`);
    localStorage.removeItem(`${SNAPSHOT_PREFIX}${id}`);
  } catch {
    // Ignore
  }
  const index = getStoredIndex().filter(p => p.id !== id);
  setStoredIndex(index);
  return true;
}

export function duplicateProject(id: string): StudioProject | null {
  const source = getProject(id);
  if (!source) return null;
  const newProject: StudioProject = {
    ...source,
    id: `project-${makeId()}`,
    name: `${source.name} (Copy)`,
    scenes: source.scenes.map(s => ({ ...s, id: makeId() })),
  };
  saveProject(newProject);
  return newProject;
}

export function searchProjects(query = ''): ProjectMeta[] {
  const q = query.trim().toLowerCase();
  const all = listProjects();
  if (!q) return all;
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.topic.toLowerCase().includes(q) ||
    p.level.toLowerCase().includes(q)
  );
}

export function createSnapshot(project: StudioProject): void {
  try {
    const key = `${SNAPSHOT_PREFIX}${project.id}`;
    const raw = localStorage.getItem(key);
    const snapshots: ProjectSnapshot[] = raw ? JSON.parse(raw) : [];
    const newSnap: ProjectSnapshot = {
      id: makeId(),
      projectId: project.id,
      name: project.name,
      timestamp: new Date().toISOString(),
      project,
    };
    // Keep up to 10 latest snapshots
    const trimmed = [newSnap, ...snapshots.slice(0, 9)];
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}

export function listSnapshots(projectId: string): ProjectSnapshot[] {
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}
