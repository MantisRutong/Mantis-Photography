import { ImageCarousel } from "@/components/ImageCarousel";
import Link from "next/link";
import { getPhotosFromR2, getPhotosFromR2Prefix } from "@/lib/r2";
import type { R2Photo } from "@/lib/r2";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const dynamic = "force-dynamic";

/**
 * Hero carousel:
 * - If you create an R2 folder under `output_images/home/` (or `output/home/`), all images inside will be used (loops).
 * - Optional HOME_HERO_KEYS: comma-separated R2 object keys (output paths) in priority order; any missing keys are ignored.
 * - Fallback: newest preview images from R2 (same order as getPhotosFromR2).
 */
function pickHeroSlides(photos: R2Photo[]): R2Photo[] {
  const folder = (process.env.HOME_HERO_FOLDER ?? "home").trim().replace(/^\/+|\/+$/g, "");
  if (folder) {
    const prefixes = [`${folder}/`, `output_images/${folder}/`, `output/${folder}/`];
    const fromFolder = photos.filter((p) => prefixes.some((pre) => p.originalKey.startsWith(pre)));
    if (fromFolder.length > 0) return fromFolder;
  }

  const raw = process.env.HOME_HERO_KEYS?.trim();
  if (!raw) return photos;

  const wanted = raw.split(",").map((k) => k.trim()).filter(Boolean);
  const byKey = new Map(photos.map((p) => [p.originalKey, p]));
  const picked: R2Photo[] = [];
  const used = new Set<string>();

  for (const k of wanted) {
    const p = byKey.get(k);
    if (p && !used.has(p.originalKey)) {
      picked.push(p);
      used.add(p.originalKey);
    }
  }
  return picked;
}

export default async function HomePage() {
  const folder = (process.env.HOME_HERO_FOLDER ?? "home").trim().replace(/^\/+|\/+$/g, "");
  const maxRaw = process.env.HOME_HERO_MAX?.trim();
  const maxSlides = maxRaw ? Math.max(1, Math.min(200, Number.parseInt(maxRaw, 10) || 6)) : 6;
  const fromPrefix =
    folder.length > 0
      ? await getPhotosFromR2Prefix([`${folder}/`, `output_images/${folder}/`, `output/${folder}/`])
      : [];

  const photos: R2Photo[] = fromPrefix.length > 0 ? fromPrefix.slice(0, maxSlides) : await getPhotosFromR2();
  const slides = pickHeroSlides(photos);
  return (
    <div>
      <section className="relative h-screen">
        <ImageCarousel slides={slides} />
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-white/80">
          <div className="animate-bounce text-2xl">↓</div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-10 text-foreground/60">EXPLORE MORE</p>
        <Link
          href="/gallery"
          className="inline-block border border-white/30 px-8 py-3 text-sm tracking-widest text-foreground transition hover:border-white/60 hover:bg-white/5"
        >
          View gallery
        </Link>
      </section>
    </div>
  );
}
