-- Unique material views, favorites, and study history.

create table if not exists public.material_views (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists material_views_material_id_idx on public.material_views(material_id);
create index if not exists material_views_user_material_viewed_idx on public.material_views(user_id, material_id, viewed_at desc);
create index if not exists material_views_recent_idx on public.material_views(viewed_at desc);

alter table public.material_views enable row level security;

create policy if not exists "Users read own material views"
on public.material_views for select
using (auth.uid() = user_id);

create policy if not exists "Users insert own material views"
on public.material_views for insert
with check (auth.uid() = user_id);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, material_id)
);

insert into public.favorites (user_id, material_id, created_at)
select user_id, material_id, created_at
from public.material_favorites
on conflict (user_id, material_id) do nothing;

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_material_id_idx on public.favorites(material_id);
create index if not exists favorites_created_at_idx on public.favorites(created_at desc);

alter table public.favorites enable row level security;

create policy if not exists "Users own favorites"
on public.favorites for select
using (auth.uid() = user_id);

create policy if not exists "Users insert favorites"
on public.favorites for insert
with check (auth.uid() = user_id);

create policy if not exists "Users delete own favorites"
on public.favorites for delete
using (auth.uid() = user_id);

create table if not exists public.material_study_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  opened_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create index if not exists material_study_history_user_opened_idx on public.material_study_history(user_id, opened_at desc);
create index if not exists material_study_history_material_id_idx on public.material_study_history(material_id);

alter table public.material_study_history enable row level security;

create policy if not exists "Users read own study history"
on public.material_study_history for select
using (auth.uid() = user_id);

create policy if not exists "Users insert own study history"
on public.material_study_history for insert
with check (auth.uid() = user_id);

create policy if not exists "Users update own study history"
on public.material_study_history for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
