-- Migration: add material_favorites and organizers tables with RLS and indexes
-- Generated: 2026-05-29

create table if not exists public.material_favorites (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (material_id, user_id)
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

create index if not exists material_favorites_material_id_idx on public.material_favorites(material_id);
create index if not exists material_favorites_user_id_idx on public.material_favorites(user_id);
create index if not exists organizers_user_id_idx on public.organizers(user_id);
create index if not exists organizers_course_id_idx on public.organizers(course_id);
create index if not exists organizers_cycle_number_idx on public.organizers(cycle_number);

alter table public.material_favorites enable row level security;
alter table public.organizers enable row level security;

create policy if not exists "Users own favorites" on public.material_favorites for select using (auth.uid() = user_id);
create policy if not exists "Users insert favorites" on public.material_favorites for insert with check (auth.uid() = user_id);
create policy if not exists "Users delete own favorites" on public.material_favorites for delete using (auth.uid() = user_id);

create policy if not exists "Users read own organizers" on public.organizers for select using (auth.uid() = user_id);
create policy if not exists "Users create organizers" on public.organizers for insert with check (auth.uid() = user_id);
create policy if not exists "Users update own organizers" on public.organizers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Users delete own organizers" on public.organizers for delete using (auth.uid() = user_id);
