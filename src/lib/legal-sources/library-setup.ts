import { getEnabledSources, getManageableSources } from "@/lib/legal-sources/storage";
import type { LegalSourcesSettings } from "@/types/legal-sources";

export type LibrarySetupStep = {
  id: string;
  label: string;
  done: boolean;
};

export function getLibrarySetupStatus(settings: LegalSourcesSettings | null) {
  if (!settings) {
    return {
      needsSetup: true,
      hasEnabled: false,
      steps: [] as LibrarySetupStep[],
    };
  }

  const manageable = getManageableSources(settings);
  const enabled = getEnabledSources(settings);
  const hasLpNormative = manageable.some(
    (s) => s.kind === "url" && s.lpPresetId && (s.articleCount ?? 0) > 0,
  );
  const hasJurisOrDoctrine = manageable.some(
    (s) =>
      (s.category === "jurisprudencia" || s.category === "doctrina") &&
      Boolean(s.extractedText?.trim() || s.lastSyncedAt),
  );
  const hasMaterial = manageable.some((s) => s.category === "material_universitario");

  const steps: LibrarySetupStep[] = [
    {
      id: "normativa",
      label: "Sincronizar normativa desde LP Derecho (ej. Código Civil)",
      done: hasLpNormative,
    },
    {
      id: "jurisprudencia",
      label: "Agregar jurisprudencia o doctrina (PDF o URL)",
      done: hasJurisOrDoctrine,
    },
    {
      id: "activar",
      label: "Activar al menos una fuente para el tutor",
      done: enabled.length > 0,
    },
  ];

  if (settings.studyCategories?.includes("material_universitario")) {
    steps.splice(2, 0, {
      id: "material",
      label: "Vincular material del curso (opcional)",
      done: hasMaterial,
    });
  }

  const needsSetup = !hasLpNormative || enabled.length === 0;

  return {
    needsSetup,
    hasEnabled: enabled.length > 0,
    steps,
  };
}
