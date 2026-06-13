-- Historial de preguntas libres al Profesor IA (por página/capítulo).

create table if not exists public.guided_study_tutor_chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  cache_key text not null,
  source_fingerprint text not null,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, material_id, cache_key)
);

create index if not exists guided_study_tutor_chat_user_material_idx
  on public.guided_study_tutor_chat (user_id, material_id);

alter table public.guided_study_tutor_chat enable row level security;

drop policy if exists "Users read own tutor chat" on public.guided_study_tutor_chat;
create policy "Users read own tutor chat"
  on public.guided_study_tutor_chat for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own tutor chat" on public.guided_study_tutor_chat;
create policy "Users insert own tutor chat"
  on public.guided_study_tutor_chat for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own tutor chat" on public.guided_study_tutor_chat;
create policy "Users update own tutor chat"
  on public.guided_study_tutor_chat for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own tutor chat" on public.guided_study_tutor_chat;
create policy "Users delete own tutor chat"
  on public.guided_study_tutor_chat for delete
  using (auth.uid() = user_id);
