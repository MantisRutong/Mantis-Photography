"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Slide = { src: string; alt: string };
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMiI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjEyIiBmaWxsPSIjMTcxNzE3Ii8+PC9zdmc+";

export function ImageCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const nextIndex = (current + 1) % slides.length;
    const nextSrc = slides[nextIndex]?.src;
    if (!nextSrc) return;
    const preloader = new window.Image();
    preloader.src = nextSrc;
  }, [current, slides]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {slides.length === 0 ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),rgba(0,0,0,0)_55%)]" />
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[current]?.src ?? "empty-slide"}
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Image
                src={slides[current].src}
                alt={slides[current].alt}
                fill
                className="object-cover object-center"
                style={{ objectFit: "cover" }}
                sizes="100vw"
                priority={current === 0}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
              <div className="absolute inset-0 bg-black/30" />
            </motion.div>
          </AnimatePresence>
          {slides.length > 1 && (
            <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-[2px] rounded-full transition-all ${
                    i === current ? "w-8 bg-white" : "w-5 bg-white/45 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
