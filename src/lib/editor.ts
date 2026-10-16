import type { AspectRatio, Clip, EffectType, MediaAsset, Project, Track, TransformValues } from "./types";

export const DEFAULT_TRANSFORM: TransformValues = {
  x: 0,
  y: 0,
  scale: 100,
  rotation: 0,
  opacity: 100,
};

export const TRACKS: Track[] = [
  { id: "video-1", name: "Video 1", kind: "video", muted: false, solo: false },
  { id: "audio-1", name: "Audio 1", kind: "audio", muted: false, solo: false },
  { id: "audio-2", name: "Audio 2", kind: "audio", muted: false, solo: false },
  { id: "overlay-1", name: "Text", kind: "overlay", muted: false, solo: false },
];

export function createProject(title: string, ratio: AspectRatio = "16:9"): Project {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled Project",
    ratio,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    demo: false,
    clips: [],
    tracks: TRACKS.map((track) => ({ ...track })),
  };
}

export function createClip(asset: MediaAsset, trackId: string, position: number): Clip {
  const sourceDuration = asset.kind === "image" ? 5 : Math.max(0.5, asset.duration);
  return {
    id: crypto.randomUUID(),
    trackId,
    assetId: asset.id,
    position,
    sourceStart: 0,
    sourceDuration,
    speed: 1,
    volume: 100,
    fadeIn: 0,
    fadeOut: 0,
    effect: "none",
    intensity: 100,
    transform: { ...DEFAULT_TRANSFORM },
    keyframes: [],
  };
}

export function createTextClip(position: number, text: string): Clip {
  return {
    id: crypto.randomUUID(),
    trackId: "overlay-1",
    assetId: null,
    text: text.trim(),
    position,
    sourceStart: 0,
    sourceDuration: 4,
    speed: 1,
    volume: 0,
    fadeIn: 0,
    fadeOut: 0,
    effect: "none",
    intensity: 100,
    transform: { ...DEFAULT_TRANSFORM },
    keyframes: [],
  };
}

export function clipDuration(clip: Clip): number {
  return clip.sourceDuration / clip.speed;
}

export function projectDuration(project: Project): number {
  return Math.max(0, ...project.clips.map((clip) => clip.position + clipDuration(clip)));
}

export function endOfTrack(project: Project, trackId: string): number {
  return Math.max(0, ...project.clips.filter((clip) => clip.trackId === trackId).map((clip) => clip.position + clipDuration(clip)));
}

export function activeClip(project: Project, trackId: string, time: number): Clip | undefined {
  return [...project.clips].reverse().find((clip) =>
    clip.trackId === trackId && time >= clip.position && time < clip.position + clipDuration(clip)
  );
}

export function splitClip(project: Project, clipId: string, at: number): Project | null {
  const clip = project.clips.find((item) => item.id === clipId);
  if (!clip) return null;
  const localTime = at - clip.position;
  if (localTime < 0.2 || localTime > clipDuration(clip) - 0.2) return null;

  const leftSourceDuration = localTime * clip.speed;
  const splitValues = sampleTransform(clip, localTime);
  const left: Clip = {
    ...clip,
    sourceDuration: leftSourceDuration,
    keyframes: clip.keyframes.length ? [
      ...clip.keyframes.filter((keyframe) => keyframe.time < localTime - 0.001),
      { id: crypto.randomUUID(), time: localTime, values: splitValues },
    ] : [],
  };
  const right: Clip = {
    ...clip,
    id: crypto.randomUUID(),
    position: at,
    sourceStart: clip.sourceStart + leftSourceDuration,
    sourceDuration: clip.sourceDuration - leftSourceDuration,
    transform: splitValues,
    keyframes: clip.keyframes.length ? [
      { id: crypto.randomUUID(), time: 0, values: splitValues },
      ...clip.keyframes.filter((keyframe) => keyframe.time > localTime + 0.001).map((keyframe) => ({
        ...keyframe,
        id: crypto.randomUUID(),
        time: keyframe.time - localTime,
      })),
    ] : [],
  };
  return {
    ...project,
    clips: project.clips.flatMap((item) => item.id === clipId ? [left, right] : [item]),
  };
}

export function sampleTransform(clip: Clip, localTime: number): TransformValues {
  const frames = [...clip.keyframes].sort((a, b) => a.time - b.time);
  if (!frames.length) return clip.transform;
  if (localTime <= frames[0].time) return frames[0].values;
  if (localTime >= frames[frames.length - 1].time) return frames[frames.length - 1].values;

  const rightIndex = frames.findIndex((frame) => frame.time >= localTime);
  const left = frames[rightIndex - 1];
  const right = frames[rightIndex];
  const fraction = (localTime - left.time) / (right.time - left.time);
  return {
    x: left.values.x + (right.values.x - left.values.x) * fraction,
    y: left.values.y + (right.values.y - left.values.y) * fraction,
    scale: left.values.scale + (right.values.scale - left.values.scale) * fraction,
    rotation: left.values.rotation + (right.values.rotation - left.values.rotation) * fraction,
    opacity: left.values.opacity + (right.values.opacity - left.values.opacity) * fraction,
  };
}

export function effectFilter(effect: EffectType, intensity: number): string {
  const factor = Math.max(0, Math.min(1, intensity / 100));
  switch (effect) {
    case "noir": return `grayscale(${factor}) contrast(${1 + factor * 0.22})`;
    case "warm": return `sepia(${factor * 0.42}) saturate(${1 + factor * 0.3})`;
    case "cool": return `hue-rotate(${factor * 22}deg) saturate(${1 + factor * 0.2})`;
    case "cinematic": return `contrast(${1 + factor * 0.25}) saturate(${1 - factor * 0.17}) brightness(${1 - factor * 0.08})`;
    default: return "none";
  }
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const wholeSeconds = Math.floor(safe % 60).toString().padStart(2, "0");
  const frames = Math.floor((safe % 1) * 24).toString().padStart(2, "0");
  return `${minutes}:${wholeSeconds}:${frames}`;
}

export function ratioValue(ratio: AspectRatio): number {
  if (ratio === "9:16") return 9 / 16;
  if (ratio === "1:1") return 1;
  return 16 / 9;
}