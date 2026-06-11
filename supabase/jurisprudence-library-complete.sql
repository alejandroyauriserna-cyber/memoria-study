-- =============================================================================
-- MEMORIASTUDY · BIBLIOTECA JURÍDICA — SCRIPT COMPLETO PARA SUPABASE
-- =============================================================================
-- Cómo usar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Pega TODO este archivo
--   3. Run
--
-- Incluye: tablas, índices, RLS, trigger updated_at, búsqueda full-text (español).
-- Catálogo sin demo: los aportes vienen de estudiantes UNT (contributions SQL).
-- =============================================================================

-- Función updated_at (idempotente — no falla si ya existe)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Tabla principal ─────────────────────────────────────────────────────────
create table if not exists public.jurisprudence_documents (
  id text primary key,
  title text not null,
  tipo text not null check (
    tipo in ('casacion', 'sentencia', 'expediente', 'resolucion', 'precedente_vinculante')
  ),
  materia text not null check (
    materia in ('civil', 'penal', 'constitucional', 'tributario', 'laboral', 'administrativo', 'procesal')
  ),
  submateria text not null default '',
  year integer not null check (year >= 1900 and year <= 2100),
  organo text not null,
  summary text not null default '',
  keywords text[] not null default '{}',
  pdf_url text not null default '',
  expediente text,
  source_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columna de búsqueda full-text (trigger — Postgres no admite GENERATED con to_tsvector)
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
    setweight(to_tsvector('spanish', coalesce(new.summary, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(new.expediente, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.organo, '')), 'D');
  return new;
end;
$$;

drop trigger if exists jurisprudence_documents_search_vector on public.jurisprudence_documents;

create trigger jurisprudence_documents_search_vector
before insert or update of title, submateria, summary, expediente, organo
on public.jurisprudence_documents
for each row
execute function public.jurisprudence_documents_set_search_vector();

-- Índices
create index if not exists jurisprudence_documents_materia_idx
  on public.jurisprudence_documents (materia);

create index if not exists jurisprudence_documents_tipo_idx
  on public.jurisprudence_documents (tipo);

create index if not exists jurisprudence_documents_year_idx
  on public.jurisprudence_documents (year desc);

create index if not exists jurisprudence_documents_organo_idx
  on public.jurisprudence_documents (organo);

create index if not exists jurisprudence_documents_keywords_gin_idx
  on public.jurisprudence_documents using gin (keywords);

create index if not exists jurisprudence_documents_search_vector_idx
  on public.jurisprudence_documents using gin (search_vector);

-- Trigger updated_at
drop trigger if exists jurisprudence_documents_set_updated_at on public.jurisprudence_documents;
create trigger jurisprudence_documents_set_updated_at
before update on public.jurisprudence_documents
for each row
execute function public.set_updated_at();

-- RLS documentos (lectura pública)
alter table public.jurisprudence_documents enable row level security;

drop policy if exists "Public read jurisprudence documents" on public.jurisprudence_documents;
create policy "Public read jurisprudence documents"
on public.jurisprudence_documents for select
using (is_public = true);

-- ─── Favoritos por usuario ───────────────────────────────────────────────────
create table if not exists public.jurisprudence_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id text not null references public.jurisprudence_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists jurisprudence_favorites_user_id_idx
  on public.jurisprudence_favorites (user_id);

alter table public.jurisprudence_favorites enable row level security;

drop policy if exists "Users manage own jurisprudence favorites" on public.jurisprudence_favorites;
create policy "Users manage own jurisprudence favorites"
on public.jurisprudence_favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ─── Catálogo inicial ────────────────────────────────────────────────────────
-- No se insertan resoluciones demo (enlaces genéricos sin PDF real).
-- El catálogo crece con aportes UNT verificados (ver jurisprudence-contributions-complete.sql).
-- Para eliminar datos demo previos: supabase/jurisprudence-cleanup-demo.sql

-- Verificación rápida
select count(*) as total_documentos from public.jurisprudence_documents;
select id, title, materia, year from public.jurisprudence_documents order by year desc;
