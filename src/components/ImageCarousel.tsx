"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&q=80",
    alt: "摄影作品 1",
  },
  {
    src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1920&q=80",
    alt: "摄影作品 2",
  },
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
    alt: "摄影作品 3",
  },
];

export function ImageCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
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
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}
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
    </div>
  );
}
