-- Reto Beta Julio 2026: horas bonus IA + tracking del premio S/ 40.

alter table public.user_profiles
  add column if not exists bonus_study_ms bigint not null default 0;

alter table public.user_profiles
  add column if not exists beta_july_active_ms bigint not null default 0;

alter table public.user_profiles
  add column if not exists beta_ai_gemini_at timestamptz;

alter table public.user_profiles
  add column if not exists beta_ai_hf_at timestamptz;

alter table public.user_profiles
  add column if not exists beta_ai_first_gen_at timestamptz;

alter table public.user_profiles
  add column if not exists ai_gemini_key_encrypted text;

alter table public.user_profiles
  add column if not exists ai_hf_token_encrypted text;

comment on column public.user_profiles.bonus_study_ms is
  'Horas bonus del reto (conectar IA). Cuentan en ranking visual, no en premio S/ 40.';

comment on column public.user_profiles.beta_july_active_ms is
  'Horas activas reales acumuladas durante el reto beta (21–27 jul 2026, America/Lima).';

create index if not exists user_profiles_beta_july_active_ms_idx
  on public.user_profiles (beta_july_active_ms desc)
  where show_in_study_ranking = true;
