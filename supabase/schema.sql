create extension if not exists pgcrypto;

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  source_name text not null,
  summary text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  estimated_minutes integer not null check (estimated_minutes > 0),
  flashcards jsonb not null default '[]'::jsonb,
  fill_blanks jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  definition_cards jsonb not null default '[]'::jsonb,
  matching_pairs jsonb not null default '[]'::jsonb,
  academic_context jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración para proyectos existentes
alter table public.decks add column if not exists definition_cards jsonb not null default '[]'::jsonb;
alter table public.decks add column if not exists matching_pairs jsonb not null default '[]'::jsonb;
alter table public.decks add column if not exists academic_context jsonb;

create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists decks_public_idx on public.decks(is_public) where is_public = true;
create index if not exists decks_academic_idx on public.decks using gin (academic_context);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists decks_set_updated_at on public.decks;
create trigger decks_set_updated_at
before update on public.decks
for each row
execute function public.set_updated_at();

alter table public.decks enable row level security;

drop policy if exists "Users can read their decks" on public.decks;
create policy "Users can read their decks"
on public.decks for select
using (auth.uid() = user_id);

drop policy if exists "Public decks are readable" on public.decks;
create policy "Public decks are readable"
on public.decks for select
using (is_public = true);

drop policy if exists "Users can create decks" on public.decks;
create policy "Users can create decks"
on public.decks for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can update their decks" on public.decks;
create policy "Users can update their decks"
on public.decks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their decks" on public.decks;
create policy "Users can delete their decks"
on public.decks for delete
using (auth.uid() = user_id);

-- Perfil académico UNT (ubicación por defecto para guardar mazos)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  academic_context jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists academic_context jsonb default '{}'::jsonb;

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
