import { AppShell } from "@/components/ui/shell";
import { UploadMaterialForm } from "@/components/materials/upload-material-form";

export default function UploadMaterialPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="tron-panel mb-8 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Subir material</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA]">Comparte apuntes con la red</h1>
          <p className="mt-2 text-muted-foreground">
            Agrega tus apuntes, resúmenes, casos prácticos o PDFs para que otros estudiantes de Derecho UNT los consulten.
          </p>
        </div>
        <UploadMaterialForm />
      </section>
    </AppShell>
  );
}
