-- Cuaderno Inteligente: clases y apuntes por curso (sin depender de PDF)

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
create index if not exists cuaderno_classes_cycle_number_idx on public.cuaderno_classes(cycle_number);
create index if not exists cuaderno_classes_updated_at_idx on public.cuaderno_classes(updated_at desc);

alter table public.cuaderno_classes enable row level security;

drop policy if exists "Users read own cuaderno classes" on public.cuaderno_classes;
create policy "Users read own cuaderno classes"
  on public.cuaderno_classes for select using (auth.uid() = user_id);

drop policy if exists "Users create cuaderno classes" on public.cuaderno_classes;
create policy "Users create cuaderno classes"
  on public.cuaderno_classes for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own cuaderno classes" on public.cuaderno_classes;
create policy "Users update own cuaderno classes"
  on public.cuaderno_classes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own cuaderno classes" on public.cuaderno_classes;
create policy "Users delete own cuaderno classes"
  on public.cuaderno_classes for delete using (auth.uid() = user_id);
