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
import { JurisprudenceAdminNavLink } from "@/components/jurisprudence/jurisprudence-admin-nav-link";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/library", label: "Materiales" },
  { href: "/biblioteca-juridica", label: "Jurisprudencia" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/organizers", label: "Organizadores" },
  { href: "/cuaderno", label: "Cuaderno IA" },
  { href: "/fuentes-juridicas", label: "Fuentes" },
] as const;

function navIsActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCuaderno = pathname === "/cuaderno" || pathname.startsWith("/cuaderno/");
  const isGuidedStudy =
    pathname === "/estudio-guiado" || pathname.startsWith("/estudio-guiado/");

  return (
    <div
      className={`relative flex min-h-[100dvh] flex-col text-foreground${isHome ? " shell--home" : ""}${isCuaderno ? " shell--cuaderno" : ""}${isGuidedStudy ? " shell--guided-study" : ""}`}
    >
      <AppThemeProvider />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-foreground)]"
      >
        Saltar al contenido
      </a>
      <TronBackground />
      <OfflineSyncBanner />

      <header
        className="sticky top-0 z-40 shrink-0 border-b border-[var(--border)] bg-[var(--shell-header-bg)] backdrop-blur-xl"
      >
        <div
          className={`relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 ${
            isHome ? "py-2.5" : "py-3"
          }`}
        >
          <Link
            href="/"
            className={`group flex shrink-0 items-center gap-2.5 transition ${
              isHome
                ? "rounded-lg px-1 py-1 hover:opacity-80"
                : "rounded-xl border border-[var(--border)] bg-[var(--shell-card-bg)] px-3 py-2 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
            }`}
          >
            <span
              className={`grid items-center justify-center text-[var(--accent-foreground)] ${
                isHome
                  ? "h-8 w-8 rounded-lg bg-[var(--accent)]"
                  : "h-10 w-10 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)]"
              }`}
            >
              <Zap size={isHome ? 15 : 18} />
            </span>
            <div className="hidden sm:block text-left">
              <p className={`tracking-tight text-foreground ${isHome ? "text-[13px] font-medium" : "text-sm font-semibold"}`}>
                MemoriaStudy
              </p>
              {!isHome ? (
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Derecho UNT</p>
              ) : null}
            </div>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex lg:gap-1" aria-label="Navegación principal">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={navIsActive(pathname, item.href) ? "true" : undefined}
                className="tron-nav-link"
              >
                {item.label}
              </Link>
            ))}
            <JurisprudenceAdminNavLink />
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
              <JurisprudenceAdminNavLink />
            </nav>
          </details>
        </div>
      </header>

      <main
        id="main-content"
        className={`relative z-[1] flex-1 overflow-x-hidden${isGuidedStudy ? " flex min-h-0 flex-col" : ""}`}
      >
        {children}
      </main>

      {!isHome && !isGuidedStudy ? (
        <footer className="relative z-[1] shrink-0 border-t border-[var(--border)] px-4 py-5 text-center text-xs text-muted-foreground">
          MemoriaStudy · Plataforma inteligente para el estudio jurídico
        </footer>
      ) : null}
    </div>
  );
}
