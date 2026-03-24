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

export default async function HomePage() {
  const photos: R2Photo[] = await getPhotosFromR2();
  const slides = photos.slice(0, 5);
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
          用镜头记录瞬间
        </h2>
        <p className="mb-10 text-foreground/60">
          探索更多作品，发现光影与构图的美。
        </p>
        <Link
          href="/gallery"
          className="inline-block border border-white/30 px-8 py-3 text-sm tracking-widest text-foreground transition hover:border-white/60 hover:bg-white/5"
        >
          进入作品集
        </Link>
      </section>
    </div>
  );
}
