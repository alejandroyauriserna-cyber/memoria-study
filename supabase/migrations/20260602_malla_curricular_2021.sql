-- Migración: alinear materiales, organizadores y cuaderno a malla UNT 2021 (12 ciclos)

-- Materiales: IDs y ciclos legacy
UPDATE public.materials SET course_id = 'desarrollo-personal-social', course_name = 'Desarrollo Personal y Social', cycle_number = 1, cycle_label = 'Ciclo I' WHERE course_id = 'desarrollo-personal';
UPDATE public.materials SET course_id = 'desarrollo-pensamiento-matematico', course_name = 'Desarrollo del Pensamiento Matemático', cycle_number = 1, cycle_label = 'Ciclo I' WHERE course_id = 'pensamiento-logico-matematico';
UPDATE public.materials SET course_id = 'lectura-produccion-textos-academicos', course_name = 'Lectura y Producción de Textos Académicos', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id = 'lectura-critica-redaccion';
UPDATE public.materials SET course_id = 'analisis-critico-realidad', course_name = 'Análisis Crítico de la Realidad', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id IN ('antropologia-general', 'sociedad-cultura-ecologia');
UPDATE public.materials SET course_id = 'introduccion-investigacion-cientifica', course_name = 'Introducción a la Investigación Científica', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id IN ('metodologia-investigacion-cientifica', 'cultura-investigativa');
UPDATE public.materials SET course_id = 'etica-profesional', course_name = 'Ética Profesional', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'etica-convivencia-ciudadania';
UPDATE public.materials SET course_id = 'historia-general-derecho', course_name = 'Historia General del Derecho', cycle_number = 1, cycle_label = 'Ciclo I' WHERE course_id IN ('historia-derecho-peru-latam', 'derecho-romano');
UPDATE public.materials SET course_id = 'constitucional-i', course_name = 'Derecho Constitucional I', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id = 'constitucional-i' AND cycle_number > 2;
UPDATE public.materials SET course_id = 'civil-i-personas', course_name = 'Derecho Civil I: Principios Generales y Derecho de Personas', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id = 'civil-i-personas' AND cycle_number > 2;
UPDATE public.materials SET course_id = 'filosofia-derecho', course_name = 'Filosofía del Derecho', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id = 'filosofia-derecho' AND cycle_number > 2;
UPDATE public.materials SET course_id = 'civil-ii-acto-juridico', course_name = 'Derecho Civil II: Acto Jurídico', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'civil-ii-acto-juridico';
UPDATE public.materials SET course_id = 'constitucional-ii', course_name = 'Derecho Constitucional II', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'constitucional-ii' AND cycle_number = 4;
UPDATE public.materials SET course_id = 'teoria-juridica-delito-i', course_name = 'Teoría Jurídica del Delito I', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'penal-general-i';
UPDATE public.materials SET course_id = 'civil-iii-derechos-reales', course_name = 'Derecho Civil III: Derechos Reales', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id = 'civil-iii-reales';
UPDATE public.materials SET course_id = 'teoria-juridica-delito-ii', course_name = 'Teoría Jurídica del Delito II', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id IN ('penal-general-ii', 'medicina-legal');
UPDATE public.materials SET course_id = 'procesal-civil-i', course_name = 'Derecho Procesal Civil I', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id = 'teoria-general-proceso';
UPDATE public.materials SET course_id = 'identidad-cultural-regional-nacional', course_name = 'Identidad Cultural Regional y Nacional', cycle_number = 5, cycle_label = 'Ciclo V' WHERE course_id = 'identidad-cultural';
UPDATE public.materials SET course_id = 'derecho-trabajo-i', course_name = 'Derecho del Trabajo I', cycle_number = 7, cycle_label = 'Ciclo VII' WHERE course_id = 'trabajo-i';
UPDATE public.materials SET course_id = 'derecho-trabajo-ii', course_name = 'Derecho del Trabajo II', cycle_number = 8, cycle_label = 'Ciclo VIII' WHERE course_id = 'trabajo-ii';
UPDATE public.materials SET course_id = 'derecho-societario', course_name = 'Derecho Societario', cycle_number = 9, cycle_label = 'Ciclo IX' WHERE course_id IN ('empresarial-i-societario', 'empresarial-iii-concursal');
UPDATE public.materials SET course_id = 'titulos-valores', course_name = 'Títulos Valores', cycle_number = 10, cycle_label = 'Ciclo X' WHERE course_id = 'empresarial-ii-titulos-valores';
UPDATE public.materials SET course_id = 'practica-dirigida-ix', course_name = 'Práctica Dirigida', cycle_number = 9, cycle_label = 'Ciclo IX' WHERE course_id = 'practica-dirigida-i';
UPDATE public.materials SET course_id = 'practica-dirigida-x', course_name = 'Práctica Dirigida', cycle_number = 10, cycle_label = 'Ciclo X' WHERE course_id = 'practica-dirigida-ii';
UPDATE public.materials SET course_id = 'teoria-general-derechos-humanos', course_name = 'Teoría General de los Derechos Humanos', cycle_number = 11, cycle_label = 'Ciclo XI' WHERE course_id = 'derechos-humanos';
UPDATE public.materials SET course_id = 'derecho-economico-analisis', course_name = 'Derecho Económico y Análisis Económico del Derecho', cycle_number = 12, cycle_label = 'Ciclo XII' WHERE course_id = 'derecho-economico';

