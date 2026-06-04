import type { LegalCitation } from "@/types/guided-legal-study";

function ConfidenceBadge({ confidence }: { confidence?: LegalCitation["confidence"] }) {
  if (confidence === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#86EFAC]">
        🟢 Verificado en fuente oficial
      </span>
    );
  }

  if (confidence === "conceptual") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[#FBBF24]">
        🟡 Relación conceptual encontrada
      </span>
    );
  }

  return null;
}

export function SourceCitationCard({ citation }: { citation: LegalCitation }) {
  const title = citation.sourceTitle ?? citation.norm;
  const fragment = citation.fragment ?? citation.text;

  return (
    <article className="gs-citation-card space-y-1.5">
      <ConfidenceBadge confidence={citation.confidence ?? "verified"} />
      <div className="grid gap-1 text-xs">
        <p>
          <span className="font-semibold text-muted-foreground">Fuente: </span>
          <span className="font-semibold text-[#86EFAC]">{title}</span>
        </p>
        {citation.article ? (
          <p>
            <span className="font-semibold text-muted-foreground">Artículo: </span>
            <span className="text-[#F5F7FA]/90">{citation.article}</span>
          </p>
        ) : null}
        {citation.page ? (
          <p>
            <span className="font-semibold text-muted-foreground">Página: </span>
            <span className="text-[#F5F7FA]/90">{citation.page}</span>
          </p>
        ) : null}
        {citation.author ? (
          <p>
            <span className="font-semibold text-muted-foreground">Autor: </span>
            <span className="text-[#F5F7FA]/90">{citation.author}</span>
          </p>
        ) : null}
      </div>
      {fragment ? (
        <div className="rounded-lg border border-[rgba(134,239,172,0.12)] bg-[rgba(0,0,0,0.2)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fragmento utilizado
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{fragment}</p>
        </div>
      ) : null}
    </article>
  );
}

export function ConceptualNormCard({
  label,
  note,
}: {
  label: string;
  note: string;
}) {
  return (
    <article className="rounded-lg border border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.05)] px-3 py-2.5">
      <ConfidenceBadge confidence="conceptual" />
      <p className="mt-1.5 text-sm font-semibold text-[#F5F7FA]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </article>
  );
}
