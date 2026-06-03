-- NO recrea cuaderno_user_stickers (ya existe: id, user_id, name, image_url, created_at)
-- Solo RLS + tabla de favoritos

alter table public.cuaderno_user_stickers enable row level security;

drop policy if exists "cuaderno_user_stickers_select_own" on public.cuaderno_user_stickers;
drop policy if exists "cuaderno_user_stickers_insert_own" on public.cuaderno_user_stickers;
drop policy if exists "cuaderno_user_stickers_update_own" on public.cuaderno_user_stickers;
drop policy if exists "cuaderno_user_stickers_delete_own" on public.cuaderno_user_stickers;

create policy "cuaderno_user_stickers_select_own"
  on public.cuaderno_user_stickers for select to authenticated
  using (auth.uid() = user_id);

create policy "cuaderno_user_stickers_insert_own"
  on public.cuaderno_user_stickers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "cuaderno_user_stickers_update_own"
  on public.cuaderno_user_stickers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cuaderno_user_stickers_delete_own"
  on public.cuaderno_user_stickers for delete to authenticated
  using (auth.uid() = user_id);

-- Favoritos (sticker de biblioteca personal o catálogo PNG por id externo)
create table if not exists public.user_sticker_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  sticker_id uuid not null references public.cuaderno_user_stickers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, sticker_id)
);

create index if not exists user_sticker_favorites_user_idx
  on public.user_sticker_favorites (user_id, created_at desc);

alter table public.user_sticker_favorites enable row level security;

drop policy if exists "user_sticker_favorites_select_own" on public.user_sticker_favorites;
drop policy if exists "user_sticker_favorites_insert_own" on public.user_sticker_favorites;
drop policy if exists "user_sticker_favorites_delete_own" on public.user_sticker_favorites;

create policy "user_sticker_favorites_select_own"
  on public.user_sticker_favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "user_sticker_favorites_insert_own"
  on public.user_sticker_favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_sticker_favorites_delete_own"
  on public.user_sticker_favorites for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.cuaderno_user_stickers to authenticated;
grant select, insert, delete on public.user_sticker_favorites to authenticated;
