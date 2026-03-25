import { ImageCarousel } from "@/components/ImageCarousel";
import Link from "next/link";
import { getPhotosFromR2 } from "@/lib/r2";
import type { R2Photo } from "@/lib/r2";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const dynamic = "force-dynamic";

/**
 * Hero carousel: by default the 5 newest preview images from R2 (same order as getPhotosFromR2).
 * Optional HOME_HERO_KEYS: comma-separated R2 object keys (output paths) in priority order; fills up to 5.
 * Example: HOME_HERO_KEYS=output_images/iceland/DSC_1001.webp,output_images/london/DSC_2001.webp
 */
function pickHeroSlides(photos: R2Photo[]): R2Photo[] {
  const raw = process.env.HOME_HERO_KEYS?.trim();
  if (!raw) return photos.slice(0, 5);

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
  if (picked.length >= 5) return picked.slice(0, 5);
  for (const p of photos) {
    if (used.has(p.originalKey)) continue;
    picked.push(p);
    used.add(p.originalKey);
    if (picked.length >= 5) break;
  }
  return picked;
}

export default async function HomePage() {
  const photos: R2Photo[] = await getPhotosFromR2();
  const slides = pickHeroSlides(photos);
  return (
    <div>
      <section className="relative h-screen">
        <ImageCarousel slides={slides} />
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="max-w-3xl text-center text-white">
            <h1
              className={`${playfair.className} mb-4 text-4xl font-medium tracking-[0.3em] sm:text-5xl md:text-6xl`}
            >
              Mantis
            </h1>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-white/80">
          <div className="animate-bounce text-2xl">↓</div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="mb-4 text-2xl font-light tracking-wide text-foreground/90">
          Moments in light
        </h2>
        <p className="mb-10 text-foreground/60">
          Explore the gallery for more work.
        </p>
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
