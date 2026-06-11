-- =============================================================================
-- MEMORIASTUDY · APORTES COMUNITARIOS (pegar en Supabase SQL Editor)
-- Ejecutar DESPUÉS de jurisprudence-library-complete.sql
-- =============================================================================

alter table public.jurisprudence_documents
  add column if not exists submitted_by uuid references auth.users (id) on delete set null;

alter table public.jurisprudence_documents
  add column if not exists status text not null default 'published'
  check (status in ('published', 'pending', 'rejected'));

alter table public.jurisprudence_documents
  add column if not exists file_name text;

update public.jurisprudence_documents
set status = 'published', submitted_by = null
where submitted_by is null;

create index if not exists jurisprudence_documents_status_idx
  on public.jurisprudence_documents (status);

create index if not exists jurisprudence_documents_submitted_by_idx
  on public.jurisprudence_documents (submitted_by);

drop policy if exists "Public read jurisprudence documents" on public.jurisprudence_documents;

create policy "Public read published jurisprudence"
on public.jurisprudence_documents for select
using (
  (is_public = true and status = 'published')
  or (auth.uid() is not null and submitted_by = auth.uid())
);

drop policy if exists "Users submit jurisprudence" on public.jurisprudence_documents;
create policy "Users submit jurisprudence"
on public.jurisprudence_documents for insert
to authenticated
with check (
  submitted_by = auth.uid()
  and status = 'pending'
  and is_public = false
);

drop policy if exists "Authors delete own jurisprudence" on public.jurisprudence_documents;
create policy "Authors delete own jurisprudence"
on public.jurisprudence_documents for delete
to authenticated
using (submitted_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jurisprudence-pdfs',
  'jurisprudence-pdfs',
  true,
  20971520,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read jurisprudence pdfs" on storage.objects;
create policy "Public read jurisprudence pdfs"
on storage.objects for select
using (bucket_id = 'jurisprudence-pdfs');

drop policy if exists "Users upload jurisprudence pdfs" on storage.objects;
create policy "Users upload jurisprudence pdfs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'jurisprudence-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificación
select column_name, data_type
from information_schema.columns
where table_name = 'jurisprudence_documents'
  and column_name in ('id', 'submitted_by', 'status');
