import Image from "next/image";
import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "作品 | Mantis Photography",
  description: "摄影作品展示",
};

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-12 text-center text-3xl font-light tracking-wide text-foreground/90">
          作品
        </h1>
        {photos.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-sm border border-white/10 bg-white/5 p-8 text-center text-sm text-foreground/70">
            <p className="mb-2">暂无照片。</p>
            <p>
              请把图片放到 <code className="rounded bg-black/30 px-1.5 py-0.5">public/photos</code>{" "}
              目录下（支持子目录），刷新页面即可更新图库。
            </p>
          </div>
        ) : (
        <div
          className="columns-2 gap-4 sm:columns-3 lg:gap-6"
          style={{ columnFill: "balance" }}
        >
          {photos.map((photo, i) => (
            <div
              key={`${photo.src}-${i}`}
              className={`mb-4 break-inside-avoid lg:mb-6 ${
                i % 3 === 0 ? "[&>div]:aspect-[3/4]" : "[&>div]:aspect-[4/3]"
              }`}
            >
              <div className="relative overflow-hidden rounded-sm bg-white/5">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={800}
                  height={i % 3 === 0 ? 1067 : 600}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
