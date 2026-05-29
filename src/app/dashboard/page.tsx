import Link from "next/link";
import { BookMarked, Brain, Layers3, Scale, BookOpen, User, FileText } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { ProfileSync } from "@/components/dashboard/profile-sync";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const cards = [
  { label: "Universidad", value: "UNT", icon: BookMarked },
  { label: "Carrera", value: "Derecho", icon: Scale },
  { label: "Estudio colaborativo", value: "Biblioteca", icon: BookOpen },
  { label: "Materiales", value: "Sube y comparte", icon: FileText },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-accent">
              {UNT_DERECHO.university}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Panel de {UNT_DERECHO.career}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Organiza tu material por ciclo y consulta apuntes, guías y casos prácticos
              compartidos por la comunidad.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="min-w-28 rounded-lg border border-border bg-card p-3"
              >
                <card.icon className="text-accent" size={17} />
                <p className="mt-3 text-lg font-semibold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link href="/library" className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:border-accent">
            <div className="flex items-center gap-3 text-accent">
              <FileText size={20} />
              <div>
                <p className="text-sm font-semibold">Biblioteca UNT</p>
                <p className="text-xs text-muted-foreground">Accede a apuntes y archivos por curso</p>
              </div>
            </div>
          </Link>
          <Link href="/upload-material" className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:border-accent">
            <div className="flex items-center gap-3 text-accent">
              <BookOpen size={20} />
              <div>
                <p className="text-sm font-semibold">Subir material</p>
                <p className="text-xs text-muted-foreground">Comparte tus PDFs, guías y casos</p>
              </div>
            </div>
          </Link>
          <Link href="/profile" className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:border-accent">
            <div className="flex items-center gap-3 text-accent">
              <User size={20} />
              <div>
                <p className="text-sm font-semibold">Perfil académico</p>
                <p className="text-xs text-muted-foreground">Actualiza tu ciclo y datos personales</p>
              </div>
            </div>
          </Link>
        </div>

        <ProfileSync />
        <UploadGenerator />
      </section>
    </AppShell>
  );
}
