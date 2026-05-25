import type { AcademicSelection } from "@/types/academic";

const STORAGE_KEY = "memoria-unt-academic-selection";

export function loadAcademicSelection(): AcademicSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AcademicSelection;
  } catch {
    return null;
  }
}

export function saveAcademicSelection(selection: AcademicSelection) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}
