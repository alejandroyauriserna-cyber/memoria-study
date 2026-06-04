-- Preferencias del asistente de fuentes (Fase C) y plantillas web jurisprudencia (Fase B)
alter table public.legal_source_settings add column if not exists study_categories jsonb not null default '[]'::jsonb;
alter table public.legal_source_settings add column if not exists wizard_completed boolean not null default false;

alter table public.legal_sources add column if not exists web_template_id text;

create index if not exists legal_sources_user_web_template_idx
  on public.legal_sources(user_id, web_template_id)
  where web_template_id is not null;
