import { describe, expect, it } from "vitest";
import { defaultProject, duplicateScene, moveScene, totalDuration } from "@/lib/studio";
import { tvMarketingLoopProject } from "@/lib/reference-project";
import { parseProjectFile, projectFile } from "@/lib/project-file";
import { campaignAudio } from '@/lib/campaign-audio';

describe("studio project rules", () => {
  it("calculates the concrete demo duration", () => {
    expect(totalDuration(defaultProject.scenes)).toBe(18);
  });

  it("reorders scenes and renumbers their labels", () => {
    const moved = moveScene(defaultProject.scenes, 0, 2);
    expect(moved[2]?.id).toBe("s1");
    expect(moved.map((scene) => scene.label)).toEqual(["01", "02", "03", "04", "05"]);
  });

  it("duplicates a scene immediately after its source", () => {
    const duplicated = duplicateScene(defaultProject.scenes, 1);
    expect(duplicated).toHaveLength(6);
    expect(duplicated[2]?.body).toBe(defaultProject.scenes[1]?.body);
    expect(duplicated[2]?.id).not.toBe(defaultProject.scenes[1]?.id);
  });

  it("validates TV Marketing Loop project structure, promo layouts and round-tripping", () => {
    expect(tvMarketingLoopProject.format).toBe("landscape");
    expect(tvMarketingLoopProject.scenes).toHaveLength(12);
    expect(totalDuration(tvMarketingLoopProject.scenes)).toBeCloseTo(81.514667, 6);
    
    
    // Contains custom marketing promo layouts on all scenes
    const layouts = tvMarketingLoopProject.scenes.map(s => s.legacy?.['promoLayout']);
    expect(layouts).toEqual([
      'synced-grade', 'synced-compare', 'synced-fraction', 'synced-other',
      'synced-roots', 'synced-exercises', 'synced-diagnosis', 'synced-skills',
      'synced-cause', 'synced-path', 'synced-identity', 'synced-cta',
    ]);

    // Round-trips through project file format without warnings or errors
    const parsed = parseProjectFile(projectFile(tvMarketingLoopProject));
    expect(parsed.project.scenes).toHaveLength(12);
    expect(parsed.project.format).toBe("landscape");
  });
  it("keeps the TV campaign parent-facing rather than using mathematical visual models", () => {
    expect(tvMarketingLoopProject.legacy?.['campaignAudience']).toBe('parents');
    expect(tvMarketingLoopProject.scenes.every(scene => scene.visual === 'none')).toBe(true);
  });
  it('restores the final supplied narration after editable project round-tripping', () => {
    const project = parseProjectFile(projectFile(tvMarketingLoopProject)).project;
    expect(campaignAudio(project)?.name).toBe('QED_final_synced_audio.mp3');
    expect(campaignAudio(project)?.url).toBe(tvMarketingLoopProject.audioTrack?.url);
    expect(project.audioTrack?.volume).toBe(100);
    expect(campaignAudio({ ...project, mediaName: 'other-upload.mp3' })).toBeUndefined();
  });
});