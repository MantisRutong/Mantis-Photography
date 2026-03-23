import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import type { GalleryPhoto } from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "作品 | Mantis Photography",
  description: "摄影作品展示",
};

export default function GalleryPage() {
  // 目前不再从本地目录自动读取图片。
  // 后续你把“其他途径读取图片”的逻辑加进来后，只需要把 photos 传给 GalleryGrid 即可。
  const photos: GalleryPhoto[] = [];
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
              当前图库数据源还未接入。
              后续你把“其他途径读取图片”的结果传给这里的 `photos` 即可显示，并支持双击查看大图。
            </p>
          </div>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </div>
    </div>
  );
}
