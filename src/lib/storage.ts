import { openDB } from "idb";
import { BUILT_IN_ASSETS, demoProjects } from "./data";
import type { AppSettings, MediaAsset, Project, SavedWorkspace } from "./types";

const WORKSPACE_KEY = "vexedit-studio-workspace-v1";
const DATABASE_NAME = "vexedit-studio-media-v1";
const PREVIOUS_KEY = `${WORKSPACE_KEY}-previous`;

function parseWorkspace(raw: string | null): SavedWorkspace | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const workspace = parsed as Partial<SavedWorkspace>;
    if (workspace.version !== 1 || !Array.isArray(workspace.projects) || !Array.isArray(workspace.assets)) return null;
    if (!workspace.projects.every((project) =>
      project && typeof project.id === "string" && typeof project.title === "string" &&
      Array.isArray(project.clips) && Array.isArray(project.tracks) &&
      project.clips.every((clip) =>
        clip && typeof clip.id === "string" && typeof clip.trackId === "string" &&
        typeof clip.position === "number" && Number.isFinite(clip.position) && clip.position >= 0 &&
        typeof clip.sourceDuration === "number" && clip.sourceDuration > 0 &&
        typeof clip.speed === "number" && clip.speed > 0 &&
        Array.isArray(clip.keyframes) && clip.transform && typeof clip.transform.scale === "number"
      ) && project.tracks.every((track) => track && typeof track.id === "string" && typeof track.kind === "string")
    )) return null;
    if (!workspace.assets.every((asset) => asset && typeof asset.id === "string" && typeof asset.name === "string" && ["video", "image", "audio"].includes(asset.kind))) return null;
    return {
      version: 1,
      projects: workspace.projects as Project[],
      assets: [...BUILT_IN_ASSETS, ...(workspace.assets as MediaAsset[]).filter((asset) => !asset.builtIn)],
      settings: {
        language: workspace.settings?.language === "tr" ? "tr" : "en",
        profile: workspace.settings?.profile === "low" || workspace.settings?.profile === "high" ? workspace.settings.profile : "medium",
      },
    };
  } catch {
    return null;
  }
}

const database = () => openDB(DATABASE_NAME, 1, {
  upgrade(db) {
    db.createObjectStore("files");
  },
});

export async function storeMedia(id: string, file: Blob): Promise<void> {
  const db = await database();
  await db.put("files", file, id);
}

export async function getMedia(id: string): Promise<Blob | undefined> {
  const db = await database();
  return db.get("files", id);
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await database();
  await db.delete("files", id);
}

export function loadWorkspace(): SavedWorkspace {
  const defaults: SavedWorkspace = {
    version: 1,
    projects: demoProjects(),
    assets: BUILT_IN_ASSETS,
    settings: { language: "en", profile: "medium" },
  };

  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    const valid = parseWorkspace(raw);
    if (valid) return valid;
    if (raw) {
      try { localStorage.setItem(`${WORKSPACE_KEY}-invalid-${Date.now()}`, raw); } catch { /* Preserve the last valid snapshot when storage is full. */ }
    }
    return parseWorkspace(localStorage.getItem(PREVIOUS_KEY)) ?? defaults;
  } catch { return defaults; }
}

export function saveWorkspace(projects: Project[], assets: MediaAsset[], settings: AppSettings): void {
  const workspace: SavedWorkspace = { version: 1, projects, assets, settings };
  const serialized = JSON.stringify(workspace);
  const existing = localStorage.getItem(WORKSPACE_KEY);
  if (existing && existing !== serialized && parseWorkspace(existing)) {
    try { localStorage.setItem(PREVIOUS_KEY, existing); } catch { /* Keep the current save possible if the backup key is full. */ }
  }
  localStorage.setItem(WORKSPACE_KEY, serialized);
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function makeProjectBackup(project: Project, assets: MediaAsset[]): Promise<Blob> {
  const used = assets.filter((asset) => project.clips.some((clip) => clip.assetId === asset.id));
  const imported = used.filter((asset) => !asset.builtIn);
  const files = await Promise.all(imported.map((asset) => getMedia(asset.id)));
  if (files.some((blob) => !blob)) throw new Error("A source file is missing. Relink the media before backing up.");
  const totalSize = files.reduce((sum, blob) => sum + (blob?.size ?? 0), 0);
  if (totalSize > 20 * 1024 * 1024) throw new Error("Portable backups are limited to 20 MB of imported media in this web preview.");

  const contents: Record<string, string> = {};
  for (let index = 0; index < imported.length; index++) {
    const blob = files[index]!;
    contents[imported[index].id] = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Media could not be read."));
      reader.readAsDataURL(blob);
    });
  }
  return new Blob([JSON.stringify({ format: "vexedit-web-backup", version: 1, project, assets: used, contents })], { type: "application/json" });
}

export async function restoreProjectBackup(file: File): Promise<{ project: Project; assets: MediaAsset[] }> {
  const backup = JSON.parse(await file.text()) as {
    format?: string;
    version?: number;
    project?: Project;
    assets?: MediaAsset[];
    contents?: Record<string, string>;
  };
  if (backup.format !== "vexedit-web-backup" || backup.version !== 1 || !backup.project || !Array.isArray(backup.project.clips) || !Array.isArray(backup.assets)) {
    throw new Error("This is not a valid VexEdit web backup.");
  }

  const replacementIds = new Map<string, string>();
  const restoredAssets: MediaAsset[] = [];
  for (const asset of backup.assets) {
    if (asset.builtIn) continue;
    const data = backup.contents?.[asset.id];
    if (!data || !data.startsWith("data:")) throw new Error(`Media is missing from the backup: ${asset.name}`);
    const newId = crypto.randomUUID();
    await storeMedia(newId, await (await fetch(data)).blob());
    replacementIds.set(asset.id, newId);
    restoredAssets.push({ ...asset, id: newId });
  }

  const project: Project = {
    ...backup.project,
    id: crypto.randomUUID(),
    title: `${backup.project.title} (restored)`,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    demo: false,
    favorite: false,
    clips: backup.project.clips.map((clip) => ({
      ...clip,
      id: crypto.randomUUID(),
      assetId: clip.assetId ? replacementIds.get(clip.assetId) ?? clip.assetId : null,
      keyframes: (clip.keyframes ?? []).map((frame) => ({ ...frame, id: crypto.randomUUID() })),
    })),
  };
  return { project, assets: restoredAssets };
}