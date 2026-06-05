"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Zap } from "lucide-react";
import { TronBackground } from "@/components/ui/tron-background";
import { AppThemeProvider } from "@/components/app-theme-provider";
import { ThemePicker } from "@/components/theme-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/ui/user-menu";
import { OfflineSyncBanner } from "@/components/ui/offline-sync-banner";

const NAV = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/library", label: "Biblioteca" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/organizers", label: "Organizadores" },
  { href: "/cuaderno", label: "Cuaderno IA" },
  { href: "/fuentes-juridicas", label: "Fuentes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-[100dvh] flex-col text-foreground">
      <AppThemeProvider />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-foreground)]"
      >
        Saltar al contenido
      </a>
      <TronBackground />
      <OfflineSyncBanner />

      <header className="sticky top-0 z-40 shrink-0 border-b border-[var(--border)] bg-[var(--shell-header-bg)] backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--shell-card-bg)] px-3 py-2 transition hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
          >
            <span className="grid h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--accent-foreground)]">
              <Zap size={18} />
            </span>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold tracking-tight text-foreground">MemoriaStudy</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Derecho UNT</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
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
            <ThemePicker />
            <ThemeToggle />
            <UserMenu />
          </div>

          <details className="ml-1 block rounded-xl border border-[var(--border)] bg-[var(--shell-card-bg)] px-3 py-2 md:hidden">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground"
              aria-label="Abrir menú de navegación"
            >
              <Menu size={18} /> Menú
            </summary>
            <nav className="mt-3 flex flex-col gap-1" aria-label="Navegación móvil">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="tron-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <main id="main-content" className="relative z-[1] flex-1 overflow-x-hidden">
        {children}
      </main>

      <footer className="relative z-[1] shrink-0 border-t border-[var(--border)] px-4 py-5 text-center text-xs text-muted-foreground">
        MemoriaStudy · Plataforma inteligente para el estudio jurídico
      </footer>
    </div>
  );
}
