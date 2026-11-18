import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import sharp from "sharp";

import { link, profile } from "@/models/schema.server";
import { db } from "@/utils/db.server";

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

export type ImageLibraryEntry = {
  filename: string;
  url: string;
  updatedAt: number;
};

/**
 * Crop an image buffer to a square WebP and write it to the upload dir.
 * The filename is derived from the encoded bytes, so uploading the same image
 * twice (or reusing it) resolves to a single file on disk.
 */
async function writeCroppedImage(input: Buffer, size: number): Promise<string> {
  const output = await sharp(input)
    .rotate()
    .resize(size, size, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toBuffer();

  const hash = createHash("sha256").update(output).digest("hex");
  const filename = `${size}-${hash}.webp`;
  const filePath = path.join(uploadDir, filename);

  try {
    // "wx" never overwrites: an identical image is already de-duplicated.
    await fs.promises.writeFile(filePath, output, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }

  return filename;
}

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
    return { ok: true, filename: await writeCroppedImage(input, size) };
  } catch {
    return { ok: false, error: "That file could not be read as an image." };
  }
}

/**
 * Point a link at an already-uploaded image. Files are reference-counted by
 * deleteImage(), so one file can safely be shared by several links without
 * creating a duplicate copy.
 */
export async function reuseImage(filename: string): Promise<ImageResult> {
  if (!isImageFilename(filename)) {
    return { ok: false, error: "That image is not available." };
  }

  try {
    await fs.promises.access(path.join(uploadDir, filename), fs.constants.R_OK);
    return { ok: true, filename };
  } catch {
    return {
      ok: false,
      error: "That image is no longer available. Pick another one.",
    };
  }
}

let dedupePromise: Promise<void> | null = null;

function dedupeOnce(): Promise<void> {
  dedupePromise ??= dedupeImages().catch(() => {
    // Never block the picker on a cleanup failure; try again next time.
    dedupePromise = null;
  });
  return dedupePromise;
}

/**
 * Consolidate duplicate files left behind by older versions, which copied an
 * image whenever it was reused. All references are pointed at the
 * content-addressed copy before the redundant files are removed.
 */
export async function dedupeImages(): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(uploadDir, { withFileTypes: true });
  } catch {
    return;
  }

  const filenames = entries
    .filter((entry) => entry.isFile() && isImageFilename(entry.name))
    .map((entry) => entry.name)
    .sort();

  const groups = new Map<string, string[]>();
  for (const filename of filenames) {
    try {
      const data = await fs.promises.readFile(path.join(uploadDir, filename));
      const hash = createHash("sha256").update(data).digest("hex");
      const group = groups.get(hash);
      if (group) group.push(filename);
      else groups.set(hash, [filename]);
    } catch {
      // Unreadable file: leave it alone.
    }
  }

  for (const [hash, names] of groups) {
    const size = names[0].split("-")[0];
    const target = `${size}-${hash}.webp`;
    if (target === names[0] && names.length === 1) continue;

    if (!names.includes(target)) {
      try {
        await fs.promises.copyFile(
          path.join(uploadDir, names[0]),
          path.join(uploadDir, target),
          fs.constants.COPYFILE_EXCL
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") continue;
      }
    }

    db.transaction((tx) => {
      for (const name of names) {
        if (name === target) continue;
        tx.update(link)
          .set({ imagePath: target })
          .where(eq(link.imagePath, name))
          .run();
        tx.update(profile)
          .set({ avatarPath: target })
          .where(eq(profile.avatarPath, name))
          .run();
      }
    });

    for (const name of names) {
      if (name !== target) deleteImage(name);
    }
  }
}

/** Newest-first list of unique images on disk, for the reuse picker. */
export async function listImages(limit = 60): Promise<ImageLibraryEntry[]> {
  await dedupeOnce();

  try {
    const entries = await fs.promises.readdir(uploadDir, {
      withFileTypes: true,
    });

    const images = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && isImageFilename(entry.name))
        .map(async (entry) => {
          try {
            const stat = await fs.promises.stat(
              path.join(uploadDir, entry.name)
            );
            return {
              filename: entry.name,
              url: `/uploads/${entry.name}`,
              updatedAt: stat.mtimeMs,
            };
          } catch {
            return null;
          }
        })
    );

    return images
      .filter((image): image is ImageLibraryEntry => image !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Recursive-safe check: filenames we generate are `NNN-<sha256>.webp`. */
export function isImageFilename(filename: string): boolean {
  return /^\d{2,4}-[a-z0-9]+\.webp$/.test(filename);
}

/** True while any link or the profile avatar still points at this file. */
export function isImageInUse(filename: string): boolean {
  const usedByLink = db
    .select({ id: link.id })
    .from(link)
    .where(eq(link.imagePath, filename))
    .get();
  if (usedByLink) return true;

  const usedByProfile = db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.avatarPath, filename))
    .get();
  return Boolean(usedByProfile);
}

/**
 * Remove an image only once nothing references it. Shared files are expected:
 * image filenames are content hashes, and reused images point at the same file.
 */
export function deleteImage(filename: string | null | undefined): void {
  if (!filename || !isImageFilename(filename)) return;
  if (isImageInUse(filename)) return;
  fs.promises.unlink(path.join(uploadDir, filename)).catch(() => {
    /* already gone */
  });
}

export function imageUrl(filename: string | null | undefined): string | null {
  return filename && isImageFilename(filename) ? `/uploads/${filename}` : null;
}
