import {
  normalizeAcademicForWrite,
  type AcademicCourseFields,
} from "@/lib/academic/normalize-academic";

export type CuadernoAcademicInput = AcademicCourseFields;

/** Alias de normalizeAcademicForWrite para el API de cuaderno. */
export function normalizeCuadernoAcademicInput(
  input: CuadernoAcademicInput,
): CuadernoAcademicInput | null {
  return normalizeAcademicForWrite(input);
}

export { isLegacyCourseId } from "@/lib/academic/normalize-academic";
