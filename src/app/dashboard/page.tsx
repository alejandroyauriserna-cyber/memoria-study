import { BookMarked, Clock, FileStack, Share2 } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { UploadGenerator } from "@/components/study/upload-generator";

const tiles = [
  { label: "Decks", value: "Listo", icon: BookMarked },
  { label: "Cola", value: "PDF", icon: FileStack },
  { label: "Repaso", value: "18 min", icon: Clock },
  { label: "Compartir", value: "Publico", icon: Share2 },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-accent">Panel</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Centro de estudio</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="min-w-28 rounded-lg border border-border bg-card p-3">
                <tile.icon className="text-accent" size={17} />
                <p className="mt-3 text-lg font-semibold">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
        </div>
        <UploadGenerator />
      </section>
    </AppShell>
  );
}
