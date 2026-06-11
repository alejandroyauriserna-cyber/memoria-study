-- =============================================================================
-- MEMORIASTUDY · Eliminar jurisprudencia demo (enlaces que no llevan al PDF)
-- Pegar en Supabase SQL Editor y ejecutar Run.
-- =============================================================================
-- Borra el catálogo curado inicial (submitted_by = null).
-- NO borra aportes de estudiantes (submitted_by con UUID).

DELETE FROM public.jurisprudence_favorites
WHERE document_id IN (
  SELECT id FROM public.jurisprudence_documents WHERE submitted_by IS NULL
);

DELETE FROM public.jurisprudence_documents
WHERE submitted_by IS NULL;

-- Opcional: borrar solo enlaces genéricos del Poder Judicial / portales
-- DELETE FROM public.jurisprudence_favorites
-- WHERE document_id IN (
--   SELECT id FROM public.jurisprudence_documents
--   WHERE pdf_url LIKE '%conDetalleJurisprudencia.xhtml'
--      OR pdf_url LIKE '%/jurisprudencia/$'
--      OR pdf_url LIKE '%/jurisprudencia'
-- );
--
-- DELETE FROM public.jurisprudence_documents
-- WHERE pdf_url LIKE '%conDetalleJurisprudencia.xhtml'
--    OR pdf_url LIKE '%/jurisprudencia/$'
--    OR pdf_url LIKE '%/jurisprudencia';

SELECT count(*) AS documentos_restantes FROM public.jurisprudence_documents;
