import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 | Mantis Photography",
  description: "关于摄影师",
};

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mb-12 text-3xl font-light tracking-wide text-foreground/90">
          关于我
        </h1>
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            用镜头捕捉光影与情绪，在快门之间留下值得回味的瞬间。摄影于我，是观察世界的方式，也是与观者对话的媒介。
          </p>
          <p>
            无论是人像、风景还是街头纪实，都希望每一张作品都能传递真实与美感。
          </p>
          <p className="pt-4 text-sm text-foreground/60">
            欢迎通过作品集了解我的风格，也欢迎合作与交流。
          </p>
        </div>
        <div className="mt-16 border-t border-white/10 pt-10">
          <p className="text-sm text-foreground/50">Mantis Photography</p>
        </div>
      </div>
    </div>
  );
}
