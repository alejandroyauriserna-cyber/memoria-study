import type { LegalSourceCategory } from "@/types/legal-sources";

export type CourseSourcePreset = {
  id: string;
  label: string;
  description: string;
  studyCategories: LegalSourceCategory[];
};

export const COURSE_SOURCE_PRESETS: CourseSourcePreset[] = [
  {
    id: "civil-1",
    label: "Derecho Civil I",
    description: "Normativa LP, doctrina y separatas del curso.",
    studyCategories: ["normativa", "doctrina", "material_universitario"],
  },
  {
    id: "civil-2",
    label: "Derecho Civil II",
    description: "Contratos, obligaciones y material de cátedra.",
    studyCategories: ["normativa", "doctrina", "material_universitario"],
  },
  {
    id: "procesal-civil",
    label: "Procesal Civil",
    description: "CPC, jurisprudencia de casación y apuntes.",
    studyCategories: ["normativa", "jurisprudencia", "material_universitario"],
  },
  {
    id: "procesal-penal",
    label: "Procesal Penal",
    description: "CPP, jurisprudencia y material universitario.",
    studyCategories: ["normativa", "jurisprudencia", "material_universitario"],
  },
  {
    id: "constitucional",
    label: "Derecho Constitucional",
    description: "Constitución, TC y doctrina constitucional.",
    studyCategories: ["normativa", "jurisprudencia", "doctrina"],
  },
  {
    id: "tributario",
    label: "Derecho Tributario",
    description: "Normativa, Tribunal Fiscal y doctrina.",
    studyCategories: ["normativa", "jurisprudencia", "doctrina"],
  },
];

export function getCoursePreset(id: string): CourseSourcePreset | undefined {
  return COURSE_SOURCE_PRESETS.find((p) => p.id === id);
}
