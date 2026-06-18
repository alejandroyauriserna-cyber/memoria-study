-- Ingesta inteligente de jurisprudencia (PDF → IA → revisión masiva)

alter table public.jurisprudence_documents
  drop constraint if exists jurisprudence_documents_tipo_check;

alter table public.jurisprudence_documents
  add constraint jurisprudence_documents_tipo_check
  check (
    tipo in (
      'casacion',
      'sentencia',
      'expediente',
      'resolucion',
      'precedente_vinculante',
      'pleno_casatorio',
      'sentencia_tc'
    )
  );

alter table public.jurisprudence_documents
  add column if not exists sala text,
  add column if not exists distrito_judicial text,
  add column if not exists asunto_principal text,
  add column if not exists numero_documento text;

create table if not exists public.jurisprudence_ingest_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  label text,
  status text not null default 'uploading' check (
    status in ('uploading', 'processing', 'review', 'completed', 'failed')
  ),
  total_count integer not null default 0,
  processed_count integer not null default 0,
  published_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jurisprudence_ingest_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.jurisprudence_ingest_batches(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  pdf_url text,
  status text not null default 'queued' check (
    status in (
      'queued',
      'extracting',
      'analyzing',
      'ready',
      'low_confidence',
      'duplicate',
      'failed',
      'approved',
      'published'
    )
  ),
  extracted_text text,
  suggested jsonb,
  confidence jsonb,
  duplicate_of text,
  error_message text,
  document_id text references public.jurisprudence_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jurisprudence_ingest_items_batch_id_idx
  on public.jurisprudence_ingest_items(batch_id);

create index if not exists jurisprudence_ingest_items_status_idx
  on public.jurisprudence_ingest_items(status);

create index if not exists jurisprudence_ingest_batches_created_by_idx
  on public.jurisprudence_ingest_batches(created_by);

alter table public.jurisprudence_ingest_batches enable row level security;
alter table public.jurisprudence_ingest_items enable row level security;
