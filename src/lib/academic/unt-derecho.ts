import type { UntDerechoCurriculum } from "@/types/academic";
import { buildWeeks } from "@/lib/academic/weeks";

const weeks = buildWeeks(16);

function course(id: string, name: string) {
  return { id, name, weeks };
}

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
            course("intro-derecho", "Introducción al Derecho"),
            course("metodologia", "Metodología de la Investigación Jurídica"),
            course("historia-peru", "Historia del Perú y Mundial"),
          ],
        },
        {
          number: 2,
          label: "Ciclo II",
          courses: [
            course("constitucional-1", "Derecho Constitucional I"),
            course("civil-1", "Derecho Civil I"),
            course("economia", "Economía Política"),
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
            course("constitucional-2", "Derecho Constitucional II"),
            course("civil-2", "Derecho Civil II"),
            course("penal-1", "Derecho Penal I"),
          ],
        },
        {
          number: 4,
          label: "Ciclo IV",
          courses: [
            course("procesal-civil-1", "Derecho Procesal Civil I"),
            course("penal-2", "Derecho Penal II"),
            course("filosofia-derecho", "Filosofía del Derecho"),
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
            course("procesal-civil-2", "Derecho Procesal Civil II"),
            course("procesal-penal-1", "Derecho Procesal Penal I"),
            course("laboral-1", "Derecho Laboral I"),
          ],
        },
        {
          number: 6,
          label: "Ciclo VI",
          courses: [
            course("administrativo-1", "Derecho Administrativo I"),
            course("comercial-1", "Derecho Comercial I"),
            course("internacional-publico", "Derecho Internacional Público"),
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
            course("procesal-penal-2", "Derecho Procesal Penal II"),
            course("laboral-2", "Derecho Laboral II"),
            course("tributario-1", "Derecho Tributario I"),
          ],
        },
        {
          number: 8,
          label: "Ciclo VIII",
          courses: [
            course("administrativo-2", "Derecho Administrativo II"),
            course("comercial-2", "Derecho Comercial II"),
            course("ambiental", "Derecho Ambiental"),
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
            course("litigacion-oral", "Litigación Oral"),
            course("arbitraje", "Arbitraje y Mediación"),
            course("derechos-humanos", "Derechos Humanos"),
          ],
        },
        {
          number: 10,
          label: "Ciclo X",
          courses: [
            course("practica-civil", "Práctica Pre Profesional Civil"),
            course("practica-penal", "Práctica Pre Profesional Penal"),
            course("seminario-tesis", "Seminario de Tesis"),
          ],
        },
      ],
    },
  ],
};
