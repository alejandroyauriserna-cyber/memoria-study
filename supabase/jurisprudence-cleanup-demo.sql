-- =============================================================================
-- MEMORIASTUDY · Limpieza catálogo demo + enlaces rotos
-- Pegar en Supabase SQL Editor y ejecutar Run.
-- =============================================================================

-- 1) Catálogo curado inicial (sin autor estudiante)
DELETE FROM public.jurisprudence_favorites
WHERE document_id IN (
  SELECT id FROM public.jurisprudence_documents WHERE submitted_by IS NULL
);

DELETE FROM public.jurisprudence_documents
WHERE submitted_by IS NULL;

-- 2) Enlaces genéricos que no apuntan a un PDF concreto
DELETE FROM public.jurisprudence_favorites
WHERE document_id IN (
  SELECT id FROM public.jurisprudence_documents
  WHERE pdf_url LIKE '%conDetalleJurisprudencia.xhtml%'
     OR pdf_url LIKE '%sunat.gob.pe/legislacion/jurisprudencia%'
     OR pdf_url LIKE '%tc.gob.pe/jurisprudencia%'
     OR pdf_url LIKE '%osce.gob.pe/consultas/informacion/jurisprudencia%'
     OR pdf_url ~ '/jurisprudencia/?$'
);

DELETE FROM public.jurisprudence_documents
WHERE pdf_url LIKE '%conDetalleJurisprudencia.xhtml%'
   OR pdf_url LIKE '%sunat.gob.pe/legislacion/jurisprudencia%'
   OR pdf_url LIKE '%tc.gob.pe/jurisprudencia%'
   OR pdf_url LIKE '%osce.gob.pe/consultas/informacion/jurisprudencia%'
   OR pdf_url ~ '/jurisprudencia/?$';

SELECT count(*) AS documentos_restantes FROM public.jurisprudence_documents;
