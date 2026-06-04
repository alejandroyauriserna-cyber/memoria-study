import type { LegalSourceCategory } from "@/types/legal-sources";

export type StudyCategoryOption = {
  id: LegalSourceCategory;
  label: string;
  description: string;
  recommendation: string;
};

export const STUDY_CATEGORY_OPTIONS: StudyCategoryOption[] = [
  {
    id: "normativa",
    label: "Normativa",
    description: "Códigos, Constitución, leyes",
    recommendation: "Sincroniza desde LP Derecho (URLs editables, varias partes).",
  },
  {
    id: "jurisprudencia",
    label: "Jurisprudencia",
    description: "Casaciones, TC, Tribunal Fiscal",
    recommendation: "Sube PDF o sincroniza URL de TC, PJ, SUNAT o LP.",
  },
  {
    id: "doctrina",
    label: "Doctrina",
    description: "Libros, artículos, revistas",
    recommendation: "Sube PDF o sincroniza URL de LP / SPIJ.",
  },
  {
    id: "material_universitario",
    label: "Material del curso",
    description: "Separatas, diapositivas, apuntes",
    recommendation: "Sube PDF o vincula material de tu biblioteca.",
  },
];

export const DEFAULT_STUDY_CATEGORIES: LegalSourceCategory[] = [
  "normativa",
  "jurisprudencia",
];

export function usesStudyCategory(
  settings: { studyCategories?: LegalSourceCategory[] },
  category: LegalSourceCategory,
): boolean {
  const list = settings.studyCategories?.length
    ? settings.studyCategories
    : DEFAULT_STUDY_CATEGORIES;
  return list.includes(category);
}
