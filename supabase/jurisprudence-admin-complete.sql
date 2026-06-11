-- =============================================================================
-- MEMORIASTUDY · BIBLIOTECA JURÍDICA — ADMIN + REPORTES (pegar en Supabase)
-- =============================================================================
-- Requisito: haber ejecutado antes jurisprudence-library-complete.sql
--            (y opcionalmente jurisprudence-contributions-complete.sql)
--
-- Este script es idempotente: puedes ejecutarlo más de una vez sin romper nada.
-- =============================================================================

-- ─── 1) Columnas de aportes (si aún no existen) ─────────────────────────────
ALTER TABLE public.jurisprudence_documents
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.jurisprudence_documents
  ADD COLUMN IF NOT EXISTS file_name text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jurisprudence_documents'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.jurisprudence_documents
      ADD COLUMN status text NOT NULL DEFAULT 'published'
      CHECK (status IN ('published', 'pending', 'rejected'));
  END IF;
END $$;

-- ─── 2) Admin: motivo de rechazo ────────────────────────────────────────────
ALTER TABLE public.jurisprudence_documents
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS jurisprudence_documents_status_idx
  ON public.jurisprudence_documents (status);

CREATE INDEX IF NOT EXISTS jurisprudence_documents_submitted_by_idx
  ON public.jurisprudence_documents (submitted_by);

-- ─── 3) Tabla de reportes (estudiantes UNT denuncian contenido) ─────────────
CREATE TABLE IF NOT EXISTS public.jurisprudence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id text NOT NULL REFERENCES public.jurisprudence_documents (id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(trim(reason)) >= 10),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS jurisprudence_reports_status_idx
  ON public.jurisprudence_reports (status);

CREATE INDEX IF NOT EXISTS jurisprudence_reports_document_id_idx
  ON public.jurisprudence_reports (document_id);

ALTER TABLE public.jurisprudence_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users report jurisprudence documents" ON public.jurisprudence_reports;
CREATE POLICY "Users report jurisprudence documents"
ON public.jurisprudence_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users read own reports" ON public.jurisprudence_reports;
CREATE POLICY "Users read own reports"
ON public.jurisprudence_reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- ─── 4) Lectura pública: solo published ─────────────────────────────────────
DROP POLICY IF EXISTS "Public read jurisprudence documents" ON public.jurisprudence_documents;
DROP POLICY IF EXISTS "Public read published jurisprudence" ON public.jurisprudence_documents;

CREATE POLICY "Public read published jurisprudence"
ON public.jurisprudence_documents FOR SELECT
USING (
  (is_public = true AND status = 'published')
  OR (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
);

-- ─── 5) Aportes UNT: insertar solo pending (moderador aprueba) ──────────────
DROP POLICY IF EXISTS "Users submit jurisprudence" ON public.jurisprudence_documents;

CREATE POLICY "Users submit jurisprudence"
ON public.jurisprudence_documents FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND status = 'pending'
  AND is_public = false
);

-- ─── 6) Autor puede retirar su propio aporte ────────────────────────────────
DROP POLICY IF EXISTS "Authors delete own jurisprudence" ON public.jurisprudence_documents;

CREATE POLICY "Authors delete own jurisprudence"
ON public.jurisprudence_documents FOR DELETE
TO authenticated
USING (submitted_by = auth.uid());

-- ─── 7) Ocultar demo legacy (catálogo sin autor) ─────────────────────────────
UPDATE public.jurisprudence_documents
SET status = 'rejected', is_public = false
WHERE submitted_by IS NULL
  AND status = 'published';

-- ─── Verificación ───────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'jurisprudence_documents'
  AND column_name IN ('submitted_by', 'status', 'rejection_reason')
ORDER BY column_name;

SELECT
  count(*) FILTER (WHERE status = 'published') AS publicados,
  count(*) FILTER (WHERE status = 'pending') AS pendientes,
  count(*) FILTER (WHERE status = 'rejected') AS rechazados
FROM public.jurisprudence_documents;

SELECT count(*) AS reportes_abiertos
FROM public.jurisprudence_reports
WHERE status = 'open';
