import { createId } from "@paralleldrive/cuid2";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const configuredUploadDir = process.env.UPLOAD_DIR?.trim();
export const uploadDir = path.resolve(
  configuredUploadDir || path.join(process.cwd(), "data", "uploads")
);

// Same trap as DATABASE_PATH: a relative path writes inside the container, so
// uploads vanish on the next deploy. Say it out loud in production.
if (
  process.env.NODE_ENV === "production" &&
  configuredUploadDir &&
  !path.isAbsolute(configuredUploadDir)
) {
  console.warn(
    `[linktool] UPLOAD_DIR="${configuredUploadDir}" is relative and resolves to ${uploadDir} inside the container. ` +
      `Set an absolute path (for example /data/uploads) so uploads live on the mounted volume.`
  );
}

console.log(`[linktool] uploads: ${uploadDir}`);

fs.mkdirSync(uploadDir, { recursive: true });

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export type ImageResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

/**
 * Accept an uploaded image, crop it to a square and store it as WebP.
 * Returns the generated filename (stored in the DB, served from /uploads/:file).
 */
export async function saveImage(
  file: FormDataEntryValue | null,
  size = 400
): Promise<ImageResult> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "The image must be smaller than 10 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Use a JPG, PNG, WebP, AVIF or GIF image.",
    };
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize(size, size, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();

    const filename = `${size}-${createId()}.webp`;
    await fs.promises.writeFile(path.join(uploadDir, filename), output);
    return { ok: true, filename };
  } catch {
    return { ok: false, error: "That file could not be read as an image." };
  }
}

/** Recursive-safe check: filenames we generate are `NNN-<cuid>.webp`. */
export function isImageFilename(filename: string): boolean {
  return /^\d{2,4}-[a-z0-9]+\.webp$/.test(filename);
}

export function deleteImage(filename: string | null | undefined): void {
  if (!filename || !isImageFilename(filename)) return;
  fs.promises.unlink(path.join(uploadDir, filename)).catch(() => {
    /* already gone */
  });
}

export function imageUrl(filename: string | null | undefined): string | null {
  return filename && isImageFilename(filename) ? `/uploads/${filename}` : null;
}
