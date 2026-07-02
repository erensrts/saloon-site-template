import { supabase } from "@/integrations/supabase/client";

const BUCKET = "gallery";
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.85;
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB

export type UploadResult = {
  path: string;
  publicUrl: string;
  contentType: string;
  width: number;
  height: number;
};

async function fileToImageBitmap(file: File): Promise<{
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return {
        bitmap: bmp,
        width: bmp.width,
        height: bmp.height,
        cleanup: () => bmp.close?.(),
      };
    } catch {
      // fall through to HTMLImageElement path
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_decode_failed"));
    img.src = url;
  });
  return {
    bitmap: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

function targetDimensions(w: number, h: number) {
  const max = Math.max(w, h);
  if (max <= MAX_DIMENSION) return { width: w, height: h };
  const scale = MAX_DIMENSION / max;
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/**
 * Encodes the given file as WebP via canvas, downscaling to MAX_DIMENSION.
 * Returns null if the browser can't encode WebP (Safari <14 etc).
 */
async function encodeToWebp(file: File): Promise<{
  blob: Blob;
  width: number;
  height: number;
} | null> {
  const { bitmap, width, height, cleanup } = await fileToImageBitmap(file);
  try {
    const { width: w, height: h } = targetDimensions(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    if (!blob || blob.type !== "image/webp") return null;
    return { blob, width: w, height: h };
  } finally {
    cleanup();
  }
}

/**
 * Best-effort raster resize (no encoder switch). Used as a Safari fallback
 * when WebP encoding isn't available — we still shrink oversized JPEG/PNG
 * to MAX_DIMENSION before uploading.
 */
async function encodeToOriginal(file: File): Promise<{
  blob: Blob;
  width: number;
  height: number;
  type: string;
} | null> {
  const targetType =
    file.type === "image/png" ? "image/png" : "image/jpeg";
  const { bitmap, width, height, cleanup } = await fileToImageBitmap(file);
  try {
    const dims = targetDimensions(width, height);
    // No resize needed AND already the right raster type → upload as-is.
    if (dims.width === width && dims.height === height && file.type === targetType) {
      return { blob: file, width, height, type: file.type };
    }
    const canvas = document.createElement("canvas");
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, width, height, type: file.type };
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, dims.width, dims.height);
    const blob = await canvasToBlob(
      canvas,
      targetType,
      targetType === "image/jpeg" ? 0.9 : undefined,
    );
    if (!blob) return { blob: file, width, height, type: file.type };
    return { blob, width: dims.width, height: dims.height, type: blob.type };
  } finally {
    cleanup();
  }
}

function randomKey(ext: string) {
  const rand =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${rand}.${ext}`;
}

export async function uploadGalleryImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("unsupported_file_type");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("file_too_large");
  }

  let blob: Blob;
  let width = 0;
  let height = 0;
  let contentType = "image/webp";
  let ext = "webp";

  const webp = await encodeToWebp(file);
  if (webp) {
    blob = webp.blob;
    width = webp.width;
    height = webp.height;
  } else {
    const fallback = await encodeToOriginal(file);
    if (!fallback) throw new Error("image_encode_failed");
    blob = fallback.blob;
    width = fallback.width;
    height = fallback.height;
    contentType = fallback.type;
    ext =
      fallback.type === "image/png"
        ? "png"
        : fallback.type === "image/jpeg"
          ? "jpg"
          : "bin";
  }

  const path = randomKey(ext);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    path,
    publicUrl: data.publicUrl,
    contentType,
    width,
    height,
  };
}

/** True when the browser can encode WebP via canvas.toBlob. */
export function isWebpEncodeSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}
