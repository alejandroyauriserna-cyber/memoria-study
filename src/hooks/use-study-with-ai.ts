"use client";

import { useCallback, useEffect, useState } from "react";

const STUDY_AI_STAGES = [
  {
    label: "Analizando PDF...",
    percent: 12,
    message: "Descargando y leyendo el contenido del documento.",
  },
  {
    label: "Extrayendo conceptos...",
    percent: 32,
    message: "Identificando ideas clave del material jurídico.",
  },
  {
    label: "Generando organizador...",
    percent: 55,
    message: "La IA estructura el contenido para tu estudio.",
  },
  {
    label: "Construyendo mapa conceptual...",
    percent: 78,
    message: "Preparando mapas, flashcards y preguntas de repaso.",
  },
  {
    label: "Guardando organizador...",
    percent: 92,
    message: "Finalizando y guardando en tu biblioteca.",
  },
] as const;

const STAGE_INTERVAL_MS = 4000;

export function useStudyWithAi(materialId: string | undefined) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isGenerating) {
      setStageIndex(0);
      setDisplayPercent(0);
      return;
    }

    setStageIndex(0);
    setDisplayPercent(STUDY_AI_STAGES[0].percent);

    const stageTimer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STUDY_AI_STAGES.length - 1));
    }, STAGE_INTERVAL_MS);

    const percentTimer = window.setInterval(() => {
      setDisplayPercent((current) => Math.min(current + 2, 94));
    }, 650);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(percentTimer);
    };
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    setDisplayPercent((current) => Math.max(current, STUDY_AI_STAGES[stageIndex].percent));
  }, [isGenerating, stageIndex]);

  const generate = useCallback(async () => {
    if (!materialId || isGenerating) return;

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`/api/organizers/create?materialId=${materialId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el organizador.");
      }

      setDisplayPercent(100);

      const organizerId = payload.organizer?.id;
      const redirectUrl = organizerId
        ? `/organizers?new=${encodeURIComponent(organizerId)}`
        : "/organizers?created=1";

      window.location.href = redirectUrl;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error creando el organizador.");
      setIsGenerating(false);
    }
  }, [isGenerating, materialId]);

  const stage = STUDY_AI_STAGES[stageIndex];

  return {
    isGenerating,
    stage,
    displayPercent,
    error,
    generate,
    setError,
  };
}
