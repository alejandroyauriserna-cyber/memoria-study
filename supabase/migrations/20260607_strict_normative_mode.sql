-- Modo estricto normativo: solo artículos verificados en base indexada
alter table public.legal_source_settings
add column if not exists strict_normative_mode boolean not null default true;
