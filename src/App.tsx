import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, AudioLines, Check, ChevronDown, ChevronRight, CircleHelp,
  Clapperboard, Copy, Download, EllipsisVertical, FileArchive, Film, FolderClosed,
  Heart, Layers2, Maximize2, Minus, Music2, Plus, Redo2, Search, Scissors,
  Settings2, SlidersHorizontal, Sparkles, Trash2, Type, Undo2, Upload, Video,
  Volume2, WandSparkles, X, ZoomIn,
} from "lucide-react";
import { BrandMark } from "./components/Brand";
import { Preview } from "./components/Preview";
import { Timeline, Waveform } from "./components/Timeline";
import { BUILT_IN_ASSETS } from "./lib/data";
import {
  clipDuration, createClip, createProject, createTextClip, endOfTrack, effectFilter,
  formatTime, projectDuration, sampleTransform, splitClip,
} from "./lib/editor";
import { renderWebm, webmSupported } from "./lib/export";
import { translate } from "./lib/i18n";
import { inspectFile } from "./lib/media";
import {
  deleteMedia, downloadBlob, getMedia, loadWorkspace, makeProjectBackup,
  restoreProjectBackup, saveWorkspace, storeMedia,
} from "./lib/storage";
import type { AppSettings, AspectRatio, Clip, EffectType, MediaAsset, Project, TransformValues } from "./lib/types";

type Page = "home" | "projects" | "studio" | "import" | "audio" | "effects" | "keyframes" | "modules" | "settings" | "export";
type Dialog = { type: "new" | "rename" | "delete" | "text"; projectId?: string } | null;
type ExportStatus = { state: "idle" | "running" | "complete" | "error"; progress: number; message: string };

const initial = loadWorkspace();
const effectOptions: { type: EffectType; label: string; category: string }[] = [
  { type: "none", label: "Original", category: "All" },
  { type: "noir", label: "Noir", category: "Color" },
  { type: "warm", label: "Warm", category: "Color" },
  { type: "cool", label: "Cool", category: "Color" },
  { type: "cinematic", label: "Cinematic", category: "Cinematic" },
];

function projectCover(project: Project, assets: MediaAsset[]): string | undefined {
  const clip = project.clips.find((item) => item.trackId === "video-1" && item.assetId);
  return assets.find((asset) => asset.id === clip?.assetId)?.poster;
}

function navIcon(page: Page, size = 21) {
  if (page === "home") return <Layers2 size={size} strokeWidth={1.9} />;
  if (page === "projects") return <FolderClosed size={size} strokeWidth={1.9} />;
  if (page === "studio") return <Clapperboard size={size} strokeWidth={1.9} />;
  if (page === "settings") return <Settings2 size={size} strokeWidth={1.9} />;
  return <Layers2 size={size} strokeWidth={1.9} />;
}

