import { AppShell } from "@/components/ui/shell";
import { UploadMaterialForm } from "@/components/materials/upload-material-form";

export default function UploadMaterialPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-accent">Subir material</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Comparte apuntes y guías con la comunidad</h1>
          <p className="mt-2 text-muted-foreground">
            Agrega tus apuntes, resúmenes, casos prácticos o PDFs para que otros estudiantes de Derecho UNT los consulten.
          </p>
        </div>
        <UploadMaterialForm />
      </section>
    </AppShell>
  );
}