-- Organizadores
UPDATE public.organizers SET course_id = 'desarrollo-personal-social', course_name = 'Desarrollo Personal y Social', cycle_number = 1, cycle_label = 'Ciclo I' WHERE course_id = 'desarrollo-personal';
UPDATE public.organizers SET course_id = 'desarrollo-pensamiento-matematico', course_name = 'Desarrollo del Pensamiento Matemático', cycle_number = 1, cycle_label = 'Ciclo I' WHERE course_id = 'pensamiento-logico-matematico';
UPDATE public.organizers SET course_id = 'lectura-produccion-textos-academicos', course_name = 'Lectura y Producción de Textos Académicos', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id = 'lectura-critica-redaccion';
UPDATE public.organizers SET course_id = 'analisis-critico-realidad', course_name = 'Análisis Crítico de la Realidad', cycle_number = 2, cycle_label = 'Ciclo II' WHERE course_id IN ('antropologia-general', 'sociedad-cultura-ecologia');
UPDATE public.organizers SET course_id = 'introduccion-investigacion-cientifica', course_name = 'Introducción a la Investigación Científica', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id IN ('metodologia-investigacion-cientifica', 'cultura-investigativa');
UPDATE public.organizers SET course_id = 'civil-ii-acto-juridico', course_name = 'Derecho Civil II: Acto Jurídico', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'civil-ii-acto-juridico';
UPDATE public.organizers SET course_id = 'constitucional-ii', course_name = 'Derecho Constitucional II', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'constitucional-ii' AND cycle_number = 4;
UPDATE public.organizers SET course_id = 'teoria-juridica-delito-i', course_name = 'Teoría Jurídica del Delito I', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'penal-general-i';
UPDATE public.organizers SET course_id = 'civil-iii-derechos-reales', course_name = 'Derecho Civil III: Derechos Reales', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id = 'civil-iii-reales';
UPDATE public.organizers SET course_id = 'teoria-juridica-delito-ii', course_name = 'Teoría Jurídica del Delito II', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id IN ('penal-general-ii', 'medicina-legal');
UPDATE public.organizers SET course_id = 'procesal-civil-i', course_name = 'Derecho Procesal Civil I', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id = 'teoria-general-proceso';
UPDATE public.organizers SET course_id = 'derecho-trabajo-i', course_name = 'Derecho del Trabajo I', cycle_number = 7, cycle_label = 'Ciclo VII' WHERE course_id = 'trabajo-i';
UPDATE public.organizers SET course_id = 'derecho-trabajo-ii', course_name = 'Derecho del Trabajo II', cycle_number = 8, cycle_label = 'Ciclo VIII' WHERE course_id = 'trabajo-ii';
UPDATE public.organizers SET course_id = 'derecho-societario', course_name = 'Derecho Societario', cycle_number = 9, cycle_label = 'Ciclo IX' WHERE course_id IN ('empresarial-i-societario', 'empresarial-iii-concursal');
UPDATE public.organizers SET course_id = 'titulos-valores', course_name = 'Títulos Valores', cycle_number = 10, cycle_label = 'Ciclo X' WHERE course_id = 'empresarial-ii-titulos-valores';
UPDATE public.organizers SET course_id = 'teoria-general-derechos-humanos', course_name = 'Teoría General de los Derechos Humanos', cycle_number = 11, cycle_label = 'Ciclo XI' WHERE course_id = 'derechos-humanos';
UPDATE public.organizers SET course_id = 'derecho-economico-analisis', course_name = 'Derecho Económico y Análisis Económico del Derecho', cycle_number = 12, cycle_label = 'Ciclo XII' WHERE course_id = 'derecho-economico';

-- Cuaderno IA
UPDATE public.cuaderno_classes SET course_id = 'civil-ii-acto-juridico', course_name = 'Derecho Civil II: Acto Jurídico', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'civil-ii-acto-juridico' AND cycle_number = 4;
UPDATE public.cuaderno_classes SET course_id = 'civil-iii-derechos-reales', course_name = 'Derecho Civil III: Derechos Reales', cycle_number = 4, cycle_label = 'Ciclo IV' WHERE course_id = 'civil-iii-reales';
UPDATE public.cuaderno_classes SET course_id = 'teoria-juridica-delito-i', course_name = 'Teoría Jurídica del Delito I', cycle_number = 3, cycle_label = 'Ciclo III' WHERE course_id = 'penal-general-i';
UPDATE public.cuaderno_classes SET course_id = 'derecho-trabajo-i', course_name = 'Derecho del Trabajo I', cycle_number = 7, cycle_label = 'Ciclo VII' WHERE course_id = 'trabajo-i';
UPDATE public.cuaderno_classes SET course_id = 'derecho-trabajo-ii', course_name = 'Derecho del Trabajo II', cycle_number = 8, cycle_label = 'Ciclo VIII' WHERE course_id = 'trabajo-ii';

-- Perfiles: academic_context JSON (si existe ciclo/course legacy)
-- Los perfiles se corrigen en runtime vía sanitizeAcademicSelection al cargar.
