import { useEffect, useRef } from "react";
import { AudioLines, GripVertical, Music2, Type, Video } from "lucide-react";
import { clipDuration, formatTime, projectDuration } from "../lib/editor";
import type { Clip, MediaAsset, Project, Track } from "../lib/types";

export function Waveform({ peaks, color = "#d4c8e6" }: { peaks?: number[]; color?: string }) {
  if (!peaks?.length) return <AudioLines size={19} strokeWidth={1.5} />;
  return (
    <div className="waveform" aria-hidden="true">
      {peaks.map((peak, index) => <i key={index} style={{ height: `${Math.max(12, peak * 88)}%`, backgroundColor: color }} />)}
    </div>
  );
}

interface TimelineProps {
  project: Project;
  assets: MediaAsset[];
  sources: Record<string, string>;
  time: number;
  zoom: number;
  selectedClipId: string | null;
  onSeek: (time: number) => void;
  onSelect: (clip: Clip) => void;
  onMove: (clipId: string, trackId: string, position: number) => void;
  onToggleTrack: (trackId: string, property: "muted" | "solo") => void;
  audioOnly?: boolean;
  t: (key: string) => string;
}

export function Timeline({ project, assets, sources, time, zoom, selectedClipId, onSeek, onSelect, onMove, onToggleTrack, audioOnly = false, t }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tracks = project.tracks.filter((track) => !audioOnly || track.kind === "audio");
  const duration = projectDuration(project);
  const seconds = Math.max(25, Math.ceil(duration + 5));
  const width = seconds * zoom;

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    const position = time * zoom;
    if (position > viewport.scrollLeft + viewport.clientWidth - 80 || position < viewport.scrollLeft) {
      viewport.scrollTo({ left: Math.max(0, position - viewport.clientWidth * 0.35), behavior: "smooth" });
    }
  }, [time, zoom]);

  const trackIcon = (track: Track) => track.kind === "video" ? <Video size={14} /> : track.kind === "audio" ? <Music2 size={14} /> : <Type size={14} />;

  return (
    <div className="timeline-shell">
      <div className="timeline-gutter">
        <div className="timeline-gutter-top"><span>{t("TRACKS")}</span></div>
        {tracks.map((track) => (
          <div className="timeline-track-label" key={track.id}>
            <div className="track-label-main">{trackIcon(track)}<span>{track.name}</span></div>
            {track.kind === "audio" && <div className="track-switches">
              <button type="button" title={t("Mute")} aria-label={`${t("Mute")} ${track.name}`} className={track.muted ? "on" : ""} onClick={() => onToggleTrack(track.id, "muted")}>M</button>
              <button type="button" title={t("Solo")} aria-label={`${t("Solo")} ${track.name}`} className={track.solo ? "on" : ""} onClick={() => onToggleTrack(track.id, "solo")}>S</button>
            </div>}
          </div>
        ))}
      </div>
      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline-content" style={{ width }}>
          <div className="timeline-ruler" onClick={(event) => onSeek(Math.max(0, Math.min(duration, (event.clientX - event.currentTarget.getBoundingClientRect().left) / zoom)))}>
            {Array.from({ length: Math.ceil(seconds / 5) + 1 }, (_, index) => (
              <span key={index} className="ruler-label" style={{ left: index * 5 * zoom }}>{formatTime(index * 5).slice(0, 5)}</span>
            ))}
            {Array.from({ length: seconds + 1 }, (_, index) => (
              <i key={index} className={index % 5 === 0 ? "major" : ""} style={{ left: index * zoom }} />
            ))}
          </div>
          {tracks.map((track) => (
            <div
              className="timeline-track-row"
              key={track.id}
              onClick={(event) => {
                if (event.target === event.currentTarget) onSeek(Math.max(0, Math.min(duration, (event.clientX - event.currentTarget.getBoundingClientRect().left) / zoom)));
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const clipId = event.dataTransfer.getData("text/vexedit-clip");
                const clip = project.clips.find((item) => item.id === clipId);
                const sourceTrack = project.tracks.find((item) => item.id === clip?.trackId);
                if (!clip || sourceTrack?.kind !== track.kind) return;
                const position = Math.max(0, Math.round((event.clientX - event.currentTarget.getBoundingClientRect().left) / zoom * 2) / 2);
                onMove(clipId, track.id, position);
              }}
            >
              {project.clips.filter((clip) => clip.trackId === track.id).map((clip) => {
                const asset = assets.find((item) => item.id === clip.assetId);
                const source = asset?.poster || (clip.assetId ? sources[clip.assetId] : undefined);
                const isVisual = track.kind === "video";
                return (
                  <button
                    key={clip.id}
                    type="button"
                    draggable
                    onDragStart={(event) => { event.dataTransfer.setData("text/vexedit-clip", clip.id); event.dataTransfer.effectAllowed = "move"; }}
                    onClick={(event) => { event.stopPropagation(); onSelect(clip); }}
                    className={`timeline-clip ${track.kind} ${selectedClipId === clip.id ? "selected" : ""}`}
                    style={{ left: clip.position * zoom, width: Math.max(clipDuration(clip) * zoom, 28), backgroundImage: isVisual && source ? `linear-gradient(90deg, rgba(0,0,0,.1), rgba(0,0,0,.36)), url("${source}")` : undefined }}
                    title={`${clip.text || asset?.name || "Missing media"} · ${formatTime(clipDuration(clip))}`}
                  >
                    {track.kind === "audio" && <Waveform peaks={asset?.waveform} color={track.id === "audio-1" ? "#78d5bf" : "#e7b677"} />}
                    {track.kind !== "audio" && <span className="clip-name">{clip.text || asset?.name || "Missing media"}</span>}
                    {track.kind === "audio" && <span className="clip-audio-name">{asset?.name || "Missing media"}</span>}
                    {clip.keyframes.map((keyframe) => (
                      <span className="clip-keyframe" key={keyframe.id} style={{ left: `${Math.min(98, keyframe.time / clipDuration(clip) * 100)}%` }} />
                    ))}
                    {selectedClipId === clip.id && <GripVertical className="clip-grip" size={13} />}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="timeline-playhead" style={{ left: time * zoom }}><span /></div>
        </div>
      </div>
    </div>
  );
}