function NumberField({ value, min, max, step = 1, suffix, onChange, label }: {
  value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (value: number) => void; label: string;
}) {
  return <div className="number-field"><label>{label}</label><div className="number-control"><input type="number" aria-label={label} min={min} max={max} step={step} value={Number(value.toFixed(step < 1 ? 2 : 0))} onChange={(event) => { const parsed = Number(event.target.value); if (Number.isFinite(parsed)) onChange(Math.max(min, Math.min(max, parsed))); }} />{suffix && <span>{suffix}</span>}</div></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [assets, setAssets] = useState<MediaAsset[]>(initial.assets);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
  const [sources, setSources] = useState<Record<string, string>>(() => Object.fromEntries(BUILT_IN_ASSETS.map((asset) => [asset.id, asset.source || asset.poster!])));
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState(initial.projects[0]?.id ?? "");
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const playheadRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(48);
  const [history, setHistory] = useState<{ past: Project[]; future: Project[] }>({ past: [], future: [] });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogRatio, setDialogRatio] = useState<AspectRatio>("16:9");
  const [toast, setToast] = useState("");
  const [savedLocally, setSavedLocally] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [projectSort, setProjectSort] = useState("Last Edited");
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [importTab, setImportTab] = useState("Photos");
  const [importSearch, setImportSearch] = useState("");
  const [importSort, setImportSort] = useState<"recent" | "name">("recent");
  const [importSelection, setImportSelection] = useState<string[]>([]);
  const [importIntoCurrent, setImportIntoCurrent] = useState(false);
  const [importing, setImporting] = useState(false);
  const [effectDraft, setEffectDraft] = useState<{ effect: EffectType; intensity: number }>({ effect: "none", intensity: 100 });
  const [showBefore, setShowBefore] = useState(false);
  const [effectCategory, setEffectCategory] = useState("All");
  const [moduleCategory, setModuleCategory] = useState("All");
  const [moduleSearch, setModuleSearch] = useState("");
  const [exportSize, setExportSize] = useState<480 | 720>(720);
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ state: "idle", progress: 0, message: "" });
  const [storageEstimate, setStorageEstimate] = useState("");
  const mediaInput = useRef<HTMLInputElement>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const exportController = useRef<AbortController | null>(null);
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  const t = useCallback((key: string) => translate(key, settings.language), [settings.language]);
  const currentProject = projects.find((project) => project.id === activeId);
  const selectedClip = currentProject?.clips.find((clip) => clip.id === selectedClipId);
  const visualTarget = selectedClip && (selectedClip.trackId === "video-1" || selectedClip.trackId === "overlay-1")
    ? selectedClip : currentProject?.clips.find((clip) => clip.trackId === "video-1" || clip.trackId === "overlay-1");
  const audioTarget = selectedClip?.trackId.startsWith("audio-") ? selectedClip : currentProject?.clips.find((clip) => clip.trackId.startsWith("audio-"));
  const duration = currentProject ? projectDuration(currentProject) : 0;

  useEffect(() => { document.documentElement.lang = settings.language; }, [settings.language]);

  useEffect(() => {
    try { saveWorkspace(projects, assets, settings); setSavedLocally(true); }
    catch { setSavedLocally(false); setToast("Browser storage is full. Download a backup before leaving."); }
  }, [projects, assets, settings]);

  useEffect(() => {
    let cancelled = false;
    for (const asset of assets) {
      if (asset.builtIn || sources[asset.id] || missingIds.includes(asset.id)) continue;
      void getMedia(asset.id).then((file) => {
        if (cancelled) return;
        if (file) setSources((old) => ({ ...old, [asset.id]: URL.createObjectURL(file) }));
        else setMissingIds((old) => old.includes(asset.id) ? old : [...old, asset.id]);
      }).catch(() => { if (!cancelled) setMissingIds((old) => old.includes(asset.id) ? old : [...old, asset.id]); });
    }
    return () => { cancelled = true; };
  }, [assets, sources, missingIds]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4600);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => { playheadRef.current = playhead; }, [playhead]);

  useEffect(() => {
    if (!playing || !currentProject || duration <= 0) return;
    let frame = 0;
    let previous = performance.now();
    let committed = previous;
    const interval = settings.profile === "low" ? 83 : settings.profile === "medium" ? 40 : 16;
    const tick = (now: number) => {
      playheadRef.current = Math.min(duration, playheadRef.current + (now - previous) / 1000);
      previous = now;
      if (now - committed >= interval || playheadRef.current >= duration) { setPlayhead(playheadRef.current); committed = now; }
      if (playheadRef.current >= duration) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, currentProject?.id, duration, settings.profile]);

  useEffect(() => {
    audioElements.current.forEach((element) => element.pause());
    const next = new Map<string, HTMLAudioElement>();
    currentProject?.clips.filter((clip) => clip.trackId.startsWith("audio-")).forEach((clip) => {
      const source = clip.assetId ? sources[clip.assetId] : undefined;
      if (!source) return;
      const audio = new Audio(source);
      audio.preload = "metadata";
      next.set(clip.id, audio);
    });
    audioElements.current = next;
    return () => next.forEach((element) => element.pause());
  }, [currentProject?.id, currentProject?.clips, sources]);

  useEffect(() => {
    if (!currentProject) return;
    const soloActive = currentProject.tracks.some((track) => track.kind === "audio" && track.solo);
    audioElements.current.forEach((audio, clipId) => {
      const clip = currentProject.clips.find((item) => item.id === clipId);
      if (!clip) return;
      const track = currentProject.tracks.find((item) => item.id === clip.trackId);
      const local = playhead - clip.position;
      const audible = local >= 0 && local < clipDuration(clip) && !track?.muted && (!soloActive || track?.solo);
      if (!audible) { audio.pause(); return; }
      const expected = clip.sourceStart + local * clip.speed;
      if (audio.readyState >= 1 && Math.abs(audio.currentTime - expected) > 0.2) audio.currentTime = expected;
      audio.playbackRate = clip.speed;
      const fadeIn = clip.fadeIn > 0 ? Math.min(1, local / clip.fadeIn) : 1;
      const fadeOut = clip.fadeOut > 0 ? Math.min(1, (clipDuration(clip) - local) / clip.fadeOut) : 1;
      audio.volume = Math.min(1, Math.max(0, clip.volume / 100 * fadeIn * fadeOut));
      if (playing) void audio.play().catch(() => undefined);
      else audio.pause();
    });
  }, [currentProject, playhead, playing]);

  useEffect(() => {
    if (page !== "settings" || !navigator.storage?.estimate) return;
    void navigator.storage.estimate().then(({ usage, quota }) => {
      if (usage != null && quota != null) setStorageEstimate(`${(usage / 1024 / 1024).toFixed(1)} MB / ${(quota / 1024 / 1024 / 1024).toFixed(1)} GB`);
    }).catch(() => setStorageEstimate("Unavailable"));
  }, [page, assets]);

  function seek(value: number) {
    const next = Math.max(0, Math.min(duration, value));
    playheadRef.current = next;
    setPlayhead(next);
  }

  function navigate(next: Page) {
    setPlaying(false);
    setProjectMenu(null);
    if (next === "studio" && !currentProject) { showDialog("new"); return; }
    setPage(next);
  }

  function openProject(id: string, destination: Page = "studio") {
    setActiveId(id);
    setSelectedClipId(null);
    setHistory({ past: [], future: [] });
    playheadRef.current = 0;
    setPlayhead(0);
    setPlaying(false);
    setProjectMenu(null);
    setPage(destination);
  }

  function enterTool(destination: "audio" | "effects" | "keyframes") {
    if (!currentProject) { showDialog("new"); return; }
    const target = destination === "audio" ? audioTarget : destination === "effects"
      ? selectedClip?.trackId === "video-1" ? selectedClip : currentProject.clips.find((clip) => clip.trackId === "video-1")
      : visualTarget;
    setSelectedClipId(target?.id ?? null);
    if (target) seek(target.position);
    if (destination === "effects" && target) { setEffectDraft({ effect: target.effect, intensity: target.intensity }); setShowBefore(false); }
    navigate(destination);
  }

  function showDialog(type: NonNullable<Dialog>["type"], projectId?: string) {
    const target = projects.find((project) => project.id === projectId);
    setDialogValue(type === "rename" ? target?.title ?? "" : "");
    setDialogRatio("16:9");
    setDialog({ type, projectId });
    setProjectMenu(null);
  }

  function submitDialog() {
    if (!dialog) return;
    const value = dialogValue.trim();
    if (dialog.type === "new") {
      const project = createProject(value || "Untitled Project", dialogRatio);
      setProjects((old) => [project, ...old]);
      openProject(project.id);
    } else if (dialog.type === "rename" && dialog.projectId && value) {
      setProjects((old) => old.map((project) => project.id === dialog.projectId ? { ...project, title: value, updatedAt: Date.now(), demo: false } : project));
    } else if (dialog.type === "delete" && dialog.projectId) {
      setProjects((old) => old.filter((project) => project.id !== dialog.projectId));
      if (activeId === dialog.projectId) {
        const next = projects.find((project) => project.id !== dialog.projectId);
        setActiveId(next?.id ?? ""); setSelectedClipId(null); setPlaying(false);
        setHistory({ past: [], future: [] }); setPage("projects");
      }
      setToast(settings.language === "tr" ? "Proje silindi." : "Project deleted.");
    } else if (dialog.type === "text" && value && currentProject) {
      const clip = createTextClip(playhead, value);
      updateProject((project) => ({ ...project, clips: [...project.clips, clip] }));
      setSelectedClipId(clip.id);
    }
    setDialog(null);
  }

  function updateProject(change: (project: Project) => Project | null) {
    if (!currentProject) return;
    const result = change(currentProject);
    if (!result || result === currentProject) return;
    setHistory((old) => ({ past: [...old.past.slice(-29), structuredClone(currentProject)], future: [] }));
    setProjects((old) => old.map((project) => project.id === currentProject.id ? { ...result, updatedAt: Date.now(), demo: false } : project));
  }

  function updateClip(clipId: string, change: (clip: Clip) => Clip) {
    updateProject((project) => ({ ...project, clips: project.clips.map((clip) => clip.id === clipId ? change(clip) : clip) }));
  }

  function undo() {
    if (!currentProject || !history.past.length) return;
    const previous = history.past[history.past.length - 1];
    setHistory((old) => ({ past: old.past.slice(0, -1), future: [structuredClone(currentProject), ...old.future] }));
    setProjects((old) => old.map((project) => project.id === currentProject.id ? previous : project));
  }

  function redo() {
    if (!currentProject || !history.future.length) return;
    const next = history.future[0];
    setHistory((old) => ({ past: [...old.past, structuredClone(currentProject)], future: old.future.slice(1) }));
    setProjects((old) => old.map((project) => project.id === currentProject.id ? next : project));
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || dialog) return;
      if (event.code === "Space" && ["studio", "audio", "keyframes", "effects"].includes(page)) {
        event.preventDefault();
        if (duration > 0) { if (playhead >= duration) seek(0); setPlaying((old) => !old); }
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault(); if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault(); redo();
      } else if (event.key === "Escape") { setProjectMenu(null); setDialog(null); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    setImporting(true);
    const imported: MediaAsset[] = [];
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const { asset, source } = await inspectFile(file);
        try {
          await storeMedia(asset.id, file);
          imported.push(asset);
          setSources((old) => ({ ...old, [asset.id]: source }));
        } catch {
          URL.revokeObjectURL(source);
          failed.push(`${file.name}: browser storage could not save this file`);
        }
      } catch (error) { failed.push(error instanceof Error ? error.message : file.name); }
    }
    if (imported.length) {
      setAssets((old) => [...old, ...imported]);
      setImportSelection((old) => [...old, ...imported.map((asset) => asset.id)]);
      setImportTab(imported[0].kind === "video" ? "Videos" : imported[0].kind === "audio" ? "Audio" : "Photos");
      setPage("import");
      setToast(`${imported.length} ${settings.language === "tr" ? "dosya içe aktarıldı." : "file(s) imported."}`);
    }
    if (failed.length) setToast(failed.slice(0, 2).join("; "));
    setImporting(false);
    if (mediaInput.current) mediaInput.current.value = "";
  }

  function goToImport(fromStudio: boolean) {
    setImportIntoCurrent(fromStudio); setImportSelection([]); navigate("import");
  }

  function addSelectedToTimeline() {
    const chosen = importSelection.map((id) => assets.find((asset) => asset.id === id)).filter((asset): asset is MediaAsset => Boolean(asset && sources[asset.id]));
    if (!chosen.length) { setToast("Select available media first."); return; }
    const base = importIntoCurrent && currentProject ? currentProject : createProject("Untitled Project");
    let working = base;
    const added: Clip[] = [];
    chosen.forEach((asset) => {
      const trackId = asset.kind === "audio" ? "audio-1" : "video-1";
      const clip = createClip(asset, trackId, endOfTrack(working, trackId));
      added.push(clip);
      working = { ...working, clips: [...working.clips, clip] };
    });
    if (base === currentProject) updateProject(() => working);
    else { setProjects((old) => [working, ...old]); setHistory({ past: [], future: [] }); }
    setActiveId(working.id); setSelectedClipId(added[0]?.id ?? null);
    setImportSelection([]);
    playheadRef.current = added[0]?.position ?? 0; setPlayhead(playheadRef.current);
    setPlaying(false); setPage("studio");
  }

  function selectClip(clip: Clip) { setSelectedClipId(clip.id); seek(clip.position); setPlaying(false); }
  function moveClip(clipId: string, trackId: string, position: number) { updateClip(clipId, (clip) => ({ ...clip, trackId, position })); seek(position); }

  function splitSelected() {
    if (!currentProject || !selectedClip) return;
    const changed = splitClip(currentProject, selectedClip.id, playhead);
    if (!changed) { setToast(settings.language === "tr" ? "Bölmek için oynatma başını klibin içine taşı." : "Move the playhead inside the clip to split it."); return; }
    updateProject(() => changed);
  }

  function duplicateSelected() {
    if (!currentProject || !selectedClip) return;
    const duplicate: Clip = { ...structuredClone(selectedClip), id: crypto.randomUUID(), position: endOfTrack(currentProject, selectedClip.trackId), keyframes: selectedClip.keyframes.map((frame) => ({ ...frame, id: crypto.randomUUID() })) };
    updateProject((project) => ({ ...project, clips: [...project.clips, duplicate] }));
    setSelectedClipId(duplicate.id); seek(duplicate.position);
  }

  function deleteSelected() {
    if (!selectedClip) return;
    updateProject((project) => ({ ...project, clips: project.clips.filter((clip) => clip.id !== selectedClip.id) }));
    setSelectedClipId(null);
  }

  function changeLength(clip: Clip, outputDuration: number) {
    const asset = assets.find((item) => item.id === clip.assetId);
    const maximum = asset && asset.kind !== "image" ? Math.max(0.2, asset.duration - clip.sourceStart) : 60;
    updateClip(clip.id, (item) => ({ ...item, sourceDuration: Math.min(maximum, Math.max(0.2, outputDuration * item.speed)) }));
  }

  function changeSpeed(clip: Clip, speed: number) {
    const nextSpeed = Math.max(0.25, Math.min(3, speed));
    updateClip(clip.id, (item) => ({ ...item, speed: nextSpeed, keyframes: item.keyframes.map((frame) => ({ ...frame, time: frame.time * item.speed / nextSpeed })) }));
  }

  function toggleTrack(trackId: string, property: "muted" | "solo") {
    updateProject((project) => ({ ...project, tracks: project.tracks.map((track) => track.id === trackId ? { ...track, [property]: !track[property] } : track) }));
  }

  function toggleKeyframe() {
    if (!visualTarget) return;
    const local = Math.max(0, Math.min(clipDuration(visualTarget), playhead - visualTarget.position));
    const existing = visualTarget.keyframes.find((frame) => Math.abs(frame.time - local) < 0.08);
    updateClip(visualTarget.id, (clip) => ({ ...clip, keyframes: existing ? clip.keyframes.filter((frame) => frame.id !== existing.id) : [...clip.keyframes, { id: crypto.randomUUID(), time: local, values: { ...sampleTransform(clip, local) } }].sort((a, b) => a.time - b.time) }));
  }

  function changeTransform(property: keyof TransformValues, value: number) {
    if (!visualTarget) return;
    const local = Math.max(0, Math.min(clipDuration(visualTarget), playhead - visualTarget.position));
    updateClip(visualTarget.id, (clip) => {
      if (!clip.keyframes.length) return { ...clip, transform: { ...clip.transform, [property]: value } };
      const existing = clip.keyframes.find((frame) => Math.abs(frame.time - local) < 0.08);
      const frames = existing ? clip.keyframes.map((frame) => frame.id === existing.id ? { ...frame, values: { ...frame.values, [property]: value } } : frame) : [...clip.keyframes, { id: crypto.randomUUID(), time: local, values: { ...sampleTransform(clip, local), [property]: value } }];
      return { ...clip, keyframes: frames.sort((a, b) => a.time - b.time) };
    });
  }

  async function backupProject(project: Project) {
    try {
      downloadBlob(await makeProjectBackup(project, assets), `${project.title.replace(/[^a-z0-9-_]/gi, "-")}.vexedit.json`);
      setToast(settings.language === "tr" ? "Taşınabilir proje yedeği indirildi." : "Portable project backup downloaded.");
    } catch (error) { setToast(error instanceof Error ? error.message : "Backup failed."); }
    setProjectMenu(null);
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error("This backup exceeds the 30 MB web preview limit.");
      const restored = await restoreProjectBackup(file);
      setProjects((old) => [restored.project, ...old]);
      setAssets((old) => [...old, ...restored.assets]);
      openProject(restored.project.id);
      setToast(settings.language === "tr" ? "Proje yedekten geri yüklendi." : "Project restored from backup.");
    } catch (error) { setToast(error instanceof Error ? error.message : "Restore failed."); }
    if (restoreInput.current) restoreInput.current.value = "";
  }

  function duplicateProject(project: Project) {
    const copy: Project = { ...structuredClone(project), id: crypto.randomUUID(), title: `${project.title} (copy)`, createdAt: Date.now(), updatedAt: Date.now(), favorite: false, demo: false, clips: project.clips.map((clip) => ({ ...structuredClone(clip), id: crypto.randomUUID(), keyframes: clip.keyframes.map((frame) => ({ ...frame, id: crypto.randomUUID() })) })) };
    setProjects((old) => [copy, ...old]); setProjectMenu(null);
    setToast(settings.language === "tr" ? "Proje çoğaltıldı." : "Project duplicated.");
  }

  async function clearUnusedMedia() {
    const unused = assets.filter((asset) => !asset.builtIn && !projects.some((project) => project.clips.some((clip) => clip.assetId === asset.id)));
    try {
      await Promise.all(unused.map((asset) => deleteMedia(asset.id)));
      unused.forEach((asset) => { if (sources[asset.id]?.startsWith("blob:")) URL.revokeObjectURL(sources[asset.id]); });
      setAssets((old) => old.filter((asset) => !unused.some((item) => item.id === asset.id)));
      setSources((old) => Object.fromEntries(Object.entries(old).filter(([id]) => !unused.some((asset) => asset.id === id))));
      setToast(`${unused.length} ${settings.language === "tr" ? "kullanılmayan dosya temizlendi." : "unused file(s) cleared."}`);
    } catch { setToast("Could not clear browser media storage."); }
  }

  async function startExport() {
    if (!currentProject) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExportStatus({ state: "running", progress: 0, message: "" });
    try {
      const file = await renderWebm(currentProject, assets, sources, exportSize, (progress) => setExportStatus({ state: "running", progress, message: "" }), controller.signal);
      downloadBlob(file, `${currentProject.title.replace(/[^a-z0-9-_]/gi, "-")}-${exportSize}p.webm`);
      setExportStatus({ state: "complete", progress: 100, message: settings.language === "tr" ? "WebM dosyası indirildi." : "WebM file downloaded." });
    } catch (error) { setExportStatus({ state: "error", progress: 0, message: error instanceof Error ? error.message : "Export failed." }); }
    finally { exportController.current = null; }
  }

  const filteredProjects = useMemo(() => {
    const found = projects.filter((project) => project.title.toLowerCase().includes(projectSearch.trim().toLowerCase()))
      .filter((project) => projectFilter === "Favorites" ? project.favorite : projectFilter === "Recent" ? project.updatedAt >= Date.now() - 7 * 24 * 60 * 60 * 1000 : true);
    return [...found].sort((a, b) => projectSort === "Name" ? a.title.localeCompare(b.title) : projectSort === "Duration" ? projectDuration(b) - projectDuration(a) : b.updatedAt - a.updatedAt);
  }, [projects, projectSearch, projectFilter, projectSort]);

  const filteredAssets = useMemo(() => {
    const kind = importTab === "Videos" ? "video" : importTab === "Photos" ? "image" : importTab === "Audio" ? "audio" : null;
    const found = assets.filter((asset) => (!kind || asset.kind === kind) && asset.name.toLowerCase().includes(importSearch.trim().toLowerCase()));
    return [...found].sort((a, b) => importSort === "name" ? a.name.localeCompare(b.name) : assets.indexOf(b) - assets.indexOf(a));
  }, [assets, importTab, importSearch, importSort]);

  const currentNav = ["import", "audio", "effects", "keyframes", "export", "modules"].includes(page) ? "studio" : page;
  const pageLabel: Record<Page, string> = {
    home: "Home", projects: "Projects", studio: currentProject?.title || "Studio",
    import: "Import Media", audio: "Audio Studio", effects: "Effects Lab", keyframes: "Keyframe Editor",
    modules: "Module Center", settings: "Settings", export: "Export Video",
  };

  function projectCard(project: Project, compact = false) {
    const cover = projectCover(project, assets);
    return (
      <div className={`project-card ${compact ? "project-card-compact" : ""}`} key={project.id}>
        <button type="button" className="project-card-image" onClick={() => openProject(project.id)} aria-label={`${t("Open")} ${project.title}`}>
          {cover ? <img src={cover} alt="" /> : <div className="project-no-cover"><Film size={28} /></div>}
          {compact && <span className="project-play"><Video size={17} /></span>}
        </button>
        {!compact && <button type="button" className="project-more" aria-label={`${project.title} options`} onClick={() => setProjectMenu(projectMenu === project.id ? null : project.id)}><EllipsisVertical size={19} /></button>}
        {projectMenu === project.id && !compact && (
          <div className="project-menu" role="menu">
            <button type="button" onClick={() => openProject(project.id)}>{t("Open")}</button>
            <button type="button" onClick={() => showDialog("rename", project.id)}>{t("Rename")}</button>
            <button type="button" onClick={() => duplicateProject(project)}>{t("Duplicate")}</button>
            <button type="button" onClick={() => void backupProject(project)}>{t("Backup")}</button>
            <button type="button" onClick={() => { setProjects((old) => old.map((item) => item.id === project.id ? { ...item, favorite: !item.favorite } : item)); setProjectMenu(null); }}>{t(project.favorite ? "Remove favorite" : "Add to favorites")}</button>
            <button type="button" className="destructive" onClick={() => showDialog("delete", project.id)}>{t("Delete")}</button>
          </div>
        )}
        <div className="project-card-info" onClick={() => openProject(project.id)}>
          <div className="project-card-title-line"><strong>{project.title}</strong>{project.favorite && <Heart size={13} fill="currentColor" />}</div>
          <div className="project-card-meta"><span>{project.ratio}</span><span>{project.demo ? t("DEMO") : new Date(project.updatedAt).toLocaleDateString(settings.language === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" })}</span><span>{formatTime(projectDuration(project)).slice(0, 5)}</span></div>
        </div>
      </div>
    );
  }

  function renderHome() {
    return <div className="page-home">
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-brand"><BrandMark size={53} /><h1>VexEdit <span>Studio</span></h1></div>
          <p className="home-question">{t("Ready to create?")}</p>
          <p className="home-description">{t("A better place for your next cut.")}</p>
          <div className="home-ctas"><button type="button" className="primary-button" onClick={() => showDialog("new")}><Plus size={19} />{t("New Project")}</button><button type="button" className="outline-button" onClick={() => goToImport(false)}><Upload size={18} />{t("Import Media")}</button></div>
        </div>
        {projects[0] && <button type="button" className="home-feature" onClick={() => openProject(projects[0].id)}><div className="home-feature-image"><img src={projectCover(projects[0], assets) || "/images/midnight-drive.jpg"} alt="" /></div><div className="home-feature-caption"><span>{t("CONTINUE EDITING")}</span><strong>{projects[0].title}</strong><ArrowRight size={19} /></div></button>}
      </section>
      <section className="home-section recent-section"><div className="section-heading"><h2>{t("Recent Projects")}</h2><button type="button" className="text-link" onClick={() => navigate("projects")}>{t("View all")}<ChevronRight size={17} /></button></div>{projects.length ? <div className="recent-strip">{[...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5).map((project) => projectCard(project, true))}</div> : <div className="empty-inline">{t("Start with a new project or restore a backup.")}</div>}</section>
      <section className="home-section quick-section"><div className="section-heading"><h2>{t("Quick Access")}</h2></div><div className="quick-grid">
        <button type="button" onClick={() => enterTool("audio")}><span className="quick-icon"><AudioLines size={25} /></span><span>{t("Audio Studio")}</span><ChevronRight size={17} className="quick-arrow" /></button>
        <button type="button" onClick={() => enterTool("effects")}><span className="quick-icon"><WandSparkles size={25} /></span><span>{t("Effects Lab")}</span><ChevronRight size={17} className="quick-arrow" /></button>
        <button type="button" onClick={() => enterTool("keyframes")}><span className="quick-icon"><SlidersHorizontal size={25} /></span><span>{t("Keyframe Editor")}</span><ChevronRight size={17} className="quick-arrow" /></button>
        <button type="button" onClick={() => navigate("modules")}><span className="quick-icon"><Layers2 size={25} /></span><span>{t("Module Center")}</span><ChevronRight size={17} className="quick-arrow" /></button>
      </div></section><div className="home-footnote"><span className="small-purple-square" />{t("Local workspace")}<span className="footnote-separator" />{t("Your edits stay on this device")}</div>
    </div>;
  }

  function renderProjects() {
    return <div className="page-projects">
      <div className="projects-title-row"><div><span className="overline">{t("YOUR WORKSPACE")}</span><h1>VexEdit Studio</h1></div><button type="button" className="primary-button compact-button" onClick={() => showDialog("new")}><Plus size={18} />{t("New Project")}</button></div>
      <div className="project-search-row"><div className="search-field"><Search size={19} /><input aria-label={t("Search projects...")} placeholder={t("Search projects...")} value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} /></div><button type="button" className="outline-button restore-button" onClick={() => restoreInput.current?.click()}><Upload size={17} />{t("Restore")}</button></div>
      <div className="filter-tabs">{["All", "Recent", "Favorites"].map((filter) => <button type="button" key={filter} className={projectFilter === filter ? "active" : ""} onClick={() => setProjectFilter(filter)}>{t(filter)}</button>)}</div>
      <div className="project-sort-row"><span>{t("Sort")}:</span><div className="select-wrap"><select aria-label="Sort projects" value={projectSort} onChange={(event) => setProjectSort(event.target.value)}><option value="Last Edited">{t("Last Edited")}</option><option value="Name">{t("Name")}</option><option value="Duration">{t("Duration")}</option></select><ChevronDown size={15} /></div><span className="project-count">{filteredProjects.length} {t("Projects").toLowerCase()}</span></div>
      {filteredProjects.length ? <div className="projects-grid">{filteredProjects.map((project) => projectCard(project))}</div> : <div className="empty-state"><FolderClosed size={34} /><h3>{t("No projects found")}</h3><p>{t("Start with a new project or restore a backup.")}</p><button type="button" className="outline-button" onClick={() => restoreInput.current?.click()}>{t("Restore")}</button></div>}
    </div>;
  }

  function renderImport() {
    return <div className="page-import">
      <div className="import-tabs">{["Videos", "Photos", "Audio", "Files"].map((tab) => <button type="button" key={tab} className={importTab === tab ? "active" : ""} onClick={() => setImportTab(tab)}>{t(tab)}</button>)}</div>
      <div className="import-toolbar"><div className="folder-label"><FolderClosed size={18} />{t("Demo media + your imports")}</div><button type="button" className="sort-text-button" onClick={() => setImportSort(importSort === "recent" ? "name" : "recent")}>{importSort === "recent" ? t("Date Modified") : t("Name")}<ChevronDown size={15} /></button></div>
      <div className="import-search-row"><div className="search-field"><Search size={17} /><input aria-label={t("Search media...")} placeholder={t("Search media...")} value={importSearch} onChange={(event) => setImportSearch(event.target.value)} /></div><button type="button" className="outline-button compact-button" onClick={() => mediaInput.current?.click()} disabled={importing}><Plus size={17} />{importing ? t("Importing...") : t("Choose Files")}</button></div>
      {filteredAssets.length ? <div className="media-grid">{filteredAssets.map((asset) => {
        const isSelected = importSelection.includes(asset.id);
        const source = asset.poster || sources[asset.id];
        return <button type="button" className={`media-tile ${isSelected ? "selected" : ""} ${asset.kind === "audio" ? "media-tile-audio" : ""}`} key={asset.id} onClick={() => setImportSelection((old) => isSelected ? old.filter((id) => id !== asset.id) : [...old, asset.id])}>
          {asset.kind === "audio" ? <div className="media-audio-icon"><Waveform peaks={asset.waveform} /></div> : source ? <img src={source} alt="" /> : <div className="media-audio-icon"><Film size={24} /></div>}
          {asset.kind === "video" && <span className="media-play"><Video size={18} /></span>}
          {isSelected && <span className="media-check"><Check size={14} /></span>}
          <div className="media-tile-bottom"><span>{asset.kind === "audio" ? asset.name : asset.kind === "image" ? t("PHOTO") : formatTime(asset.duration).slice(0, 5)}</span>{asset.kind === "video" && <span>{asset.height ? `${asset.height}p` : "VIDEO"}</span>}</div>
        </button>;
      })}</div> : <div className="empty-state media-empty"><FolderClosed size={35} /><h3>{t("No media here yet")}</h3><p>{t("Choose files from your device to get started.")}</p><button type="button" className="outline-button" onClick={() => mediaInput.current?.click()}>{t("Choose Files")}</button></div>}
      <div className="import-footer"><div className="selection-count"><strong>{importSelection.length}</strong> {t("selected")}</div><div className="import-footer-actions"><button type="button" onClick={() => setImportSelection((old) => Array.from(new Set([...old, ...filteredAssets.map((asset) => asset.id)])))}>{t("Select All")}</button><button type="button" onClick={() => setImportSelection([])}>{t("Clear Selection")}</button><button type="button" onClick={() => setImportSort(importSort === "recent" ? "name" : "recent")}>{t("Sort")}</button></div><button type="button" className="primary-button import-add" disabled={!importSelection.length} onClick={addSelectedToTimeline}>{t("Add to Timeline")}<ArrowRight size={18} /></button></div>
    </div>;
  }

  function clipProperties(clip: Clip) {
    const asset = assets.find((item) => item.id === clip.assetId);
    const isStill = asset?.kind === "image" || clip.trackId === "overlay-1";
    const canAdjustSource = asset && asset.kind !== "image";
    return <div className="properties-content">
      <div className="inspector-clip-title"><span className="inspector-type">{clip.trackId.startsWith("audio") ? t("Audio") : clip.trackId === "overlay-1" ? "TEXT" : t("Video")}</span><strong>{clip.text || asset?.name || "Missing media"}</strong></div>
      {clip.trackId === "overlay-1" && <div className="form-field"><label>{t("Title text")}</label><input value={clip.text || ""} onChange={(event) => updateClip(clip.id, (old) => ({ ...old, text: event.target.value }))} /></div>}
      {canAdjustSource && <NumberField label={`${t("Source in")} (s)`} min={0} max={Math.max(0, asset.duration - 0.2)} step={0.1} value={clip.sourceStart} onChange={(value) => { const end = clip.sourceStart + clip.sourceDuration; updateClip(clip.id, (old) => ({ ...old, sourceStart: value, sourceDuration: Math.max(0.2, Math.min(asset.duration - value, end - value)) })); }} />}
      <NumberField label={`${t("Clip length")} (s)`} min={0.2} max={isStill ? 60 : Math.max(0.2, (asset?.duration || clip.sourceDuration) / clip.speed)} step={0.1} value={clipDuration(clip)} onChange={(value) => changeLength(clip, value)} />
      {!isStill && <div className="inspector-setting"><div className="setting-row"><label>{t("Speed")}</label><span>{clip.speed.toFixed(2)}x</span></div><input type="range" min={0.25} max={3} step={0.25} value={clip.speed} onChange={(event) => changeSpeed(clip, Number(event.target.value))} /></div>}
      {!isStill && <div className="inspector-setting"><div className="setting-row"><label>{t("Volume")}</label><span>{clip.volume}%</span></div><input type="range" min={0} max={100} value={clip.volume} onChange={(event) => updateClip(clip.id, (old) => ({ ...old, volume: Number(event.target.value) }))} /></div>}
      {(clip.trackId === "video-1" || clip.trackId === "overlay-1") && <button type="button" className="inspector-link" onClick={() => enterTool("keyframes")}><SlidersHorizontal size={16} />{t("Transform")} / {t("Keyframes")}<ChevronRight size={16} /></button>}
      <div className="inspector-actions"><button type="button" onClick={splitSelected} disabled={selectedClip?.id !== clip.id}><Scissors size={17} />{t("Split")}</button><button type="button" onClick={duplicateSelected} disabled={selectedClip?.id !== clip.id}><Copy size={17} />{t("Duplicate")}</button><button type="button" className="danger-action" onClick={deleteSelected} disabled={selectedClip?.id !== clip.id}><Trash2 size={17} />{t("Delete")}</button></div>
    </div>;
  }

  function renderStudio() {
    if (!currentProject) return <div className="empty-state"><h3>{t("Create a project")}</h3><button type="button" className="primary-button" onClick={() => showDialog("new")}>{t("New Project")}</button></div>;
    return <div className="page-studio">
      {missingIds.some((id) => currentProject.clips.some((clip) => clip.assetId === id)) && <div className="warning-line"><CircleHelp size={17} />{t("Some source files are missing from browser storage. Restore a backup or re-import them.")}</div>}
      <div className="studio-columns"><div className="studio-main">
        <Preview project={currentProject} assets={assets} sources={sources} time={playhead} playing={playing} onSeek={seek} onTogglePlay={() => { if (playhead >= duration) seek(0); setPlaying((old) => !old); }} onImport={() => goToImport(true)} t={t} />
        <div className="timeline-heading"><div><span className="overline">{t("SEQUENCE")}</span><h2>{t("Timeline")}</h2></div><div className="timeline-heading-actions"><button type="button" onClick={() => goToImport(true)}><Plus size={17} />{t("Add Media")}</button><button type="button" onClick={() => showDialog("text")}><Type size={17} />{t("Add Text")}</button><span className="toolbar-divider" /><button type="button" className="square-tool" aria-label={t("Zoom out")} onClick={() => setZoom((old) => Math.max(20, old - 12))}><Minus size={17} /></button><span className="zoom-value">{Math.round(zoom / 48 * 100)}%</span><button type="button" className="square-tool" aria-label={t("Zoom in")} onClick={() => setZoom((old) => Math.min(100, old + 12))}><ZoomIn size={17} /></button></div></div>
        <Timeline project={currentProject} assets={assets} sources={sources} time={playhead} zoom={zoom} selectedClipId={selectedClipId} onSeek={seek} onSelect={selectClip} onMove={moveClip} onToggleTrack={toggleTrack} t={t} />
        <p className="timeline-hint">{t("Drag clips to move them. Click the ruler to seek.")}</p>
        <div className="editor-toolbelt">
          <button type="button" onClick={() => selectedClip ? document.getElementById("clip-inspector")?.scrollIntoView({ behavior: "smooth", block: "nearest" }) : setToast(t("Select a clip to edit"))} disabled={!selectedClip}><SlidersHorizontal size={20} />{t("Trim / Edit")}</button>
          <button type="button" onClick={splitSelected} disabled={!selectedClip}><Scissors size={20} />{t("Split")}</button>
          <button type="button" onClick={duplicateSelected} disabled={!selectedClip}><Copy size={20} />{t("Duplicate")}</button>
          <button type="button" onClick={() => enterTool("audio")}><Volume2 size={20} />{t("Audio")}</button>
          <button type="button" onClick={() => enterTool("effects")}><WandSparkles size={20} />{t("Effects")}</button>
          <button type="button" onClick={() => enterTool("keyframes")}><Sparkles size={20} />{t("Keyframes")}</button>
          <button type="button" onClick={deleteSelected} disabled={!selectedClip}><Trash2 size={20} />{t("Delete")}</button>
        </div>
      </div><aside className="inspector-panel" id="clip-inspector"><div className="inspector-header"><SlidersHorizontal size={17} /><h2>{t("Clip Properties")}</h2></div>{selectedClip ? clipProperties(selectedClip) : <div className="inspector-empty"><Maximize2 size={27} strokeWidth={1.4} /><p>{t("Select a clip to edit")}</p><span>{t("Drag clips to move them. Click the ruler to seek.")}</span></div>}</aside></div>
    </div>;
  }

  function renderAudio() {
    if (!currentProject) return null;
    const audioTracks = currentProject.tracks.filter((track) => track.kind === "audio");
    const hasAudio = currentProject.clips.some((clip) => clip.trackId.startsWith("audio-"));
    return <div className="page-audio">
      <div className="audio-preview"><Preview project={currentProject} assets={assets} sources={sources} time={playhead} playing={playing} onSeek={seek} onTogglePlay={() => setPlaying((old) => !old)} compact t={t} /></div>
      <div className="timeline-heading"><div><span className="overline">{t("AUDIO WORKSPACE")}</span><h2>{t("Audio Studio")}</h2></div><div className="timeline-heading-actions"><button type="button" onClick={() => goToImport(true)}><Plus size={17} />{t("Add Media")}</button><button type="button" className="square-tool" aria-label={t("Zoom out")} onClick={() => setZoom((old) => Math.max(20, old - 12))}><Minus size={17} /></button><button type="button" className="square-tool" aria-label={t("Zoom in")} onClick={() => setZoom((old) => Math.min(100, old + 12))}><ZoomIn size={17} /></button></div></div>
      {hasAudio ? <Timeline project={currentProject} assets={assets} sources={sources} time={playhead} zoom={zoom} selectedClipId={selectedClipId} onSeek={seek} onSelect={selectClip} onMove={moveClip} onToggleTrack={toggleTrack} audioOnly t={t} /> : <div className="empty-state audio-empty"><AudioLines size={34} /><h3>{t("No audio clips yet")}</h3><p>{t("Import an audio file to edit its levels, fades and timing.")}</p><button type="button" className="primary-button compact-button" onClick={() => goToImport(true)}>{t("Import Media")}</button></div>}
      {hasAudio && <div className="audio-lower"><div className="audio-mixer"><div className="section-heading"><h2>{t("Mixer")}</h2></div><div className="mixer-channels">{audioTracks.map((track) => {
        const first = currentProject.clips.find((clip) => clip.trackId === track.id);
        return <div className="mixer-channel" key={track.id}><div className="mixer-channel-top"><Music2 size={18} /><span>{track.name}</span></div><div className="mixer-slider-row"><input type="range" aria-label={`${track.name} volume`} min={0} max={100} value={first?.volume ?? 100} disabled={!first} onChange={(event) => updateProject((project) => ({ ...project, clips: project.clips.map((clip) => clip.trackId === track.id ? { ...clip, volume: Number(event.target.value) } : clip) }))} /><span>{first ? `${first.volume}%` : "--"}</span></div><div className="mixer-switches"><button type="button" className={track.muted ? "active" : ""} onClick={() => toggleTrack(track.id, "muted")}>M</button><button type="button" className={track.solo ? "active" : ""} onClick={() => toggleTrack(track.id, "solo")}>S</button></div></div>;
      })}</div></div><div className="audio-detail"><div className="section-heading"><h2>{t("Selected audio")}</h2></div>{audioTarget ? <><p className="detail-name">{assets.find((asset) => asset.id === audioTarget.assetId)?.name}</p><div className="inspector-setting"><div className="setting-row"><label>{t("Volume")}</label><span>{audioTarget.volume}%</span></div><input type="range" min={0} max={100} value={audioTarget.volume} onChange={(event) => updateClip(audioTarget.id, (clip) => ({ ...clip, volume: Number(event.target.value) }))} /></div><div className="fade-fields"><NumberField label={`${t("Fade in")} (s)`} value={audioTarget.fadeIn} min={0} max={clipDuration(audioTarget) / 2} step={0.1} onChange={(value) => updateClip(audioTarget.id, (clip) => ({ ...clip, fadeIn: value }))} /><NumberField label={`${t("Fade out")} (s)`} value={audioTarget.fadeOut} min={0} max={clipDuration(audioTarget) / 2} step={0.1} onChange={(value) => updateClip(audioTarget.id, (clip) => ({ ...clip, fadeOut: value }))} /></div><div className="inspector-actions"><button type="button" onClick={splitSelected} disabled={selectedClipId !== audioTarget.id}><Scissors size={16} />{t("Split")}</button><button type="button" onClick={duplicateSelected} disabled={selectedClipId !== audioTarget.id}><Copy size={16} />{t("Duplicate")}</button><button type="button" onClick={deleteSelected} disabled={selectedClipId !== audioTarget.id}><Trash2 size={16} />{t("Delete")}</button></div></> : <p className="muted-copy">{t("Select a clip to edit")}</p>}</div></div>}
    </div>;
  }

  function renderEffects() {
    if (!currentProject) return null;
    if (!visualTarget || visualTarget.trackId !== "video-1") return <div className="empty-state"><WandSparkles size={34} /><h3>{t("Choose a video, photo or text clip first.")}</h3><button type="button" className="outline-button" onClick={() => navigate("studio")}>{t("Studio")}</button></div>;
    const cover = assets.find((asset) => asset.id === visualTarget.assetId)?.poster || sources[visualTarget.assetId || ""];
    return <div className="page-effects">
      <div className="effects-preview"><Preview project={currentProject} assets={assets} sources={sources} time={Math.max(visualTarget.position, playhead)} effectOverride={{ ...effectDraft, before: showBefore }} controls={false} t={t} /></div>
      <div className="compare-bar"><span>{t("Before")}</span><button type="button" role="switch" aria-checked={!showBefore} className={`compare-switch ${showBefore ? "before" : ""}`} onClick={() => setShowBefore((old) => !old)} aria-label="Toggle before and after"><span /></button><span>{t("After")}</span><p>{showBefore ? t("Before") : t("After")}</p></div>
      <div className="effect-categories">{["All", "Color", "Cinematic"].map((category) => <button type="button" key={category} className={effectCategory === category ? "active" : ""} onClick={() => setEffectCategory(category)}>{t(category)}</button>)}</div>
      <div className="effects-grid">{effectOptions.filter((option) => effectCategory === "All" || option.category === effectCategory).map((option) => <button type="button" key={option.type} className={`effect-option ${effectDraft.effect === option.type ? "active" : ""}`} onClick={() => { setEffectDraft((old) => ({ ...old, effect: option.type })); setShowBefore(false); }}><div className="effect-option-image">{cover ? <img src={cover} alt="" style={{ filter: effectFilter(option.type, effectDraft.intensity) }} /> : <Film size={25} />}</div><span>{t(option.label)}</span></button>)}</div>
      <div className="effect-adjust"><div className="setting-row"><label>{t("Intensity")}</label><span>{effectDraft.intensity}%</span></div><input type="range" min={0} max={100} step={1} value={effectDraft.intensity} disabled={effectDraft.effect === "none"} onChange={(event) => setEffectDraft((old) => ({ ...old, intensity: Number(event.target.value) }))} /></div>
      <div className="effect-actions"><button type="button" className="secondary-button" onClick={() => navigate("studio")}>{t("Cancel")}</button><button type="button" className="primary-button" onClick={() => { updateClip(visualTarget.id, (clip) => ({ ...clip, effect: effectDraft.effect, intensity: effectDraft.intensity })); navigate("studio"); setToast(settings.language === "tr" ? "Efekt klibe uygulandı." : "Effect applied to clip."); }}>{t("Apply")}</button></div>
    </div>;
  }

  function renderKeyframes() {
    if (!currentProject) return null;
    if (!visualTarget) return <div className="empty-state"><Sparkles size={34} /><h3>{t("Choose a video, photo or text clip first.")}</h3><button type="button" className="outline-button" onClick={() => navigate("studio")}>{t("Studio")}</button></div>;
    const local = Math.max(0, Math.min(clipDuration(visualTarget), playhead - visualTarget.position));
    const values = sampleTransform(visualTarget, local);
    const hasFrame = visualTarget.keyframes.some((frame) => Math.abs(frame.time - local) < 0.08);
    const fields: { key: keyof TransformValues; label: string; min: number; max: number; suffix: string }[] = [
      { key: "x", label: "Position X", min: -100, max: 100, suffix: "%" },
      { key: "y", label: "Position Y", min: -100, max: 100, suffix: "%" },
      { key: "scale", label: "Scale", min: 10, max: 250, suffix: "%" },
      { key: "rotation", label: "Rotation", min: -180, max: 180, suffix: "°" },
      { key: "opacity", label: "Opacity", min: 0, max: 100, suffix: "%" },
    ];
    const previous = [...visualTarget.keyframes].reverse().find((frame) => frame.time < local - 0.08);
    const next = visualTarget.keyframes.find((frame) => frame.time > local + 0.08);
    return <div className="page-keyframes">
      <div className="keyframe-upper"><div className="keyframe-preview"><Preview project={currentProject} assets={assets} sources={sources} time={playhead} controls={false} t={t} /></div><div className="keyframe-controls"><div className="keyframe-panel-top"><div><span className="overline">{t("SELECTED CLIP")}</span><h2>{visualTarget.text || assets.find((asset) => asset.id === visualTarget.assetId)?.name || "Text"}</h2></div><span className="keyframe-time">{formatTime(local)}</span></div><div className="transform-fields">{fields.map((field) => <div className="transform-field" key={field.key}><label>{t(field.label)}</label><div className="transform-input"><input type="number" aria-label={t(field.label)} min={field.min} max={field.max} step={1} value={Math.round(values[field.key])} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) changeTransform(field.key, Math.max(field.min, Math.min(field.max, value))); }} /><span>{field.suffix}</span></div><span className={`keyframe-diamond-indicator ${hasFrame ? "filled" : ""}`} title={hasFrame ? "Keyframe at playhead" : "Base value"} /></div>)}</div><div className="interpolation-note"><Sparkles size={15} />{t("Linear interpolation")}</div></div></div>
      <div className="keyframe-timeline"><div className="keyframe-timeline-title"><span>{t("Keyframes")}</span><span>{formatTime(local)} / {formatTime(clipDuration(visualTarget))}</span></div><div className="keyframe-ruler" onClick={(event) => seek(visualTarget.position + Math.max(0, Math.min(clipDuration(visualTarget), (event.clientX - event.currentTarget.getBoundingClientRect().left) / event.currentTarget.clientWidth * clipDuration(visualTarget))))}><div className="keyframe-line" /><span className="keyframe-current" style={{ left: `${local / clipDuration(visualTarget) * 100}%` }} />{visualTarget.keyframes.map((frame) => <button type="button" key={frame.id} className="keyframe-marker" style={{ left: `${frame.time / clipDuration(visualTarget) * 100}%` }} onClick={(event) => { event.stopPropagation(); seek(visualTarget.position + frame.time); }} aria-label={`Keyframe at ${formatTime(frame.time)}`} />)}</div></div>
      <div className="keyframe-actions"><button type="button" disabled={!previous} onClick={() => previous && seek(visualTarget.position + previous.time)}><ArrowLeft size={19} />{t("Previous Keyframe")}</button><button type="button" className="keyframe-primary" onClick={toggleKeyframe}><span className="diamond-glyph" />{t(hasFrame ? "Remove Keyframe" : "Add Keyframe")}</button><button type="button" disabled={!next} onClick={() => next && seek(visualTarget.position + next.time)}>{t("Next Keyframe")}<ArrowRight size={19} /></button></div>
    </div>;
  }

  function renderModules() {
    const tools = [
      { name: "Audio Studio", category: "Audio", description: "Levels, fades and multi-track timing", icon: <AudioLines size={24} />, action: () => enterTool("audio") },
      { name: "Color looks", category: "Effects", description: "Four real-time color looks", icon: <WandSparkles size={24} />, action: () => enterTool("effects") },
      { name: "Motion keyframes", category: "Video", description: "Linear position, scale and opacity", icon: <Sparkles size={24} />, action: () => enterTool("keyframes") },
      { name: "Project backup", category: "Utilities", description: "Portable backups up to 20 MB", icon: <FileArchive size={24} />, action: () => navigate("projects") },
    ];
    const visible = tools.filter((tool) => (moduleCategory === "All" || moduleCategory === tool.category) && tool.name.toLowerCase().includes(moduleSearch.toLowerCase()));
    return <div className="page-modules"><div className="modules-intro"><span className="overline">{t("VEXEDIT TOOLKIT")}</span><h1>{t("Built-in tools")}</h1><p>{t("These tools are included locally. Downloadable packs are not available in this preview.")}</p></div><div className="module-tabs">{["All", "Video", "Audio", "Effects", "Utilities"].map((category) => <button type="button" key={category} className={moduleCategory === category ? "active" : ""} onClick={() => setModuleCategory(category)}>{t(category)}</button>)}</div><div className="search-field module-search"><Search size={18} /><input aria-label={t("Search tools...")} placeholder={t("Search tools...")} value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} /></div><div className="module-list">{visible.map((tool) => <div className="module-row" key={tool.name}><div className="module-icon">{tool.icon}</div><div className="module-text"><h3>{t(tool.name)}</h3><p>{t(tool.description)}</p></div><div className="module-action"><span><Check size={13} />{t("Included")}</span><button type="button" onClick={tool.action}>{t("Open")}</button></div></div>)}</div>{!visible.length && <div className="empty-state">{t("No tools match your search.")}</div>}</div>;
  }

  function renderSettings() {
    return <div className="page-settings"><div className="settings-intro"><span className="overline">{t("PREFERENCES")}</span><h1>{t("Settings")}</h1><p>{t("Local workspace")} · {t("Your edits stay on this device")}</p></div>
      <section className="settings-section"><div className="settings-section-title"><h2>{t("Language")}</h2><p>{t("Choose the interface language")}</p></div><div className="segmented-choice"><button type="button" className={settings.language === "en" ? "active" : ""} onClick={() => setSettings((old) => ({ ...old, language: "en" }))}>English</button><button type="button" className={settings.language === "tr" ? "active" : ""} onClick={() => setSettings((old) => ({ ...old, language: "tr" }))}>Türkçe</button></div></section>
      <section className="settings-section"><div className="settings-section-title"><h2>{t("Performance profile")}</h2><p>{t("Changes the web preview control refresh rate. Native decoder and export profiles require the Android build.")}</p></div><div className="segmented-choice">{(["low", "medium", "high"] as const).map((profile) => <button type="button" key={profile} className={settings.profile === profile ? "active" : ""} onClick={() => setSettings((old) => ({ ...old, profile }))}>{t(profile[0].toUpperCase() + profile.slice(1))}<small>{profile === "low" ? "12 fps" : profile === "medium" ? "25 fps" : "60 fps"}</small></button>)}</div></section>
      <section className="settings-section"><div className="settings-section-title"><h2>{t("Storage")}</h2><p>{t("Imported files are saved in this browser. Clearing unused imports never removes media from a project.")}</p></div><div className="storage-details"><div><span>{t("Browser storage")}</span><strong>{storageEstimate || t("Checking...")}</strong></div><div><span>{t("Files")}</span><strong>{assets.filter((asset) => !asset.builtIn).length} {t("imported")}</strong></div><button type="button" className="outline-button" onClick={() => void clearUnusedMedia()}>{t("Clear unused imports")}</button></div></section>
      <div className="settings-note"><CircleHelp size={18} /><div><strong>{t("Design preview")} · {t("Not an Android APK")}</strong><p>Android Media3 export, hardware profiles, installable modules and APK delivery are separate native development stages.</p></div></div>
    </div>;
  }

  function renderExport() {
    if (!currentProject) return null;
    const supported = webmSupported();
    const visualCount = currentProject.clips.filter((clip) => clip.trackId === "video-1").length;
    return <div className="page-export"><div className="export-intro"><span className="overline">{t("RENDER QUEUE / 01")}</span><h1>{t("Export Video")}</h1><p>{currentProject.title} <span>·</span> {formatTime(projectDuration(currentProject))} <span>·</span> {currentProject.ratio}</p></div><div className="export-layout"><div className="export-preview"><Preview project={currentProject} assets={assets} sources={sources} time={Math.min(playhead, Math.max(0, duration - 0.01))} controls={false} t={t} /><div className="export-preview-caption"><Film size={17} />{visualCount} {settings.language === "tr" ? t("visual clips") : visualCount === 1 ? "visual clip" : "visual clips"}</div></div><div className="export-options"><div className="export-option-heading"><h2>{t("Output settings")}</h2><span>WEBM / 24 FPS</span></div><div className="option-group"><label>{t("Resolution")}</label><div className="resolution-grid">{([480, 720, 1080, 2048, 2160] as const).map((size) => <button type="button" key={size} disabled={size > 720} title={size > 720 ? t("Requires Android media engine") : ""} className={exportSize === size ? "active" : ""} onClick={() => { if (size === 480 || size === 720) setExportSize(size); }}>{size === 2048 ? "2K" : size === 2160 ? "4K" : `${size}p`}</button>)}</div></div><div className="export-specs"><div><span>{t("Format")}</span><strong>WebM</strong></div><div><span>{t("Frame rate")}</span><strong>24 fps</strong></div><div><span>Audio</span><strong>{t("Not included")}</strong></div></div><div className="export-disclaimer"><CircleHelp size={18} /><p>{t("This design preview exports silent WebM at 24 fps. Audio, MP4, 1080p and above need the Android media engine.")}</p></div>{exportStatus.state === "running" && <div className="export-progress"><div className="setting-row"><span>{t("Recording timeline...")}</span><strong>{exportStatus.progress}%</strong></div><div className="progress-rail"><span style={{ width: `${exportStatus.progress}%` }} /></div></div>}{exportStatus.state === "complete" && <div className="export-success"><Check size={18} />{t("Export complete")}. {exportStatus.message}</div>}{exportStatus.state === "error" && <div className="export-error">{exportStatus.message}</div>}{exportStatus.state === "running" ? <button type="button" className="outline-button export-start" onClick={() => exportController.current?.abort()}>{t("Cancel Export")}</button> : <button type="button" className="primary-button export-start" disabled={!supported || !visualCount} onClick={() => void startExport()}><Download size={18} />{t("Start Export")}</button>}{!supported && <p className="unsupported-note">{t("Browser-supported WebM video only")}: this browser cannot record WebM.</p>}</div></div></div>;
  }

  function renderPage() {
    switch (page) {
      case "home": return renderHome();
      case "projects": return renderProjects();
      case "import": return renderImport();
      case "studio": return renderStudio();
      case "audio": return renderAudio();
      case "effects": return renderEffects();
      case "keyframes": return renderKeyframes();
      case "modules": return renderModules();
      case "settings": return renderSettings();
      case "export": return renderExport();
    }
  }

  return <div className="app-shell">
    <input type="file" ref={mediaInput} className="visually-hidden" multiple accept="video/*,image/*,audio/*" onChange={(event) => void importFiles(event.target.files)} />
    <input type="file" ref={restoreInput} className="visually-hidden" accept=".json,.vexedit.json,application/json" onChange={(event) => void restoreBackup(event.target.files?.[0])} />
    <aside className="desktop-sidebar"><button type="button" className="sidebar-brand" onClick={() => navigate("home")}><BrandMark size={41} /><span><strong>VexEdit</strong><small>STUDIO</small></span></button><div className="sidebar-label">WORKSPACE</div><nav className="sidebar-nav" aria-label="Main navigation">{(["home", "projects", "studio", "modules", "settings"] as Page[]).map((item) => <button type="button" key={item} className={currentNav === item || page === item ? "active" : ""} onClick={() => navigate(item)}>{item === "modules" ? <Layers2 size={21} /> : navIcon(item)}<span>{t(item === "modules" ? "Module Center" : item[0].toUpperCase() + item.slice(1))}</span>{(currentNav === item || page === item) && <motion.i layoutId="desktop-nav-indicator" />}</button>)}</nav><div className="sidebar-bottom"><span className="sidebar-status-dot" /><div><strong>{t("Local workspace")}</strong><span>{t("Your edits stay on this device")}</span></div></div></aside>
    <div className="app-main"><header className={`topbar ${page === "home" ? "topbar-home" : ""}`}><div className="topbar-left">{!["home", "projects", "settings"].includes(page) && <button type="button" className="icon-button back-button" aria-label="Back" onClick={() => navigate(["import", "modules"].includes(page) ? "home" : ["audio", "effects", "keyframes", "export"].includes(page) ? "studio" : "projects")}><ArrowLeft size={21} /></button>}<div className="topbar-title"><span className="topbar-breadcrumb">VEXEDIT / {page === "home" ? "WORKSPACE" : currentNav.toUpperCase()}</span><strong>{t(pageLabel[page])}</strong></div></div>
      <div className="topbar-actions">{["studio", "audio", "keyframes"].includes(page) && <><button type="button" className="icon-button" title={t("Undo")} aria-label={t("Undo")} disabled={!history.past.length} onClick={undo}><Undo2 size={21} /></button><button type="button" className="icon-button redo-button" title={t("Redo")} aria-label={t("Redo")} disabled={!history.future.length} onClick={redo}><Redo2 size={21} /></button><span className="saved-label">{savedLocally && <Check size={15} />}{t(savedLocally ? "Saved locally" : "Not saved")}</span></>}{page === "studio" && <button type="button" className="primary-button top-export" onClick={() => navigate("export")}>{t("Export")}<ArrowRight size={16} /></button>}{page === "keyframes" && <button type="button" className="text-link" onClick={() => navigate("studio")}>{t("Save")}</button>}{page === "import" && <button type="button" className="icon-button mobile-add-file" aria-label={t("Choose Files")} onClick={() => mediaInput.current?.click()}><Plus size={21} /></button>}{page === "projects" && <button type="button" className="icon-button mobile-restore" aria-label={t("Restore")} onClick={() => restoreInput.current?.click()}><Upload size={19} /></button>}{page === "home" && <span className="topbar-workspace"><span /> {t("Local workspace")}</span>}</div></header>
      <main className={`page-container page-container-${page}`}><AnimatePresence mode="wait"><motion.div key={page} className="page-animation" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2, ease: "easeOut" }}>{renderPage()}</motion.div></AnimatePresence></main>
    </div>
    {page !== "import" && <nav className="mobile-bottom-nav" aria-label="Bottom navigation">{(["home", "projects", "studio", "settings"] as Page[]).map((item) => <button type="button" key={item} className={currentNav === item ? "active" : ""} onClick={() => navigate(item)}>{currentNav === item && <motion.i layoutId="mobile-nav-indicator" />}{navIcon(item, 23)}<span>{t(item[0].toUpperCase() + item.slice(1))}</span></button>)}</nav>}
    <AnimatePresence>{dialog && <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><motion.div className="dialog-panel" role="dialog" aria-modal="true" aria-label={t(dialog.type === "new" ? "Create a project" : dialog.type === "rename" ? "Rename project" : dialog.type === "delete" ? "Delete project?" : "Add a title")} initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}><div className="dialog-header"><h2>{t(dialog.type === "new" ? "Create a project" : dialog.type === "rename" ? "Rename project" : dialog.type === "delete" ? "Delete project?" : "Add a title")}</h2><button type="button" className="icon-button" aria-label="Close" onClick={() => setDialog(null)}><X size={20} /></button></div>{dialog.type === "delete" ? <p className="dialog-description">{t("The project will be removed from this browser. Export a backup first if you need it later.")}</p> : <div className="dialog-form"><label htmlFor="dialog-value">{t(dialog.type === "text" ? "Title text" : "Project name")}</label><input id="dialog-value" autoFocus placeholder={dialog.type === "text" ? "YOUR TITLE" : "Untitled Project"} value={dialogValue} onChange={(event) => setDialogValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitDialog(); }} />{dialog.type === "new" && <><label>{t("Aspect ratio")}</label><div className="ratio-choice">{(["16:9", "9:16", "1:1"] as AspectRatio[]).map((ratio) => <button type="button" key={ratio} className={dialogRatio === ratio ? "active" : ""} onClick={() => setDialogRatio(ratio)}>{ratio}</button>)}</div></>}</div>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>{t("Cancel")}</button><button type="button" className={`primary-button ${dialog.type === "delete" ? "delete-confirm" : ""}`} disabled={(dialog.type === "rename" || dialog.type === "text") && !dialogValue.trim()} onClick={submitDialog}>{t(dialog.type === "delete" ? "Delete" : dialog.type === "rename" ? "Save" : dialog.type === "text" ? "Add Text" : "Create")}</button></div></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span className="small-purple-square" />{toast}<button type="button" aria-label="Dismiss message" onClick={() => setToast("")}><X size={15} /></button></motion.div>}</AnimatePresence>
  </div>;
}
