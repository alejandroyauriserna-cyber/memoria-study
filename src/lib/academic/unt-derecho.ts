import type { UntDerechoCurriculum } from "@/types/academic";
import { buildWeeks } from "@/lib/academic/weeks";

const weeks = buildWeeks(16);

function course(id: string, name: string) {
  return { id, name, weeks };
}

/** Malla curricular oficial — Derecho UNT (10 ciclos). */
export const UNT_DERECHO: UntDerechoCurriculum = {
  university: "Universidad Nacional de Trujillo",
  career: "Derecho",
  years: [
    {
      number: 1,
      label: "Primer año",
      cycles: [
        {
          number: 1,
          label: "Ciclo I",
          courses: [
            course("desarrollo-personal", "Desarrollo Personal"),
            course("pensamiento-logico-matematico", "Desarrollo del Pensamiento Lógico Matemático"),
            course("gestion-aprendizajes", "Gestión de los Aprendizajes"),
            course("lectura-critica-redaccion", "Lectura Crítica y Redacción de Textos Académicos"),
            course("antropologia-general", "Antropología General"),
            course("metodologia-investigacion-cientifica", "Metodología de la Investigación Científica"),
          ],
        },
        {
          number: 2,
          label: "Ciclo II",
          courses: [
            course("sociedad-cultura-ecologia", "Sociedad, Cultura y Ecología"),
            course("cultura-investigativa", "Cultura Investigativa y Pensamiento Crítico"),
            course("etica-convivencia-ciudadania", "Ética, Convivencia Humana y Ciudadanía"),
            course("identidad-cultural", "Identidad Cultural Regional, Nacional e Internacional"),
            course("fundamentos-filosofia", "Fundamentos de Filosofía"),
            course("introduccion-ciencias-juridicas", "Introducción a las Ciencias Jurídicas"),
          ],
        },
      ],
    },
    {
      number: 2,
      label: "Segundo año",
      cycles: [
        {
          number: 3,
          label: "Ciclo III",
          courses: [
            course("constitucional-i", "Derecho Constitucional I"),
            course("historia-derecho-peru-latam", "Historia General del Derecho Peruano y Latinoamericano"),
            course("derechos-humanos", "Derechos Humanos"),
            course("derecho-romano", "Derecho Romano"),
            course("civil-i-personas", "Derecho Civil I: Principios Generales y Derecho de Personas"),
            course("filosofia-derecho", "Filosofía del Derecho"),
            course("metodologia-investigacion-juridica-i", "Metodología de Investigación Jurídica I"),
          ],
        },
        {
          number: 4,
          label: "Ciclo IV",
          courses: [
            course("civil-ii-acto-juridico", "Derecho Civil II: Acto Jurídico"),
            course("constitucional-ii", "Derecho Constitucional II"),
            course("penal-general-i", "Derecho Penal General I"),
            course("teoria-general-proceso", "Teoría General del Proceso"),
            course("trabajo-i", "Derecho del Trabajo I"),
            course("metodologia-investigacion-juridica-ii", "Metodología de Investigación Jurídica II"),
            course("administrativo-i", "Derecho Administrativo I"),
          ],
        },
      ],
    },
    {
      number: 3,
      label: "Tercer año",
      cycles: [
        {
          number: 5,
          label: "Ciclo V",
          courses: [
            course("civil-iii-reales", "Derecho Civil III: Reales"),
            course("internacional-publico", "Derecho Internacional Público"),
            course("penal-general-ii", "Derecho Penal General II"),
            course("administrativo-ii", "Derecho Administrativo II"),
            course("empresarial-i-societario", "Derecho Empresarial I: Derecho Societario"),
            course("trabajo-ii", "Derecho del Trabajo II"),
          ],
        },
        {
          number: 6,
          label: "Ciclo VI",
          courses: [
            course("civil-iv-obligaciones", "Derecho Civil IV: Obligaciones"),
            course("internacional-privado", "Derecho Internacional Privado"),
            course("penal-especial-i", "Derecho Penal Especial I"),
            course("contencioso-administrativo", "Contencioso Administrativo"),
            course("empresarial-ii-titulos-valores", "Derecho Empresarial II: Títulos Valores"),
            course("medicina-legal", "Medicina Legal"),
          ],
        },
      ],
    },
    {
      number: 4,
      label: "Cuarto año",
      cycles: [
        {
          number: 7,
          label: "Ciclo VII",
          courses: [
            course("civil-v-contratos", "Derecho Civil V: Contratos"),
            course("procesal-civil-i", "Derecho Procesal Civil I"),
            course("penal-especial-ii", "Derecho Penal Especial II"),
            course("procesal-penal-i", "Derecho Procesal Penal I"),
            course("argumentacion-juridica", "Argumentación Jurídica"),
            course("marcs", "Medios Alternativos de Resolución de Conflictos (MARCS)"),
          ],
        },
        {
          number: 8,
          label: "Ciclo VIII",
          courses: [
            course("civil-vi-familia", "Derecho Civil VI: Familia"),
            course("procesal-civil-ii", "Derecho Procesal Civil II"),
            course("procesal-penal-ii", "Derecho Procesal Penal II"),
            course("penal-especial-iii", "Derecho Penal Especial III"),
            course("empresarial-iii-concursal", "Derecho Empresarial III: Derecho Concursal"),
            course("procesal-trabajo", "Derecho Procesal del Trabajo"),
          ],
        },
      ],
    },
    {
      number: 5,
      label: "Quinto año",
      cycles: [
        {
          number: 9,
          label: "Ciclo IX",
          courses: [
            course("civil-vii-sucesiones", "Derecho Civil VII: Sucesiones"),
            course("procesal-penal-iii", "Derecho Procesal Penal III"),
            course("proyecto-tesis", "Proyecto de Tesis"),
            course("notarial-registral", "Derecho Notarial y Registral"),
            course("tributario-i", "Derecho Tributario I"),
            course("practica-dirigida-i", "Práctica Dirigida"),
          ],
        },
        {
          number: 10,
          label: "Ciclo X",
          courses: [
            course("procesal-constitucional", "Derecho Procesal Constitucional"),
            course("derecho-economico", "Derecho Económico"),
            course("tributario-ii", "Derecho Tributario II"),
            course("contrataciones-estado", "Contrataciones del Estado"),
            course("derecho-integracion", "Derecho de Integración"),
            course("practica-dirigida-ii", "Práctica Dirigida"),
          ],
        },
      ],
    },
  ],
};
