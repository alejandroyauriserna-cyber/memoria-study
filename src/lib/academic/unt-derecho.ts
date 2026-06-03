import type { UntDerechoCurriculum } from "@/types/academic";
import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";
import { buildWeeks } from "@/lib/academic/weeks";

const weeks = buildWeeks(16);

function course(id: string, name: string) {
  return { id, name, weeks };
}

/** Agrupa 12 ciclos oficiales en 6 años (2 ciclos por año). */
const YEARS_FROM_MALLA = [
  { number: 1, label: "Primer año", cycles: [1, 2] },
  { number: 2, label: "Segundo año", cycles: [3, 4] },
  { number: 3, label: "Tercer año", cycles: [5, 6] },
  { number: 4, label: "Cuarto año", cycles: [7, 8] },
  { number: 5, label: "Quinto año", cycles: [9, 10] },
  { number: 6, label: "Sexto año", cycles: [11, 12] },
] as const;

/** Malla curricular oficial — Derecho UNT 2021 (12 ciclos). */
export const UNT_DERECHO: UntDerechoCurriculum = {
  university: "Universidad Nacional de Trujillo",
  career: "Derecho",
  years: YEARS_FROM_MALLA.map((year) => ({
    number: year.number,
    label: year.label,
    cycles: year.cycles.map((cycleNumber) => {
      const official = OFFICIAL_MALLA_2021.find((c) => c.number === cycleNumber)!;
      return {
        number: official.number,
        label: official.label,
        courses: official.courses.map((c) => course(c.id, c.name)),
      };
    }),
  })),
};

export { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";
