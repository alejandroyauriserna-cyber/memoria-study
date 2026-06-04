-- URLs personalizadas y múltiples fuentes LP por preset
alter table public.legal_sources add column if not exists sync_urls jsonb;

alter table public.legal_source_settings add column if not exists lp_preset_urls jsonb not null default '{}'::jsonb;
