-- Huella del PDF para detectar duplicados exactos en la biblioteca.

alter table public.materials
  add column if not exists file_hash text;

create index if not exists materials_file_hash_idx
  on public.materials (file_hash)
  where file_hash is not null;

create index if not exists materials_course_file_name_idx
  on public.materials (course_id, lower(file_name));
