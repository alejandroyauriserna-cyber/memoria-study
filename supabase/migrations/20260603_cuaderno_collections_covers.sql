-- Colecciones inteligentes (favoritos, exámenes, resúmenes) y portadas IA por curso

create table if not exists public.cuaderno_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.cuaderno_classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, class_id)
);

create index if not exists cuaderno_favorites_user_id_idx on public.cuaderno_favorites(user_id);

create table if not exists public.cuaderno_ai_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('exam', 'summary')),
  class_id uuid references public.cuaderno_classes(id) on delete set null,
  course_name text not null,
  class_title text,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists cuaderno_ai_items_user_kind_idx
  on public.cuaderno_ai_items(user_id, kind, created_at desc);

create table if not exists public.cuaderno_course_covers (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  cover_art jsonb not null,
  source text not null default 'ai' check (source in ('ai', 'manual')),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.cuaderno_favorites enable row level security;
alter table public.cuaderno_ai_items enable row level security;
alter table public.cuaderno_course_covers enable row level security;

drop policy if exists "Users read own cuaderno favorites" on public.cuaderno_favorites;
create policy "Users read own cuaderno favorites"
  on public.cuaderno_favorites for select using (auth.uid() = user_id);

drop policy if exists "Users create cuaderno favorites" on public.cuaderno_favorites;
create policy "Users create cuaderno favorites"
  on public.cuaderno_favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own cuaderno favorites" on public.cuaderno_favorites;
create policy "Users delete own cuaderno favorites"
  on public.cuaderno_favorites for delete using (auth.uid() = user_id);

drop policy if exists "Users read own cuaderno ai items" on public.cuaderno_ai_items;
create policy "Users read own cuaderno ai items"
  on public.cuaderno_ai_items for select using (auth.uid() = user_id);

drop policy if exists "Users create cuaderno ai items" on public.cuaderno_ai_items;
create policy "Users create cuaderno ai items"
  on public.cuaderno_ai_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own cuaderno ai items" on public.cuaderno_ai_items;
create policy "Users delete own cuaderno ai items"
  on public.cuaderno_ai_items for delete using (auth.uid() = user_id);

drop policy if exists "Users read own cuaderno course covers" on public.cuaderno_course_covers;
create policy "Users read own cuaderno course covers"
  on public.cuaderno_course_covers for select using (auth.uid() = user_id);

drop policy if exists "Users upsert own cuaderno course covers" on public.cuaderno_course_covers;
create policy "Users upsert own cuaderno course covers"
  on public.cuaderno_course_covers for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own cuaderno course covers" on public.cuaderno_course_covers;
create policy "Users update own cuaderno course covers"
  on public.cuaderno_course_covers for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
