-- Avatares de perfil generados con IA (bucket público para ranking).

alter table public.user_profiles
  add column if not exists avatar_url text;

comment on column public.user_profiles.avatar_url is
  'URL pública del avatar generado por el estudiante.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read profile avatars" on storage.objects;
create policy "Public read profile avatars"
  on storage.objects for select
  using (bucket_id = 'profile-avatars');

drop policy if exists "Users upload own profile avatar" on storage.objects;
create policy "Users upload own profile avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own profile avatar" on storage.objects;
create policy "Users update own profile avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own profile avatar" on storage.objects;
create policy "Users delete own profile avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
