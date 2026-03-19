import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/photos";
import { GalleryGrid } from "@/components/GalleryGrid";

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
          <GalleryGrid photos={photos} />
        )}
      </div>
    </div>
  );
}
