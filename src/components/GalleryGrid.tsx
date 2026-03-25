"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
export type GalleryPhoto = {
  /** R2 preview key; keeps grid / lightbox / download aligned */
  originalKey: string;
  src: string;
  originalSrc: string;
  downloadFileName: string;
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
        onClick={onOpen}
        onDoubleClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
        className="group block w-full text-left"
        aria-label={`Open large preview: ${photo.alt}`}
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
        </div>
      </button>
    </div>
  );
}

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<-1 | 1>(1);

  const isOpen = openIndex !== null;
  const active = useMemo(() => (openIndex === null ? null : photos[openIndex] ?? null), [openIndex, photos]);

  useEffect(() => {
    if (!isOpen) return;
    if (!active) return;
    if (photos.length <= 1) return;

    const next = photos[(openIndex! + 1) % photos.length];
    const prev = photos[(openIndex! - 1 + photos.length) % photos.length];

    for (const p of [next, prev]) {
      if (!p?.src) continue;
      const preloader = new window.Image();
      preloader.src = p.src;
    }
  }, [active?.src, isOpen, openIndex, photos]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") {
        setDirection(-1);
        setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
      }
      if (e.key === "ArrowRight") {
        setDirection(1);
        setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, photos.length]);

  return (
    <>
      <div className="columns-1 gap-8 sm:columns-2 lg:columns-3 lg:gap-12" style={{ columnFill: "balance" }}>
        {photos.map((photo, i) => (
          <GalleryImageItem
            key={photo.originalKey}
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
                  aria-label="Close preview"
                  initial={{ scale: 0.965, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.985, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                      <motion.div
                        key={active.originalKey}
                        className="absolute inset-0 bg-black"
                        custom={direction}
                        variants={{
                          enter: (dir: -1 | 1) => ({ x: dir > 0 ? "18%" : "-18%" }),
                          center: { x: 0 },
                          exit: (dir: -1 | 1) => ({ x: dir > 0 ? "-18%" : "18%" }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        drag={photos.length > 1 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.12}
                        onDragEnd={(_, info) => {
                          const threshold = 80;
                          if (info.offset.x > threshold) {
                            setDirection(-1);
                            setOpenIndex((i) =>
                              i === null ? i : (i - 1 + photos.length) % photos.length,
                            );
                            return;
                          }
                          if (info.offset.x < -threshold) {
                            setDirection(1);
                            setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
                          }
                        }}
                      >
                        <Image
                          src={active.src}
                          alt={active.alt}
                          fill
                          className="object-contain"
                          sizes="(max-width: 1200px) 100vw, 1200px"
                          quality={75}
                          priority
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.button>

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                      onClick={() => {
                        setDirection(-1);
                        setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
                      }}
                      aria-label="Previous image"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                      onClick={() => {
                        setDirection(1);
                        setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
                      }}
                      aria-label="Next image"
                    >
                      →
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                  onClick={() => setOpenIndex(null)}
                  aria-label="Close"
                >
                  Esc
                </button>
                <a
                  href={active.originalSrc}
                  download={active.downloadFileName}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-2 top-2 rounded-sm bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/20"
                >
                  Download original
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

