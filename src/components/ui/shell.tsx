import Link from "next/link";
import { BookOpen, Menu, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/ui/user-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-accent">
              <span className="grid h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
                <BookOpen size={18} />
              </span>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold">MemoriaStudy</p>
                <p className="text-xs text-muted-foreground">UNT Derecho</p>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/dashboard" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Panel
            </Link>
            <Link href="/library" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Biblioteca
            </Link>
            <Link href="/favorites" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Favoritos
            </Link>
            <Link href="/organizers" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Organizadores
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>

          <details className="ml-2 block md:hidden rounded-3xl border border-border bg-card px-3 py-2 shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground">
              <Menu size={18} /> Menú
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/dashboard" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Panel
              </Link>
              <Link href="/library" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Biblioteca
              </Link>
              <Link href="/favorites" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Favoritos
              </Link>
              <Link href="/organizers" className="rounded-3xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Organizadores
              </Link>
            </div>
          </details>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={15} /> Plataforma académica moderna para Derecho UNT.
        </span>
      </footer>
    </div>
  );
}
