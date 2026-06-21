-- Crea user_profiles si nunca se aplicó schema.sql, añade tiempo activo y ranking.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  academic_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists academic_context jsonb default '{}'::jsonb;
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists current_cycle_number integer;
alter table public.user_profiles add column if not exists current_cycle_label text;
alter table public.user_profiles add column if not exists total_shared integer not null default 0;
alter table public.user_profiles add column if not exists total_likes_received integer not null default 0;
alter table public.user_profiles add column if not exists total_downloads_received integer not null default 0;
alter table public.user_profiles add column if not exists total_organizers integer not null default 0;
alter table public.user_profiles add column if not exists reputation_points integer not null default 0;
alter table public.user_profiles add column if not exists reputation_level text;
alter table public.user_profiles add column if not exists reputation_progress integer not null default 0;
alter table public.user_profiles add column if not exists badges jsonb default '[]'::jsonb;

alter table public.user_profiles
  add column if not exists active_study_ms bigint not null default 0;

alter table public.user_profiles
  add column if not exists active_study_ms_week bigint not null default 0;

alter table public.user_profiles
  add column if not exists active_study_week_key text;

alter table public.user_profiles
  add column if not exists show_in_study_ranking boolean not null default true;

comment on column public.user_profiles.active_study_ms is
  'Milisegundos de estudio activo (pestaña visible + interacción).';

comment on column public.user_profiles.active_study_ms_week is
  'Milisegundos de estudio activo acumulados en la semana ISO actual.';

comment on column public.user_profiles.show_in_study_ranking is
  'Si el estudiante aparece en el ranking público de horas activas.';

-- Reinicio justo del contador total (todos empiezan en cero tras esta migración).
update public.user_profiles
set
  active_study_ms = 0,
  active_study_ms_week = 0,
  active_study_week_key = null
where active_study_ms <> 0
   or active_study_ms_week <> 0
   or active_study_week_key is not null;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile"
on public.user_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users upsert own profile" on public.user_profiles;
create policy "Users upsert own profile"
on public.user_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile"
on public.user_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_profiles_active_study_ms_idx
  on public.user_profiles (active_study_ms desc);

create index if not exists user_profiles_active_study_ms_week_idx
  on public.user_profiles (active_study_ms_week desc);

create index if not exists user_profiles_study_ranking_idx
  on public.user_profiles (show_in_study_ranking, current_cycle_number)
  where show_in_study_ranking = true;
