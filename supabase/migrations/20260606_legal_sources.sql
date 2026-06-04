-- Biblioteca jurídica personal: fuentes subidas por el estudiante
create table if not exists public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (
    category in ('normativa', 'jurisprudencia', 'doctrina', 'material_universitario')
  ),
  kind text not null default 'upload' check (kind in ('upload', 'material')),
  author text,
  description text,
  file_url text,
  file_name text,
  material_id uuid references public.materials(id) on delete set null,
  extracted_text text,
  enabled boolean not null default true,
  priority integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legal_sources_user_id_idx on public.legal_sources(user_id);
create index if not exists legal_sources_material_id_idx on public.legal_sources(material_id);

drop trigger if exists legal_sources_set_updated_at on public.legal_sources;
create trigger legal_sources_set_updated_at
before update on public.legal_sources
for each row
execute function public.set_updated_at();

alter table public.legal_sources enable row level security;

drop policy if exists "Users manage own legal sources" on public.legal_sources;
create policy "Users manage own legal sources"
on public.legal_sources for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.legal_source_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strict_mode boolean not null default false,
  source_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists legal_source_settings_set_updated_at on public.legal_source_settings;
create trigger legal_source_settings_set_updated_at
before update on public.legal_source_settings
for each row
execute function public.set_updated_at();

alter table public.legal_source_settings enable row level security;

drop policy if exists "Users manage own legal source settings" on public.legal_source_settings;
create policy "Users manage own legal source settings"
on public.legal_source_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
