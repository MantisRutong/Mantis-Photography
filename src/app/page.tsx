import { ImageCarousel } from "@/components/ImageCarousel";
import { getGalleryPhotos } from "@/lib/photos";
import Link from "next/link";

export default async function HomePage() {
  const photos = await getGalleryPhotos();
  const slides = photos.slice(0, 5);
  return (
    <div className="pt-16">
      <ImageCarousel slides={slides} />
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
