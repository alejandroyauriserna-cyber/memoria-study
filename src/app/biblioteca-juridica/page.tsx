import { AppShell } from "@/components/ui/shell";
import { JurisprudenceWorkspace } from "@/components/jurisprudence/jurisprudence-workspace";

export const metadata = {
  title: "Biblioteca Jurídica",
  description:
    "Busca casaciones, sentencias, resoluciones y precedentes jurídicos peruanos en segundos.",
};

export const dynamic = "force-dynamic";

export default function BibliotecaJuridicaPage() {
  return (
    <AppShell>
      <div className="ms-home bj-page-wrap mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <JurisprudenceWorkspace />
      </div>
    </AppShell>
  );
}
