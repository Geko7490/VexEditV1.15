import { activeClip, effectFilter, projectDuration, ratioValue, sampleTransform } from "./editor";
import type { Clip, MediaAsset, Project } from "./types";

type Drawable = HTMLImageElement | HTMLVideoElement;

function drawCover(context: CanvasRenderingContext2D, source: Drawable, width: number, height: number, clip: Clip, time: number): void {
  const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  if (!sourceWidth || !sourceHeight) return;
  const size = Math.max(width / sourceWidth, height / sourceHeight);
  const transform = sampleTransform(clip, time - clip.position);
  context.save();
  context.translate(width / 2 + transform.x * width / 200, height / 2 + transform.y * height / 200);
  context.rotate(transform.rotation * Math.PI / 180);
  context.scale(transform.scale / 100, transform.scale / 100);
  context.globalAlpha = transform.opacity / 100;
  context.filter = effectFilter(clip.effect, clip.intensity);
  context.drawImage(source, -sourceWidth * size / 2, -sourceHeight * size / 2, sourceWidth * size, sourceHeight * size);
  context.restore();
}

export function webmSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].some((type) => MediaRecorder.isTypeSupported(type));
}

export async function renderWebm(
  project: Project,
  assets: MediaAsset[],
  sources: Record<string, string>,
  size: 480 | 720,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  if (!webmSupported()) throw new Error("WebM canvas recording is not supported by this browser.");
  const duration = projectDuration(project);
  if (!project.clips.some((clip) => clip.trackId === "video-1")) throw new Error("Add a video or photo clip before exporting.");
  if (duration > 90) throw new Error("The web preview can export projects up to 90 seconds. Android export is a later stage.");
  const ratio = ratioValue(project.ratio);
  const canvas = document.createElement("canvas");
  canvas.width = ratio >= 1 ? Math.round(size * ratio / 2) * 2 : size;
  canvas.height = ratio >= 1 ? size : Math.round(size / ratio / 2) * 2;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("The browser could not create a rendering canvas.");

  const drawables = new Map<string, Drawable>();
  for (const assetId of new Set(project.clips.map((clip) => clip.assetId).filter((id): id is string => Boolean(id)))) {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset || asset.kind === "audio") continue;
    const source = sources[assetId];
    if (!source) throw new Error(`Source media is unavailable: ${asset.name}`);
    if (asset.kind === "image") {
      const image = new Image();
      image.src = source;
      await image.decode();
      drawables.set(assetId, image);
    } else {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = source;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error(`Video could not be decoded: ${asset.name}`));
      });
      drawables.set(assetId, video);
    }
  }

  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type))!;
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: size === 720 ? 3_500_000 : 1_800_000 });
  const chunks: Blob[] = [];
  let frame = 0;
  let playingVideo: HTMLVideoElement | null = null;
  let playingClipId: string | null = null;
  let settled = false;

  const cleanup = () => {
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((track) => track.stop());
    drawables.forEach((drawable) => {
      if (drawable instanceof HTMLVideoElement) {
        drawable.pause();
        drawable.removeAttribute("src");
        drawable.load();
      }
    });
  };

  return new Promise<Blob>((resolve, reject) => {
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (recorder.state !== "inactive") recorder.stop();
      reject(error);
    };
    const abort = () => fail(new Error("Export was cancelled."));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => fail(new Error("The browser failed while recording the video."));
    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      cleanup();
      signal.removeEventListener("abort", abort);
      if (!chunks.length) reject(new Error("Export finished without a video file."));
      else resolve(new Blob(chunks, { type: "video/webm" }));
    };

    const paint = (time: number) => {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const visual = activeClip(project, "video-1", Math.min(time, duration - 0.001));
      const drawable = visual?.assetId ? drawables.get(visual.assetId) : undefined;
      if (visual && drawable) {
        if (drawable instanceof HTMLVideoElement) {
          const expected = visual.sourceStart + (time - visual.position) * visual.speed;
          if (playingClipId !== visual.id) {
            playingVideo?.pause();
            playingVideo = drawable;
            playingClipId = visual.id;
            drawable.currentTime = expected;
            drawable.playbackRate = visual.speed;
            void drawable.play().catch(() => fail(new Error("Video playback was blocked during export.")));
          } else if (Math.abs(drawable.currentTime - expected) > 0.35) {
            drawable.currentTime = expected;
          }
        } else if (playingVideo) {
          playingVideo.pause();
          playingVideo = null;
          playingClipId = null;
        }
        drawCover(context, drawable, canvas.width, canvas.height, visual, time);
      }
      const textClip = activeClip(project, "overlay-1", Math.min(time, duration - 0.001));
      if (textClip?.text) {
        const transform = sampleTransform(textClip, time - textClip.position);
        context.save();
        context.translate(canvas.width / 2 + transform.x * canvas.width / 200, canvas.height / 2 + transform.y * canvas.height / 200);
        context.rotate(transform.rotation * Math.PI / 180);
        context.scale(transform.scale / 100, transform.scale / 100);
        context.globalAlpha = transform.opacity / 100;
        context.font = `600 ${Math.round(canvas.height * 0.115)}px Arial, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "#000";
        context.shadowBlur = 18;
        context.fillStyle = "#fff";
        context.fillText(textClip.text, 0, 0, canvas.width * 0.9);
        context.restore();
      }
    };

    paint(0);
    recorder.start(1000);
    const started = performance.now();
    const tick = () => {
      if (settled) return;
      const elapsed = (performance.now() - started) / 1000;
      paint(Math.min(elapsed, duration));
      onProgress(Math.min(99, Math.round(elapsed / duration * 100)));
      if (elapsed >= duration) {
        recorder.stop();
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
  });
}