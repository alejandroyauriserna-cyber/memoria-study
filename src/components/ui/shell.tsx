"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, Zap } from "lucide-react";
import { TronBackground } from "@/components/ui/tron-background";
import { UserMenu } from "@/components/ui/user-menu";

const NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/library", label: "Biblioteca" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/organizers", label: "Organizadores" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen text-foreground">
      <TronBackground />

      <header className="sticky top-0 z-40 border-b border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.75)] backdrop-blur-2xl">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.6)] px-3 py-2 transition hover:border-[rgba(0,255,213,0.45)] hover:shadow-[0_0_24px_rgba(0,255,213,0.2)]"
          >
            <span className="grid h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_20px_rgba(0,255,213,0.4)]">
              <Zap size={18} />
            </span>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold tracking-tight text-[#F5F7FA]">MemoriaStudy</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#00FFD5]">IA · 2030</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={pathname.startsWith(item.href) ? "true" : undefined}
                className="tron-nav-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <UserMenu />
          </div>

          <details className="ml-1 block rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(16,39,48,0.5)] px-3 py-2 md:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground">
              <Menu size={18} /> Menú
            </summary>
            <div className="mt-3 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="tron-nav-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </header>

      <main className="relative z-[1]">{children}</main>

      <footer className="relative z-[1] border-t border-[rgba(0,255,213,0.1)] px-4 py-6 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} className="text-[#00FFD5]" />
          MemoriaStudy · Plataforma de estudio con IA futurista
        </span>
      </footer>
    </div>
  );
}
