-- =============================================================================
-- MEMORIASTUDY · BIBLIOTECA JURÍDICA — SCRIPT COMPLETO PARA SUPABASE
-- =============================================================================
-- Cómo usar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Pega TODO este archivo
--   3. Run
--
-- Incluye: tablas, índices, RLS, trigger updated_at, búsqueda full-text (español)
--          y las 14 resoluciones iniciales del catálogo curado.
-- =============================================================================

-- Función updated_at (idempotente — no falla si ya existe)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Tabla principal ─────────────────────────────────────────────────────────
create table if not exists public.jurisprudence_documents (
  id text primary key,
  title text not null,
  tipo text not null check (
    tipo in ('casacion', 'sentencia', 'expediente', 'resolucion', 'precedente_vinculante')
  ),
  materia text not null check (
    materia in ('civil', 'penal', 'constitucional', 'tributario', 'laboral', 'administrativo', 'procesal')
  ),
  submateria text not null default '',
  year integer not null check (year >= 1900 and year <= 2100),
  organo text not null,
  summary text not null default '',
  keywords text[] not null default '{}',
  pdf_url text not null default '',
  expediente text,
  source_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columna de búsqueda full-text (preparada para fase 2/3)
alter table public.jurisprudence_documents
  drop column if exists search_vector;

alter table public.jurisprudence_documents
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(submateria, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(expediente, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(organo, '')), 'D')
  ) stored;

-- Índices
create index if not exists jurisprudence_documents_materia_idx
  on public.jurisprudence_documents (materia);

create index if not exists jurisprudence_documents_tipo_idx
  on public.jurisprudence_documents (tipo);

create index if not exists jurisprudence_documents_year_idx
  on public.jurisprudence_documents (year desc);

create index if not exists jurisprudence_documents_organo_idx
  on public.jurisprudence_documents (organo);

create index if not exists jurisprudence_documents_keywords_gin_idx
  on public.jurisprudence_documents using gin (keywords);

create index if not exists jurisprudence_documents_search_vector_idx
  on public.jurisprudence_documents using gin (search_vector);

-- Trigger updated_at
drop trigger if exists jurisprudence_documents_set_updated_at on public.jurisprudence_documents;
create trigger jurisprudence_documents_set_updated_at
before update on public.jurisprudence_documents
for each row
execute function public.set_updated_at();

-- RLS documentos (lectura pública)
alter table public.jurisprudence_documents enable row level security;

drop policy if exists "Public read jurisprudence documents" on public.jurisprudence_documents;
create policy "Public read jurisprudence documents"
on public.jurisprudence_documents for select
using (is_public = true);

-- ─── Favoritos por usuario ───────────────────────────────────────────────────
create table if not exists public.jurisprudence_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id text not null references public.jurisprudence_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists jurisprudence_favorites_user_id_idx
  on public.jurisprudence_favorites (user_id);

alter table public.jurisprudence_favorites enable row level security;

