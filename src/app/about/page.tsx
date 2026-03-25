import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "About | Mantis Photography",
  description: "About the photographer.",
};

export default function AboutPage() {
  notFound();
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mb-12 text-3xl font-light tracking-wide text-foreground/90">
          About
        </h1>
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            I photograph light, mood, and the moments between—using the camera as a way to see and to
            speak with those who view the work.
          </p>
          <p>
            From portraiture to landscape and street work, each image aims for honesty and a quiet sense
            of beauty.
          </p>
          <p className="pt-4 text-sm text-foreground/60">
            Browse the portfolio for more, and feel free to reach out for collaborations.
          </p>
        </div>
        <div className="mt-16 border-t border-white/10 pt-10">
          <p className="text-sm text-foreground/50">Mantis Photography</p>
        </div>
      </div>
    </div>
  );
}
