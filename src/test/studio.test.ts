import { describe, expect, it } from "vitest";
import { defaultProject, duplicateScene, moveScene, totalDuration } from "@/lib/studio";
import { tvMarketingLoopProject } from "@/lib/reference-project";
import { parseProjectFile, projectFile } from "@/lib/project-file";

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
    expect(tvMarketingLoopProject.scenes).toHaveLength(8);
    expect(totalDuration(tvMarketingLoopProject.scenes)).toBe(78);
    
    // Addresses both parents and students
    const bodies = tvMarketingLoopProject.scenes.map(s => s.body).join(' ');
    const titles = tvMarketingLoopProject.scenes.map(s => s.title).join(' ');
    expect(titles).toContain('الأولياء');
    expect(titles).toContain('الامتحانات');
    
    // Contains custom marketing promo layouts on all scenes
    const layouts = tvMarketingLoopProject.scenes.map(s => s.legacy?.['promoLayout']);
    expect(layouts).toEqual([
      'problem-hook',
      'before-after',
      'parents-pitch',
      'students-pitch',
      'four-pillars',
      'curriculum-mastery',
      'tv-grand-cta',
      'loop-outro',
    ]);

    // Round-trips through project file format without warnings or errors
    const parsed = parseProjectFile(projectFile(tvMarketingLoopProject));
    expect(parsed.project.scenes).toHaveLength(8);
    expect(parsed.project.format).toBe("landscape");
  });
});