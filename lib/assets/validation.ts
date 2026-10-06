export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const ACCEPT_ATTRIBUTE = ".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml";
export const MAX_BYTES = 8 * 1024 * 1024;
export const MAX_SVG_BYTES = 1024 * 1024;
export const MIN_DIMENSION = 32;
export const MAX_DIMENSION = 6000;

const EXTENSIONS: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export type ValidationResult = { ok: true; mimeType: string } | { ok: false; error: string };

/** Checks type and size from the file's name, declared type and byte count. */
export function validateFileBasics(file: { name: string; type: string; size: number }): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fromExt = EXTENSIONS[ext];
  const declared = file.type || fromExt;
  if (!fromExt || !(ACCEPTED_TYPES as readonly string[]).includes(declared) || declared !== fromExt) {
    return { ok: false, error: `${file.name}: use PNG, JPG, WebP or SVG.` };
  }
  const limit = declared === "image/svg+xml" ? MAX_SVG_BYTES : MAX_BYTES;
  if (file.size > limit) {
    return { ok: false, error: `${file.name}: larger than ${Math.round(limit / 1024 / 1024)} MB. Export a smaller version.` };
  }
  if (file.size === 0) return { ok: false, error: `${file.name}: the file is empty.` };
  return { ok: true, mimeType: declared };
}

export function validateDimensions(name: string, width: number, height: number): ValidationResult {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return { ok: false, error: `${name}: at least ${MIN_DIMENSION}×${MIN_DIMENSION}px needed (got ${width}×${height}).` };
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return { ok: false, error: `${name}: at most ${MAX_DIMENSION}px on each side (got ${width}×${height}).` };
  }
  return { ok: true, mimeType: "" };
}

/**
 * SVGs are only ever drawn through <img>, where scripts can't run, but we
 * still refuse active content so a file can't do anything if opened elsewhere.
 */
export function svgLooksSafe(text: string): boolean {
  return !/<script|<foreignObject|\son\w+\s*=|javascript:|<iframe|<embed|<object/i.test(text);
}

/** Browser-only: reads natural size by decoding the image. */
export function readImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 512;
      const height = img.naturalHeight || 512;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file couldn't be read as an image."));
    };
    img.src = url;
  });
}

/** Full check used before anything is stored. */
export async function validateImageFile(file: File): Promise<
  { ok: true; mimeType: string; width: number; height: number } | { ok: false; error: string }
> {
  const basics = validateFileBasics(file);
  if (!basics.ok) return basics;
  if (basics.mimeType === "image/svg+xml" && !svgLooksSafe(await file.text())) {
    return { ok: false, error: `${file.name}: this SVG contains scripts or embedded content. Export it as a plain SVG or PNG.` };
  }
  try {
    const { width, height } = await readImageDimensions(file);
    const dims = validateDimensions(file.name, width, height);
    if (!dims.ok) return dims;
    return { ok: true, mimeType: basics.mimeType, width, height };
  } catch (error) {
    return { ok: false, error: `${file.name}: ${(error as Error).message}` };
  }
}
