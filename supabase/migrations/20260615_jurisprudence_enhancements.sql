-- Biblioteca Jurídica: texto extraído, FTS con trigger (evita error 42P17)

alter table public.jurisprudence_documents
  add column if not exists extracted_text text;

create index if not exists jurisprudence_documents_expediente_idx
  on public.jurisprudence_documents (lower(trim(coalesce(expediente, ''))))
  where expediente is not null and trim(expediente) <> '';

-- search_vector como columna normal + trigger (GENERATED no admite to_tsvector en Postgres)
alter table public.jurisprudence_documents
  drop column if exists search_vector;

alter table public.jurisprudence_documents
  add column if not exists search_vector tsvector;

create or replace function public.jurisprudence_documents_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('spanish', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.submateria, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(array_to_string(new.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.summary, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(new.expediente, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.organo, '')), 'D') ||
    setweight(to_tsvector('spanish', coalesce(new.extracted_text, '')), 'C');
  return new;
end;
$$;

drop trigger if exists jurisprudence_documents_search_vector on public.jurisprudence_documents;

create trigger jurisprudence_documents_search_vector
before insert or update of title, submateria, keywords, summary, expediente, organo, extracted_text
on public.jurisprudence_documents
for each row
execute function public.jurisprudence_documents_set_search_vector();

-- Rellenar filas existentes
update public.jurisprudence_documents
set search_vector =
  setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(submateria, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(array_to_string(keywords, ' '), '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(summary, '')), 'C') ||
  setweight(to_tsvector('spanish', coalesce(expediente, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(organo, '')), 'D') ||
  setweight(to_tsvector('spanish', coalesce(extracted_text, '')), 'C');

create index if not exists jurisprudence_documents_search_vector_idx
  on public.jurisprudence_documents using gin (search_vector);
