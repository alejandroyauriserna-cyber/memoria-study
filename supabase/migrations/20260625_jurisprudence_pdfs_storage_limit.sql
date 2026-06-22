-- Align jurisprudence PDF bucket limit with app (150 MB) for direct browser uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jurisprudence-pdfs',
  'jurisprudence-pdfs',
  true,
  157286400,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
