-- Biblioteca Jurídica — aportes UNT + moderación (ejecutar tras contributions SQL)

-- Demo legacy → rechazado y oculto (por si aún existen filas)
UPDATE public.jurisprudence_documents
SET status = 'rejected', is_public = false
WHERE submitted_by IS NULL
  AND status = 'published';

-- Nuevos aportes: solo pending desde cliente (publicación vía moderador/API)
DROP POLICY IF EXISTS "Users submit jurisprudence" ON public.jurisprudence_documents;

CREATE POLICY "Users submit jurisprudence"
ON public.jurisprudence_documents FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND status = 'pending'
  AND is_public = false
);

-- Los autores UNT pueden retirar sus propios aportes (RLS; la app valida dominio UNT)
DROP POLICY IF EXISTS "Authors delete own jurisprudence" ON public.jurisprudence_documents;

CREATE POLICY "Authors delete own jurisprudence"
ON public.jurisprudence_documents FOR DELETE
TO authenticated
USING (submitted_by = auth.uid());
