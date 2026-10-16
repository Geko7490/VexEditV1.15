export type MediaKind = "video" | "image" | "audio";
export type TrackKind = "video" | "audio" | "overlay";
export type EffectType = "none" | "noir" | "warm" | "cool" | "cinematic";
export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaKind;
  mime: string;
  duration: number;
  width?: number;
  height?: number;
  source?: string;
  poster?: string;
  waveform?: number[];
  builtIn?: boolean;
}

export interface TransformValues {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface Keyframe {
  id: string;
  time: number;
  values: TransformValues;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  muted: boolean;
  solo: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  assetId: string | null;
  text?: string;
  position: number;
  sourceStart: number;
  sourceDuration: number;
  speed: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  effect: EffectType;
  intensity: number;
  transform: TransformValues;
  keyframes: Keyframe[];
}

export interface Project {
  id: string;
  title: string;
  ratio: AspectRatio;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  demo: boolean;
  clips: Clip[];
  tracks: Track[];
}

export interface AppSettings {
  language: "en" | "tr";
  profile: "low" | "medium" | "high";
}

export interface SavedWorkspace {
  version: number;
  projects: Project[];
  assets: MediaAsset[];
  settings: AppSettings;
}