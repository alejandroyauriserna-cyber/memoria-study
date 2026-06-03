-- Bucket PRIVADO + políticas Storage (ejecutar DESPUÉS de 20260605_cuaderno_stickers_rls_favorites.sql)
-- NO recrea cuaderno_user_stickers

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cuaderno-stickers',
  'cuaderno-stickers',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cuaderno_stickers_auth_read_own" on storage.objects;
drop policy if exists "cuaderno_stickers_auth_insert_own" on storage.objects;
drop policy if exists "cuaderno_stickers_auth_update_own" on storage.objects;
drop policy if exists "cuaderno_stickers_auth_delete_own" on storage.objects;

-- Solo el dueño de la carpeta {user_id}/ puede leer (URLs firmadas las genera el servidor con service_role)
create policy "cuaderno_stickers_auth_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cuaderno-stickers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cuaderno_stickers_auth_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cuaderno-stickers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cuaderno_stickers_auth_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'cuaderno-stickers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cuaderno-stickers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cuaderno_stickers_auth_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cuaderno-stickers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
