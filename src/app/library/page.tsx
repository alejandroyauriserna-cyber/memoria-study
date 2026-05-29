import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { BookOpen, ChevronRight } from "lucide-react";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

export default function LibraryHomePage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">Biblioteca Colaborativa</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Banco de Apuntes UNT</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Explora materiales compartidos por ciclo y curso. Todo derecho UNT está abierto para consulta.
            </p>
          </div>
          <Link
            href="/upload-material"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Subir material
          </Link>
        </div>

        <div className="grid gap-4">
          {UNT_DERECHO.years.map((year) => (
            <div key={year.number} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">{year.label}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {year.cycles.map((cycle) => (
                  <div key={cycle.number} className="rounded-2xl border border-border bg-muted p-5">
                    <p className="text-sm font-semibold text-accent">{cycle.label}</p>
                    <div className="mt-3 space-y-2">
                      {cycle.courses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/library/${course.id}`}
                          className="block rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground hover:border-accent hover:bg-background"
                        >
                          <span>{course.name}</span>
                          <ChevronRight className="ml-2 inline-block align-middle" size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
