-- DEPRECATED: usar 20260623_user_profiles_study_ranking.sql (crea user_profiles si no existe).
-- Reinicio justo de horas de estudio: solo tiempo activo real a partir de esta migración.

alter table public.user_profiles
  add column if not exists active_study_ms bigint not null default 0;

comment on column public.user_profiles.active_study_ms is
  'Milisegundos de estudio activo (pestaña visible + interacción). Reiniciado en 2026-06-22.';

update public.user_profiles
set active_study_ms = 0;
