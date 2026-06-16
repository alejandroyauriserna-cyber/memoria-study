-- Micro Estudio Mobile: actividad académica real (no clics ni tiempo en pantalla)

create table if not exists public.micro_study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default (current_date),
  activity_type text not null check (
    activity_type in (
      'micro_session_completed',
      'concept_reviewed',
      'sentencia_read',
      'daily_active'
    )
  ),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists micro_study_activity_user_date_idx
  on public.micro_study_activity (user_id, activity_date desc);

create index if not exists micro_study_activity_user_type_idx
  on public.micro_study_activity (user_id, activity_type);

alter table public.micro_study_activity enable row level security;

drop policy if exists "Users manage own micro study activity" on public.micro_study_activity;
create policy "Users manage own micro study activity"
on public.micro_study_activity for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
