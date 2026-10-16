import type { MediaAsset, MediaKind } from "./types";

function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function thumbnail(source: CanvasImageSource, width: number, height: number): string {
  const canvas = document.createElement("canvas");
  const ratio = width / height;
  canvas.width = ratio > 1 ? 320 : Math.round(200 * ratio);
  canvas.height = ratio > 1 ? Math.round(320 / ratio) : 200;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function waitFor(element: HTMLMediaElement, event: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error("This media file took too long to open.")), 15_000);
    const finish = (error?: Error) => {
      clearTimeout(timer);
      element.removeEventListener(event, success);
      element.removeEventListener("error", failure);
      if (error) reject(error);
      else resolve();
    };
    const success = () => finish();
    const failure = () => finish(new Error("The browser could not decode this media file."));
    element.addEventListener(event, success, { once: true });
    element.addEventListener("error", failure, { once: true });
  });
}

async function audioPeaks(file: File): Promise<number[] | undefined> {
  if (file.size > 16 * 1024 * 1024) return undefined;
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const channel = decoded.getChannelData(0);
    const bucketSize = Math.max(1, Math.floor(channel.length / 70));
    const peaks: number[] = [];
    for (let bucket = 0; bucket < 70; bucket++) {
      let peak = 0;
      for (let index = bucket * bucketSize; index < Math.min(channel.length, (bucket + 1) * bucketSize); index += 32) {
        peak = Math.max(peak, Math.abs(channel[index]));
      }
      peaks.push(Math.max(0.08, peak));
    }
    const maximum = Math.max(...peaks, 0.01);
    return peaks.map((peak) => peak / maximum);
  } catch {
    return undefined;
  } finally {
    await context.close();
  }
}

export async function inspectFile(file: File): Promise<{ asset: MediaAsset; source: string }> {
  const kind = mediaKind(file);
  if (!kind) throw new Error(`${file.name}: only video, image, and audio files can be imported.`);
  const source = URL.createObjectURL(file);
  const base: MediaAsset = {
    id: crypto.randomUUID(),
    name: file.name,
    kind,
    mime: file.type,
    duration: kind === "image" ? 5 : 0,
  };

  try {
    if (kind === "image") {
      const image = new Image();
      image.src = source;
      await image.decode();
      base.width = image.naturalWidth;
      base.height = image.naturalHeight;
      base.poster = thumbnail(image, image.naturalWidth, image.naturalHeight);
    } else {
      const element = document.createElement(kind === "video" ? "video" : "audio");
      element.preload = "metadata";
      element.src = source;
      await waitFor(element, "loadedmetadata");
      if (!Number.isFinite(element.duration) || element.duration <= 0) throw new Error("The media duration is unavailable.");
      base.duration = element.duration;
      if (kind === "video") {
        const video = element as HTMLVideoElement;
        base.width = video.videoWidth;
        base.height = video.videoHeight;
        try {
          video.currentTime = Math.min(0.25, video.duration / 2);
          await waitFor(video, "seeked");
          base.poster = thumbnail(video, video.videoWidth, video.videoHeight);
        } catch {
          // The video remains importable even when a browser cannot generate a poster.
        }
      } else {
        base.waveform = await audioPeaks(file);
      }
      element.removeAttribute("src");
      element.load();
    }
    return { asset: base, source };
  } catch (error) {
    URL.revokeObjectURL(source);
    throw error;
  }
}