-- Bucket y políticas para subida directa desde el navegador (evita límite 4.5 MB de Vercel).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shared-materials',
  'shared-materials',
  true,
  157286400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read shared materials" on storage.objects;
create policy "Public read shared materials"
on storage.objects for select
using (bucket_id = 'shared-materials');

drop policy if exists "Users upload shared materials" on storage.objects;
create policy "Users upload shared materials"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'shared-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own shared materials" on storage.objects;
create policy "Users delete own shared materials"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'shared-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
