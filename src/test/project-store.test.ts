import { describe, it, expect, beforeEach } from 'vitest';
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  duplicateProject,
  searchProjects,
  createSnapshot,
  listSnapshots,
} from '@/lib/project-store';
import { referenceProject } from '@/lib/reference-project';
import { defaultProject, type StudioProject } from '@/lib/studio';

describe('project-store multi-project management and snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds project list with reference project when store is empty', () => {
    const list = listProjects();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some(p => p.id === referenceProject.id)).toBe(true);
  });

  it('saves and retrieves a project by id', () => {
    const custom: StudioProject = {
      ...defaultProject,
      id: 'custom-proj-1',
      name: 'Custom Differential Equations',
      topic: 'Differential Calculus',
      level: 'BAC 2026',
    };
    saveProject(custom);

    const retrieved = getProject('custom-proj-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Custom Differential Equations');

    const metaList = listProjects();
    expect(metaList.some(p => p.id === 'custom-proj-1')).toBe(true);
  });

  it('searches projects by name, topic, and level', () => {
    const p1: StudioProject = {
      ...defaultProject,
      id: 'search-1',
      name: 'Trigonometry Deep Dive',
      topic: 'Trigonometry',
      level: '2AS',
    };
    const p2: StudioProject = {
      ...defaultProject,
      id: 'search-2',
      name: 'Complex Numbers',
      topic: 'Complex Planes',
      level: 'BAC 2026',
    };
    saveProject(p1);
    saveProject(p2);

    expect(searchProjects('trig').some(p => p.id === 'search-1')).toBe(true);
    expect(searchProjects('trig').some(p => p.id === 'search-2')).toBe(false);
    expect(searchProjects('BAC 2026').some(p => p.id === 'search-2')).toBe(true);
  });

  it('duplicates an existing project with a new id and title suffix', () => {
    const original: StudioProject = {
      ...defaultProject,
      id: 'source-proj',
      name: 'Original Story',
    };
    saveProject(original);

    const copy = duplicateProject('source-proj');
    expect(copy).not.toBeNull();
    expect(copy?.id).not.toBe('source-proj');
    expect(copy?.name).toBe('Original Story (Copy)');

    const loadedCopy = getProject(copy!.id);
    expect(loadedCopy).not.toBeNull();
    expect(loadedCopy?.id).toBe(copy!.id);
  });

  it('deletes a project and removes it from the index', () => {
    const toDelete: StudioProject = {
      ...defaultProject,
      id: 'delete-me',
      name: 'Temporary Project',
    };
    saveProject(toDelete);
    expect(getProject('delete-me')).not.toBeNull();

    deleteProject('delete-me');
    expect(getProject('delete-me')).toBeNull();
    expect(listProjects().some(p => p.id === 'delete-me')).toBe(false);
  });

  it('creates and lists recovery snapshots for a project', () => {
    const proj: StudioProject = {
      ...defaultProject,
      id: 'snap-proj',
      name: 'Version 1',
    };
    saveProject(proj, false);

    createSnapshot(proj);
    const snapV2 = { ...proj, name: 'Version 2' };
    createSnapshot(snapV2);

    const snapshots = listSnapshots('snap-proj');
    expect(snapshots.length).toBe(2);
    expect(snapshots[0]?.name).toBe('Version 2');
    expect(snapshots[1]?.name).toBe('Version 1');
  });
});
