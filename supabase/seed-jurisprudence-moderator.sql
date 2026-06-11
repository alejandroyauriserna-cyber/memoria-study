-- Ejecutar en Supabase → SQL Editor (una sola vez).
-- Te da acceso de moderador aunque Vercel no tenga JURISPRUDENCE_MODERATOR_EMAILS.

insert into public.jurisprudence_moderators (email)
values ('amyauris@unitru.edu.pe')
on conflict (email) do nothing;
