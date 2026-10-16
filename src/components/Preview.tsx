import { useEffect, useRef } from "react";
import { Expand, Film, Pause, Play } from "lucide-react";
import { activeClip, effectFilter, formatTime, projectDuration, ratioValue, sampleTransform } from "../lib/editor";
import type { EffectType, MediaAsset, Project } from "../lib/types";

interface PreviewProps {
  project: Project;
  assets: MediaAsset[];
  sources: Record<string, string>;
  time: number;
  playing?: boolean;
  onSeek?: (time: number) => void;
  onTogglePlay?: () => void;
  onImport?: () => void;
  effectOverride?: { effect: EffectType; intensity: number; before: boolean };
  controls?: boolean;
  compact?: boolean;
  t: (key: string) => string;
}

export function Preview({ project, assets, sources, time, playing = false, onSeek, onTogglePlay, onImport, effectOverride, controls = true, compact = false, t }: PreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const total = projectDuration(project);
  const visual = activeClip(project, "video-1", time);
  const overlay = activeClip(project, "overlay-1", time);
  const asset = assets.find((item) => item.id === visual?.assetId);
  const source = visual?.assetId ? sources[visual.assetId] : undefined;
  const transform = visual ? sampleTransform(visual, time - visual.position) : null;
  const overlayTransform = overlay ? sampleTransform(overlay, time - overlay.position) : null;
  const appliedEffect = effectOverride?.before ? "none" : effectOverride?.effect ?? visual?.effect ?? "none";
  const appliedIntensity = effectOverride && !effectOverride.before ? effectOverride.intensity : visual?.intensity ?? 100;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !visual || asset?.kind !== "video") return;
    const expected = visual.sourceStart + (time - visual.position) * visual.speed;
    video.playbackRate = visual.speed;
    video.volume = Math.min(1, Math.max(0, visual.volume / 100));
    if (video.readyState >= 1 && Math.abs(video.currentTime - expected) > 0.18) video.currentTime = expected;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [time, playing, visual, asset?.kind, source]);

  const visualStyle = transform ? {
    transform: `translate(${transform.x / 2}%, ${transform.y / 2}%) rotate(${transform.rotation}deg) scale(${transform.scale / 100})`,
    opacity: transform.opacity / 100,
    filter: effectFilter(appliedEffect, appliedIntensity),
  } : undefined;
  const overlayStyle = overlayTransform ? {
    left: `calc(50% + ${overlayTransform.x / 2}%)`,
    top: `calc(50% + ${overlayTransform.y / 2}%)`,
    transform: `translate(-50%, -50%) rotate(${overlayTransform.rotation}deg) scale(${overlayTransform.scale / 100})`,
    opacity: overlayTransform.opacity / 100,
  } : undefined;

  return (
    <div className={`preview-block ${compact ? "preview-compact" : ""}`}>
      <div className="preview-stage">
        <div className="preview-frame" ref={frameRef} style={{ aspectRatio: ratioValue(project.ratio) }}>
          {visual && asset && source ? (
            asset.kind === "video" ? (
              <video
                key={`${visual.id}-${source}`}
                ref={videoRef}
                className="preview-media"
                src={source}
                style={visualStyle}
                playsInline
                preload="auto"
                onLoadedMetadata={(event) => {
                  event.currentTarget.currentTime = visual.sourceStart + (time - visual.position) * visual.speed;
                }}
              />
            ) : (
              <img className="preview-media" src={source} alt={asset.name} style={visualStyle} />
            )
          ) : (
            <div className="preview-empty">
              <Film size={28} strokeWidth={1.5} />
              <span>{visual && !source ? t("Source media is unavailable") : t("No visual media at this time")}</span>
              {!project.clips.length && onImport && <button type="button" className="text-action" onClick={onImport}>{t("Add Media")}</button>}
            </div>
          )}
          {overlay?.text && <div className="preview-title-overlay" style={overlayStyle}>{overlay.text}</div>}
        </div>
      </div>
      {controls && (
        <div className="preview-controls">
          <button type="button" className="icon-button preview-play" onClick={onTogglePlay} aria-label={playing ? t("Pause") : t("Play")} disabled={total === 0}>
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <span className="time-readout">{formatTime(time)}</span>
          <input aria-label="Seek preview" className="seek-slider" type="range" min={0} max={Math.max(total, 0.01)} step={0.01} value={Math.min(time, Math.max(total, 0.01))} onChange={(event) => onSeek?.(Number(event.target.value))} disabled={total === 0} />
          <span className="time-readout muted-time">{formatTime(total)}</span>
          <button type="button" className="icon-button" aria-label="Fullscreen preview" onClick={() => void frameRef.current?.requestFullscreen?.()}><Expand size={18} /></button>
        </div>
      )}
    </div>
  );
}