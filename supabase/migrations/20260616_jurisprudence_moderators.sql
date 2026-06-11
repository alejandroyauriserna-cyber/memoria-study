-- Moderadores de Biblioteca Jurídica (respaldo si JURISPRUDENCE_MODERATOR_EMAILS no está en Vercel).
-- Solo el service role lee esta tabla; los clientes no tienen acceso.

create table if not exists public.jurisprudence_moderators (
  email text primary key check (position('@' in email) > 1),
  created_at timestamptz not null default now()
);

alter table public.jurisprudence_moderators enable row level security;

-- Sin políticas: lectura/escritura solo vía service role (API admin).

-- Tras migrar, añade tu correo en Supabase → SQL Editor:
-- insert into public.jurisprudence_moderators (email)
-- values ('amyauris@unitru.edu.pe')
-- on conflict (email) do nothing;
