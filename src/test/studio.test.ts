import { describe, expect, it } from "vitest";
import { defaultProject, duplicateScene, moveScene, totalDuration } from "@/lib/studio";

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
});