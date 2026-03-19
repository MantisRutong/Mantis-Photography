"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { GalleryPhoto } from "@/lib/photos";

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const isOpen = openIndex !== null;
  const active = useMemo(() => (openIndex === null ? null : photos[openIndex] ?? null), [openIndex, photos]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, photos.length]);

  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3 lg:gap-6" style={{ columnFill: "balance" }}>
        {photos.map((photo, i) => (
          <div
            key={`${photo.src}-${i}`}
            className={`mb-4 break-inside-avoid lg:mb-6 ${
              i % 3 === 0 ? "[&>div]:aspect-[3/4]" : "[&>div]:aspect-[4/3]"
            }`}
          >
            <button
              type="button"
              onDoubleClick={() => setOpenIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpenIndex(i);
              }}
              className="block w-full text-left"
              aria-label={`查看大图：${photo.alt}`}
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
            </button>
          </div>
        ))}
      </div>

      {isOpen && active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpenIndex(null);
          }}
        >
          <div className="absolute inset-0 bg-black/80" />
          <div className="absolute inset-0 p-4 sm:p-8">
            <div className="relative mx-auto flex h-full max-w-6xl items-center justify-center">
              <div className="relative h-full w-full">
                <Image
                  src={active.src}
                  alt={active.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                    onClick={() =>
                      setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))
                    }
                    aria-label="上一张"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                    onClick={() => setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length))}
                    aria-label="下一张"
                  >
                    →
                  </button>
                </>
              )}

              <button
                type="button"
                className="absolute right-2 top-2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                onClick={() => setOpenIndex(null)}
                aria-label="关闭"
              >
                Esc
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

