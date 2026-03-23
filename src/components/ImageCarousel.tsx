"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type Slide = { src: string; alt: string };

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

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      {slides.length === 0 ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),rgba(0,0,0,0)_55%)]" />
        </div>
      ) : (
        <>
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === current ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                style={{ objectFit: "cover" }}
                sizes="100vw"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ))}
          {slides.length > 1 && (
            <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-8 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`切换到第 ${i + 1} 张`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
