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
alter table public.user_profiles add column if not exists active_study_ms bigint not null default 0;
alter table public.user_profiles add column if not exists active_study_ms_week bigint not null default 0;
alter table public.user_profiles add column if not exists active_study_week_key text;
alter table public.user_profiles add column if not exists show_in_study_ranking boolean not null default true;

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

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author_name text not null,
  title text not null,
  description text not null,
  course_id text not null,
  course_name text not null,
  cycle_number integer not null,
  cycle_label text not null,
  material_type text not null check (material_type in ('apunte', 'resumen', 'pdf', 'caso', 'guia', 'otro')),
  file_name text not null,
  file_url text not null,
  views integer not null default 0,
  downloads integer not null default 0,
  likes integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_user_id_idx on public.materials(user_id);
create index if not exists materials_course_id_idx on public.materials(course_id);
create index if not exists materials_cycle_number_idx on public.materials(cycle_number);
create index if not exists materials_public_idx on public.materials(is_public) where is_public = true;
create index if not exists materials_likes_idx on public.materials(likes);

alter table public.materials enable row level security;

create table if not exists public.material_likes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (material_id, user_id)
);

create table if not exists public.material_favorites (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (material_id, user_id)
);

create table if not exists public.material_views (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create table if not exists public.material_study_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  opened_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  title text not null,
  description text not null,
  course_id text not null,
  course_name text not null,
  cycle_number integer not null,
  cycle_label text not null,
  organizer_type text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_likes_idx on public.materials(likes);
create index if not exists material_views_material_id_idx on public.material_views(material_id);
create index if not exists material_views_user_material_viewed_idx on public.material_views(user_id, material_id, viewed_at desc);
create index if not exists material_views_recent_idx on public.material_views(viewed_at desc);
create index if not exists material_favorites_material_id_idx on public.material_favorites(material_id);
create index if not exists material_favorites_user_id_idx on public.material_favorites(user_id);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_material_id_idx on public.favorites(material_id);
create index if not exists favorites_created_at_idx on public.favorites(created_at desc);
create index if not exists material_study_history_user_opened_idx on public.material_study_history(user_id, opened_at desc);
create index if not exists material_study_history_material_id_idx on public.material_study_history(material_id);
create index if not exists organizers_user_id_idx on public.organizers(user_id);
create index if not exists organizers_course_id_idx on public.organizers(course_id);
create index if not exists organizers_cycle_number_idx on public.organizers(cycle_number);

alter table public.material_likes enable row level security;
alter table public.material_favorites enable row level security;
alter table public.material_views enable row level security;
alter table public.favorites enable row level security;
alter table public.material_study_history enable row level security;
alter table public.organizers enable row level security;

create policy if not exists "Users own likes" on public.material_likes for select using (auth.uid() = user_id);
create policy if not exists "Users insert likes" on public.material_likes for insert with check (auth.uid() = user_id);
create policy if not exists "Users delete own likes" on public.material_likes for delete using (auth.uid() = user_id);

create policy if not exists "Users own favorites" on public.material_favorites for select using (auth.uid() = user_id);
create policy if not exists "Users insert favorites" on public.material_favorites for insert with check (auth.uid() = user_id);
create policy if not exists "Users delete own favorites" on public.material_favorites for delete using (auth.uid() = user_id);

create policy if not exists "Users read own material views" on public.material_views for select using (auth.uid() = user_id);
create policy if not exists "Users insert own material views" on public.material_views for insert with check (auth.uid() = user_id);

create policy if not exists "Users own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy if not exists "Users insert favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy if not exists "Users delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

create policy if not exists "Users read own study history" on public.material_study_history for select using (auth.uid() = user_id);
create policy if not exists "Users insert own study history" on public.material_study_history for insert with check (auth.uid() = user_id);
create policy if not exists "Users update own study history" on public.material_study_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users read own organizers" on public.organizers for select using (auth.uid() = user_id);
create policy if not exists "Users create organizers" on public.organizers for insert with check (auth.uid() = user_id);
create policy if not exists "Users update own organizers" on public.organizers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Users delete own organizers" on public.organizers for delete using (auth.uid() = user_id);

create table if not exists public.cuaderno_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  course_name text not null,
  cycle_number integer not null,
  cycle_label text not null,
  class_number integer,
  title text not null,
  topic text,
  class_date date,
  notes text not null default '',
  extracted_concepts jsonb not null default '[]'::jsonb,
  material_id uuid references public.materials(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cuaderno_classes_user_id_idx on public.cuaderno_classes(user_id);
create index if not exists cuaderno_classes_course_id_idx on public.cuaderno_classes(course_id);

alter table public.cuaderno_classes enable row level security;

create policy if not exists "Users read own cuaderno classes" on public.cuaderno_classes for select using (auth.uid() = user_id);
create policy if not exists "Users create cuaderno classes" on public.cuaderno_classes for insert with check (auth.uid() = user_id);
create policy if not exists "Users update own cuaderno classes" on public.cuaderno_classes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Users delete own cuaderno classes" on public.cuaderno_classes for delete using (auth.uid() = user_id);

create index if not exists material_likes_material_id_idx on public.material_likes(material_id);
create index if not exists material_likes_user_id_idx on public.material_likes(user_id);

alter table public.material_likes enable row level security;

create policy if not exists "Users own likes" on public.material_likes for select using (auth.uid() = user_id);
create policy if not exists "Users insert likes" on public.material_likes for insert with check (auth.uid() = user_id);
create policy if not exists "Users delete own likes" on public.material_likes for delete using (auth.uid() = user_id);

drop policy if exists "Users can read public materials" on public.materials;
create policy "Users can read public materials"
on public.materials for select
using (is_public = true);

drop policy if exists "Users can read own materials" on public.materials;
create policy "Users can read own materials"
on public.materials for select
using (auth.uid() = user_id);

drop policy if exists "Users can create materials" on public.materials;
create policy "Users can create materials"
on public.materials for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own materials" on public.materials;
create policy "Users can update own materials"
on public.materials for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own materials" on public.materials;
create policy "Users can delete own materials"
on public.materials for delete
using (auth.uid() = user_id);
