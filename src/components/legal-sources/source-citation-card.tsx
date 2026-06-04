import type { LegalCitation } from "@/types/guided-legal-study";

export function SourceCitationCard({ citation }: { citation: LegalCitation }) {
  const title = citation.sourceTitle ?? citation.norm;
  const fragment = citation.fragment ?? citation.text;

  return (
    <article className="gs-citation-card space-y-1.5">
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
