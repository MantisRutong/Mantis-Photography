"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "作品" },
  { href: "/about", label: "关于" },
];

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav
      className={`left-0 right-0 top-0 z-50 ${
        isHome
          ? "absolute bg-transparent"
          : "fixed border-b border-white/10 bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className={`text-lg font-medium tracking-tight transition hover:opacity-80 ${
            isHome ? "text-white" : "text-foreground"
          }`}
        >
          Mantis
        </Link>
        <ul className="flex gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm tracking-wide transition hover:opacity-80 ${
                  isHome
                    ? pathname === href
                      ? "text-white"
                      : "text-white/75"
                    : pathname === href
                      ? "text-foreground"
                      : "text-foreground/70"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
