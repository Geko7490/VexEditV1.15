import { createClip, createProject, createTextClip } from "./editor";
import type { MediaAsset, Project } from "./types";

export const BUILT_IN_ASSETS: MediaAsset[] = [
  { id: "sample-city", name: "Night City.jpg", kind: "image", mime: "image/jpeg", duration: 5, poster: "/images/night-city.jpg", builtIn: true },
  { id: "sample-car", name: "Midnight Drive.jpg", kind: "image", mime: "image/jpeg", duration: 5, poster: "/images/midnight-drive.jpg", builtIn: true },
  { id: "sample-valley", name: "Summer Valley.jpg", kind: "image", mime: "image/jpeg", duration: 5, poster: "/images/summer-valley.jpg", builtIn: true },
  { id: "sample-portrait", name: "Neon Portrait.jpg", kind: "image", mime: "image/jpeg", duration: 5, poster: "/images/neon-portrait.jpg", builtIn: true },
  { id: "sample-coast", name: "Coastline.jpg", kind: "image", mime: "image/jpeg", duration: 5, poster: "/images/coastline.jpg", builtIn: true },
  { id: "sample-motion", name: "Midnight Motion.webm", kind: "video", mime: "video/webm", duration: 4, width: 640, height: 360, source: "/media/midnight-demo.webm", poster: "/images/midnight-drive.jpg", builtIn: true },
];

export function demoProjects(): Project[] {
  const midnight = createProject("Midnight Edit", "16:9");
  midnight.id = "demo-midnight";
  midnight.demo = true;
  midnight.clips = [
    { ...createClip(BUILT_IN_ASSETS[0], "video-1", 0), sourceDuration: 4 },
    { ...createClip(BUILT_IN_ASSETS[1], "video-1", 4), sourceDuration: 7 },
    { ...createClip(BUILT_IN_ASSETS[3], "video-1", 11), sourceDuration: 5 },
    { ...createTextClip(5, "MIDNIGHT"), sourceDuration: 4 },
  ];

  const summer = createProject("Summer Memories", "16:9");
  summer.id = "demo-summer";
  summer.demo = true;
  summer.clips = [
    { ...createClip(BUILT_IN_ASSETS[2], "video-1", 0), sourceDuration: 5 },
    { ...createClip(BUILT_IN_ASSETS[4], "video-1", 5), sourceDuration: 5 },
  ];

  const visual = createProject("Drill Music Visual", "9:16");
  visual.id = "demo-visual";
  visual.demo = true;
  visual.clips = [
    { ...createClip(BUILT_IN_ASSETS[3], "video-1", 0), sourceDuration: 6 },
    { ...createClip(BUILT_IN_ASSETS[1], "video-1", 6), sourceDuration: 5 },
  ];

  return [midnight, summer, visual];
}