import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "作品 | Mantis Photography",
  description: "摄影作品展示",
};

const photos = [
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", alt: "人像 1", h: "tall" },
  { src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80", alt: "风景 1", h: "normal" },
  { src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80", alt: "自然 1", h: "normal" },
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", alt: "山景", h: "tall" },
  { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", alt: "森林", h: "normal" },
  { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80", alt: "自然 2", h: "tall" },
  { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80", alt: "风景 2", h: "normal" },
  { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", alt: "湖景", h: "tall" },
  { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", alt: "雾景", h: "normal" },
];

export default function GalleryPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-12 text-center text-3xl font-light tracking-wide text-foreground/90">
          作品
        </h1>
        <div
          className="columns-2 gap-4 sm:columns-3 lg:gap-6"
          style={{ columnFill: "balance" }}
        >
          {photos.map((photo, i) => (
            <div
              key={`${photo.src}-${i}`}
              className={`mb-4 break-inside-avoid lg:mb-6 ${
                photo.h === "tall" ? "[&>div]:aspect-[3/4]" : "[&>div]:aspect-[4/3]"
              }`}
            >
              <div className="relative overflow-hidden rounded-sm bg-white/5">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={800}
                  height={photo.h === "tall" ? 1067 : 600}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
