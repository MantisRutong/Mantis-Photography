import { ImageCarousel } from "@/components/ImageCarousel";
import Link from "next/link";

export default function HomePage() {
  // 目前不从本地目录自动读取图片。
  // 你之后如果用“其他途径读取图片”，只要把 slides 传给 ImageCarousel 即可。
  const slides: { src: string; alt: string }[] = [];
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
