"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
export type GalleryPhoto = {
  src: string;
  originalSrc?: string;
  alt: string;
};
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMiI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjEyIiBmaWxsPSIjMTcxNzE3Ii8+PC9zdmc+";

function GalleryImageItem({
  photo,
  i,
  onOpen,
}: {
  photo: GalleryPhoto;
  i: number;
  onOpen: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={itemRef}
      className={`mb-8 break-inside-avoid lg:mb-10 ${
        i % 3 === 0 ? "[&>div]:aspect-[3/4]" : "[&>div]:aspect-[4/3]"
      }`}
    >
      <button
        type="button"
        onDoubleClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
        className="group block w-full text-left"
        aria-label={`查看大图：${photo.alt}`}
      >
        <div className="relative overflow-hidden rounded-sm bg-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={800}
            height={i % 3 === 0 ? 1067 : 600}
            className={`h-full w-full object-cover transition-all duration-500 ease-in-out group-hover:scale-[1.02] ${
              visible ? "opacity-100 blur-0" : "opacity-0 blur-md"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 ease-in-out group-hover:bg-black/28" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
            <p className="line-clamp-1 text-sm font-light tracking-widest text-white/90">{photo.alt}</p>
          </div>
        </div>
      </button>
    </div>
  );
}

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
      <div className="columns-1 gap-8 sm:columns-2 lg:columns-3 lg:gap-12" style={{ columnFill: "balance" }}>
        {photos.map((photo, i) => (
          <GalleryImageItem
            key={`${photo.src}-${i}`}
            photo={photo}
            i={i}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>

      <AnimatePresence>
        {isOpen && active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpenIndex(null);
            }}
          >
            <div className="absolute inset-0 p-4 sm:p-8">
              <div className="relative mx-auto flex h-full max-w-6xl items-center justify-center">
                <motion.button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="relative h-full w-full cursor-zoom-out"
                  aria-label="关闭预览"
                  initial={{ scale: 0.965, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.985, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <Image
                    src={active.src}
                    alt={active.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    quality={75}
                    priority
                  />
                </motion.button>

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
                <a
                  href={active.originalSrc ?? active.src}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute left-2 top-2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                >
                  下载原图
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

