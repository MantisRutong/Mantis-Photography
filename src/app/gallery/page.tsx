import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import type { GalleryPhoto } from "@/components/GalleryGrid";
import { getPhotosFromR2 } from "@/lib/r2";

export const metadata: Metadata = {
  title: "作品 | Mantis Photography",
  description: "摄影作品展示",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const photos: GalleryPhoto[] = await getPhotosFromR2();
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-12 text-center text-3xl font-light tracking-wide text-foreground/90">
          作品
        </h1>
        {photos.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-sm border border-white/10 bg-white/5 p-8 text-center text-sm text-foreground/70">
            <p className="mb-2">暂无照片。</p>
            <p className="text-foreground/60">请检查你的 R2 bucket 是否包含图片对象。</p>
          </div>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </div>
    </div>
  );
}
