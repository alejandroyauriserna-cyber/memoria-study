-- Fuentes jurídicas sincronizadas desde URL (LP Derecho)
alter table public.legal_sources drop constraint if exists legal_sources_kind_check;
alter table public.legal_sources add constraint legal_sources_kind_check
  check (kind in ('upload', 'material', 'url'));

alter table public.legal_sources add column if not exists source_url text;
alter table public.legal_sources add column if not exists lp_preset_id text;
alter table public.legal_sources add column if not exists parsed_articles jsonb;
alter table public.legal_sources add column if not exists article_count integer;
alter table public.legal_sources add column if not exists last_synced_at timestamptz;

create unique index if not exists legal_sources_user_lp_preset_idx
  on public.legal_sources(user_id, lp_preset_id)
  where lp_preset_id is not null;

create index if not exists legal_sources_source_url_idx
  on public.legal_sources(user_id, source_url)
  where source_url is not null;
