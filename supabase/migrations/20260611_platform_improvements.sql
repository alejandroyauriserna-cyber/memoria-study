-- Guided study cloud progress + PDF page cache

create table if not exists public.guided_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  current_page int not null default 1 check (current_page >= 1),
  understood_pages int[] not null default '{}',
  analysis_version int not null default 1,
  last_updated timestamptz not null default now(),
  unique (user_id, material_id)
);

create index if not exists guided_study_sessions_user_idx
  on public.guided_study_sessions(user_id);

alter table public.guided_study_sessions enable row level security;

drop policy if exists "Users read own guided study sessions" on public.guided_study_sessions;
create policy "Users read own guided study sessions"
  on public.guided_study_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own guided study sessions" on public.guided_study_sessions;
create policy "Users upsert own guided study sessions"
  on public.guided_study_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own guided study sessions" on public.guided_study_sessions;
create policy "Users update own guided study sessions"
  on public.guided_study_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.material_pdf_page_cache (
  material_id uuid primary key references public.materials(id) on delete cascade,
  pages jsonb not null,
  page_count int not null default 0,
  cached_at timestamptz not null default now()
);

alter table public.material_pdf_page_cache enable row level security;

drop policy if exists "Public read pdf cache for public materials" on public.material_pdf_page_cache;
create policy "Public read pdf cache for public materials"
  on public.material_pdf_page_cache for select
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_pdf_page_cache.material_id
        and (m.is_public = true or m.user_id = auth.uid())
    )
  );

-- Service role writes cache; no user insert policy needed for client writes.

-- Organizers: optional public share token
alter table public.organizers
  add column if not exists share_token text;

alter table public.organizers
  add column if not exists is_shared boolean not null default false;

create unique index if not exists organizers_share_token_unique_idx
  on public.organizers(share_token)
  where share_token is not null;

create index if not exists organizers_share_token_idx
  on public.organizers(share_token)
  where share_token is not null;
