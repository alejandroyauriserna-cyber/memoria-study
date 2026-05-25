import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-foreground text-background">
              <BookOpen size={18} />
            </span>
            <span className="font-semibold tracking-tight">MemoriaStudy</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
            >
              Panel
            </Link>
            <Link
              href="/auth"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
            >
              Ingresar
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={15} /> Hecho para estudiar mejor, incluso sin creditos de IA.
        </span>
      </footer>
    </div>
  );
}
