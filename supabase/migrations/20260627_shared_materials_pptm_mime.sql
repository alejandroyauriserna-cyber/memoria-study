-- Windows/browsers often report .pptm as macroenabled.12 (lowercase "enabled").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shared-materials',
  'shared-materials',
  true,
  157286400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    'application/vnd.ms-powerpoint.presentation.macroenabled.12'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
