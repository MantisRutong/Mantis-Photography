import { readdir } from "node:fs/promises";
import path from "node:path";

export type GalleryPhoto = {
  src: string;
  alt: string;
};

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function encodePathSegments(p: string) {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

async function walkImages(absDir: string, relDirFromPhotosRoot: string): Promise<GalleryPhoto[]> {
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: GalleryPhoto[] = [];

  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;

    if (ent.isDirectory()) {
      const nextRel = relDirFromPhotosRoot
        ? `${relDirFromPhotosRoot}/${ent.name}`
        : ent.name;
      out.push(...(await walkImages(path.join(absDir, ent.name), nextRel)));
      continue;
    }

    const ext = path.extname(ent.name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    const relPath = relDirFromPhotosRoot
      ? `${relDirFromPhotosRoot}/${ent.name}`
      : ent.name;

    out.push({
      src: `/photos/${encodePathSegments(relPath)}`,
      alt: titleFromFilename(ent.name) || "作品",
    });
  }

  return out;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photosRoot = path.join(process.cwd(), "public", "photos");
  const photos = await walkImages(photosRoot, "");
  photos.sort((a, b) => a.src.localeCompare(b.src, "en"));
  return photos;
}

