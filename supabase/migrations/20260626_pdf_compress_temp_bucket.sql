-- Bucket temporal para comprimir PDFs vía microservicio Ghostscript.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pdf-compress-temp',
  'pdf-compress-temp',
  false,
  157286400,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload pdf compress temp" on storage.objects;
create policy "Users upload pdf compress temp"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pdf-compress-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users read own pdf compress temp" on storage.objects;
create policy "Users read own pdf compress temp"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pdf-compress-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own pdf compress temp" on storage.objects;
create policy "Users delete own pdf compress temp"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pdf-compress-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);
