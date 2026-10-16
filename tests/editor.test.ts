import { describe, expect, it } from "vitest";
import { BUILT_IN_ASSETS } from "../src/lib/data";
import {
  activeClip, clipDuration, createClip, createProject, createTextClip, effectFilter,
  endOfTrack, projectDuration, sampleTransform, splitClip,
} from "../src/lib/editor";

describe("timeline model", () => {
  it("keeps independent video and overlay tracks in one project", () => {
    const project = createProject("Edit");
    const first = createClip(BUILT_IN_ASSETS[0], "video-1", 0);
    const second = createClip(BUILT_IN_ASSETS[1], "video-1", 5);
    const title = createTextClip(2, "INTRO");
    project.clips = [first, second, title];

    expect(endOfTrack(project, "video-1")).toBe(10);
    expect(projectDuration(project)).toBe(10);
    expect(activeClip(project, "video-1", 5)?.id).toBe(second.id);
    expect(activeClip(project, "overlay-1", 3)?.text).toBe("INTRO");
    expect(activeClip(project, "overlay-1", 7)).toBeUndefined();
  });

  it("splits source ranges and keyframe interpolation without a discontinuity", () => {
    const project = createProject("Motion");
    const clip = createClip(BUILT_IN_ASSETS[0], "video-1", 2);
    clip.sourceStart = 3;
    clip.sourceDuration = 8;
    clip.speed = 2;
    clip.keyframes = [
      { id: "start", time: 0, values: { ...clip.transform, x: 0 } },
      { id: "end", time: 4, values: { ...clip.transform, x: 100 } },
    ];
    project.clips = [clip];

    const result = splitClip(project, clip.id, 4);
    expect(result).not.toBeNull();
    const [left, right] = result!.clips;
    expect(clipDuration(left)).toBe(2);
    expect(clipDuration(right)).toBe(2);
    expect(right.position).toBe(4);
    expect(right.sourceStart).toBe(7);
    expect(left.sourceDuration + right.sourceDuration).toBe(clip.sourceDuration);
    expect(sampleTransform(left, 2).x).toBe(50);
    expect(sampleTransform(right, 0).x).toBe(50);
    expect(sampleTransform(right, 2).x).toBe(100);
    expect(project.clips).toHaveLength(1);
  });

  it("does not create tiny fragments at clip boundaries", () => {
    const project = createProject("Boundary");
    const clip = createClip(BUILT_IN_ASSETS[0], "video-1", 0);
    project.clips = [clip];
    expect(splitClip(project, clip.id, 0)).toBeNull();
    expect(splitClip(project, clip.id, 4.95)).toBeNull();
    expect(splitClip(project, "missing", 2)).toBeNull();
  });

  it("generates only supported visual effect filters", () => {
    expect(effectFilter("none", 100)).toBe("none");
    expect(effectFilter("noir", 100)).toContain("grayscale(1)");
    expect(effectFilter("warm", 0)).toContain("sepia(0)");
  });
});