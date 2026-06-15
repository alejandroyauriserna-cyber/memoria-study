-- Compartir apuntes y cuadernos colaborativos

alter table public.cuaderno_classes
  add column if not exists share_token text unique,
  add column if not exists is_shared boolean not null default false,
  add column if not exists share_permission text not null default 'view'
    check (share_permission in ('view', 'edit')),
  add column if not exists is_group_notebook boolean not null default false;

create index if not exists idx_cuaderno_classes_share_token
  on public.cuaderno_classes (share_token)
  where share_token is not null;

create table if not exists public.cuaderno_class_collaborators (
  class_id uuid not null references public.cuaderno_classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists idx_cuaderno_collaborators_user
  on public.cuaderno_class_collaborators (user_id);

alter table public.cuaderno_class_collaborators enable row level security;

create policy "Users read own collaborator rows"
  on public.cuaderno_class_collaborators for select
  using (auth.uid() = user_id);

create policy "Owners manage collaborators"
  on public.cuaderno_class_collaborators for all
  using (
    exists (
      select 1 from public.cuaderno_classes c
      where c.id = class_id and c.user_id = auth.uid()
    )
  );
