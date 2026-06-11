-- Biblioteca Jurídica — admin: motivo de rechazo y reportes

alter table public.jurisprudence_documents
  add column if not exists rejection_reason text;

create table if not exists public.jurisprudence_reports (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.jurisprudence_documents (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 10),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists jurisprudence_reports_status_idx
  on public.jurisprudence_reports (status);

create index if not exists jurisprudence_reports_document_id_idx
  on public.jurisprudence_reports (document_id);

alter table public.jurisprudence_reports enable row level security;

drop policy if exists "Users report jurisprudence documents" on public.jurisprudence_reports;
create policy "Users report jurisprudence documents"
on public.jurisprudence_reports for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Users read own reports" on public.jurisprudence_reports;
create policy "Users read own reports"
on public.jurisprudence_reports for select
to authenticated
using (reporter_id = auth.uid());
