import { BookMarked, Brain, Layers3, Scale } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { ProfileSync } from "@/components/dashboard/profile-sync";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const tiles = [
  { label: "Universidad", value: "UNT", icon: BookMarked },
  { label: "Carrera", value: "Derecho", icon: Scale },
  { label: "Modos de estudio", value: "5", icon: Layers3 },
  { label: "PDF escaneado", value: "OCR", icon: Brain },
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
              Organiza tu material por año, ciclo, curso y semana. Genera flashcards,
              definiciones, juego de pares, completar espacios y quiz en español jurídico.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="min-w-28 rounded-lg border border-border bg-card p-3"
              >
                <tile.icon className="text-accent" size={17} />
                <p className="mt-3 text-lg font-semibold">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
        </div>
        <ProfileSync />
        <UploadGenerator />
      </section>
    </AppShell>
  );
}