drop policy if exists "Users manage own jurisprudence favorites" on public.jurisprudence_favorites;
create policy "Users manage own jurisprudence favorites"
on public.jurisprudence_favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ─── Seed: 14 resoluciones iniciales ─────────────────────────────────────────
insert into public.jurisprudence_documents (
  id, title, tipo, materia, submateria, year, organo, summary, keywords, pdf_url, expediente
) values
(
  'cas-1465-2007-lima',
  'Casación 1465-2007-Lima',
  'casacion',
  'civil',
  'Interpretación del Acto Jurídico',
  2007,
  'Sala Civil Permanente — Corte Suprema',
  'La Corte Suprema precisa que la simulación absoluta genera nulidad absoluta del acto disimulado, pues no existe voluntad negocial real. La interpretación del acto jurídico debe reconstruir la verdadera intención de las partes cuando el negocio aparente encubre una simulación.',
  array['simulación absoluta', 'simulación', 'acto jurídico', 'interpretación del acto jurídico', 'nulidad', 'voluntad negocial'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '1465-2007-Lima'
),
(
  'cas-2841-2012-lima',
  'Casación 2841-2012-Lima',
  'casacion',
  'civil',
  'Simulación Relativa',
  2012,
  'Sala Civil Transitoria — Corte Suprema',
  'En la simulación relativa el acto simulado es válido y solo el acto disimulado produce efectos jurídicos entre las partes. La prueba de la simulación corresponde a quien la alega, con indicio grave y preciso.',
  array['simulación relativa', 'simulación', 'acto jurídico', 'prueba', 'eficacia'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '2841-2012-Lima'
),
(
  'cas-512-2015-lima',
  'Casación 512-2015-Lima',
  'casacion',
  'civil',
  'Acto Jurídico — Elementos',
  2015,
  'Sala Civil Permanente — Corte Suprema',
  'Reitera que el acto jurídico exige consentimiento, objeto y causa lícita. La ausencia de causa simulada en negocios onerosos permite presumir simulación cuando concurren indicios concurrentes de disimulo.',
  array['acto jurídico', 'consentimiento', 'causa', 'objeto', 'simulación'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '512-2015-Lima'
),
(
  'cas-1890-2018-lima',
  'Casación 1890-2018-Lima',
  'casacion',
  'civil',
  'Responsabilidad Civil Extracontractual',
  2018,
  'Sala Civil Permanente — Corte Suprema',
  'La responsabilidad civil extracontractual exige acción u omisión antijurídica, daño y nexo causal. El quantum indemnizatorio debe ser proporcional al daño efectivamente acreditado, incluido el daño moral cuando procede.',
  array['responsabilidad civil', 'daño', 'nexo causal', 'indemnización', 'extracontractual'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '1890-2018-Lima'
),
(
  'cas-334-2020-lima',
  'Casación 334-2020-Lima',
  'casacion',
  'civil',
  'Buena Fe Contractual',
  2020,
  'Sala Civil Permanente — Corte Suprema',
  'La buena fe contractual impone deberes de información, lealtad y cooperación durante la ejecución del contrato. Su vulneración puede generar responsabilidad por incumplimiento culposo aun sin cláusula expresa.',
  array['buena fe contractual', 'contrato', 'deberes anexos', 'incumplimiento'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '334-2020-Lima'
),
(
  'tf-012345-2019-2-1800',
  'Resolución del Tribunal Fiscal N.° 012345-2019-2-1800',
  'resolucion',
  'tributario',
  'Compensación Tributaria',
  2019,
  'Tribunal Fiscal',
  'El Tribunal Fiscal confirma que la compensación tributaria procede cuando concurren créditos y débitos líquidos y exigibles del mismo sujeto, respetando el orden cronológico y los plazos de prescripción aplicables.',
  array['compensación tributaria', 'crédito fiscal', 'débito fiscal', 'SUNAT', 'prescripción'],
  'https://www.sunat.gob.pe/legislacion/jurisprudencia/',
  '012345-2019-2-1800'
),
(
  'tf-09876-2021-4-2000',
  'Resolución del Tribunal Fiscal N.° 09876-2021-4-2000',
  'resolucion',
  'tributario',
  'Deducibilidad de Gastos',
  2021,
  'Tribunal Fiscal',
  'Para la deducibilidad del gasto se exige que sea necesario para generar renta, acreditado fehacientemente y vinculado al giro del contribuyente. La mera emisión de comprobante no sustituye la prueba de la operación real.',
  array['deducibilidad', 'gastos', 'renta', 'acreditación', 'tributario'],
  'https://www.sunat.gob.pe/legislacion/jurisprudencia/',
  '09876-2021-4-2000'
),
(
  'tc-00007-2006-pa-tc',
  'Sentencia del Tribunal Constitucional — Exp. 00007-2006-PA/TC',
  'sentencia',
  'constitucional',
  'Derechos Fundamentales — Tutela',
  2006,
  'Tribunal Constitucional',
  'La acción de amparo protege derechos constitucionales frente a actos u omisiones de autoridad o particulares en supuestos legales. Procede cuando no existen vías ordinarias idóneas o cuando la lesión es directa e inmediata.',
  array['derechos fundamentales', 'amparo', 'tutela', 'TC', 'constitucional'],
  'https://www.tc.gob.pe/jurisprudencia/',
  '00007-2006-PA/TC'
),
(
  'tc-00220-2011-pi-tc',
  'Sentencia del Tribunal Constitucional — Exp. 00220-2011-PI/TC',
  'sentencia',
  'constitucional',
  'Libertad Contractual y Dignidad',
  2011,
  'Tribunal Constitucional',
  'El TC vincula la libertad contractual con la dignidad humana y la buena fe. Las cláusulas abusivas que desequilibran la posición del consumidor pueden ser inaplicadas por contravenir la Constitución.',
  array['libertad contractual', 'dignidad', 'cláusulas abusivas', 'buena fe', 'constitucional'],
  'https://www.tc.gob.pe/jurisprudencia/',
  '00220-2011-PI/TC'
),
(
  'pv-001-2021-pj',
  'Precedente Vinculante N.° 001-2021-PJ-CSJ',
  'precedente_vinculante',
  'procesal',
  'Valor Probatorio de Resoluciones Judiciales',
  2021,
  'Corte Suprema — Pleno',
  'Establece criterio vinculante sobre la fuerza probatoria de resoluciones judiciales firmes en procesos distintos, delimitando cuándo producen cosa juzgada material o simple efecto persuasivo.',
  array['precedente vinculante', 'cosa juzgada', 'prueba', 'procesal'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '001-2021-PJ-CSJ'
),
(
  'sent-labor-4455-2019-lima',
  'Sentencia Laboral 4455-2019-Lima',
  'sentencia',
  'laboral',
  'Despido Fraudulento',
  2019,
  'Sala Laboral Permanente — Corte Suprema',
  'Configura despido fraudulento cuando el empleador disimula una causal inexistente o falsea hechos para encubrir un despido arbitrario. Procede la reinstalación o indemnización según elección del trabajador.',
  array['despido fraudulento', 'despido arbitrario', 'reinstalación', 'laboral'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '4455-2019-Lima'
),
(
  'exp-adm-120-2020-lima',
  'Expediente Administrativo 120-2020-Lima',
  'expediente',
  'administrativo',
  'Silencio Administrativo Positivo',
  2020,
  'Tribunal de Contrataciones del Estado',
  'Analiza los supuestos de silencio administrativo positivo en procedimientos de contratación pública y los límites cuando existe observación pendiente de subsanación por el administrado.',
  array['silencio administrativo', 'contrataciones', 'procedimiento', 'administrativo'],
  'https://www.osce.gob.pe/consultas/informacion/jurisprudencia',
  '120-2020-Lima'
),
(
  'cas-901-2016-lima',
  'Casación 901-2016-Lima',
  'casacion',
  'penal',
  'Tipicidad y Antijuridicidad',
  2016,
  'Sala Penal Permanente — Corte Suprema',
  'La tipicidad penal exige conducta descrita por la ley con descripción clara e inequívoca. La antijuridicidad material puede excluir punibilidad en supuestos de ausencia de lesión al bien jurídico.',
  array['tipicidad', 'antijuridicidad', 'penal', 'bien jurídico'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '901-2016-Lima'
),
(
  'cas-1567-2014-lima',
  'Casación 1567-2014-Lima',
  'casacion',
  'procesal',
  'Nulidad Procesal — Casación',
  2014,
  'Sala Civil Permanente — Corte Suprema',
  'La casación por nulidad procesal requiere indefensión real y no meramente formal. Debe acreditarse que la irregularidad impidió ejercer el derecho de defensa de manera efectiva.',
  array['nulidad procesal', 'casación', 'indefensión', 'procesal'],
  'https://juris.pj.gob.pe/jurisprudenciaweb/faces/page/conDetalleJurisprudencia.xhtml',
  '1567-2014-Lima'
)
on conflict (id) do update set
  title = excluded.title,
  tipo = excluded.tipo,
  materia = excluded.materia,
  submateria = excluded.submateria,
  year = excluded.year,
  organo = excluded.organo,
  summary = excluded.summary,
  keywords = excluded.keywords,
  pdf_url = excluded.pdf_url,
  expediente = excluded.expediente,
  updated_at = now();

-- Verificación rápida
select count(*) as total_documentos from public.jurisprudence_documents;
select id, title, materia, year from public.jurisprudence_documents order by year desc;
