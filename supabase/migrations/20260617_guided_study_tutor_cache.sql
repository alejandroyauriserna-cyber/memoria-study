-- Explicaciones del tutor IA por usuario/material/página (sincroniza entre dispositivos).

create table if not exists public.guided_study_tutor_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  cache_key text not null,
  source_fingerprint text not null,
  result jsonb not null,
  cached_at timestamptz not null default now(),
  unique (user_id, material_id, cache_key)
);

create index if not exists guided_study_tutor_cache_user_material_idx
  on public.guided_study_tutor_cache (user_id, material_id);

create index if not exists guided_study_tutor_cache_cached_at_idx
  on public.guided_study_tutor_cache (user_id, material_id, cached_at);

alter table public.guided_study_tutor_cache enable row level security;

drop policy if exists "Users read own tutor cache" on public.guided_study_tutor_cache;
create policy "Users read own tutor cache"
  on public.guided_study_tutor_cache for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own tutor cache" on public.guided_study_tutor_cache;
create policy "Users insert own tutor cache"
  on public.guided_study_tutor_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own tutor cache" on public.guided_study_tutor_cache;
create policy "Users update own tutor cache"
  on public.guided_study_tutor_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own tutor cache" on public.guided_study_tutor_cache;
create policy "Users delete own tutor cache"
  on public.guided_study_tutor_cache for delete
  using (auth.uid() = user_id);
