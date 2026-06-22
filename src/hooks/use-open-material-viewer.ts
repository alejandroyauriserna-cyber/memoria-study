"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { materialViewerPath } from "@/lib/materials/material-viewer";

export function useOpenMaterialViewer() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const openMaterialViewer = useCallback(
    async (materialId: string) => {
      setOpening(true);

      try {
        const response = await fetch(`/api/materials/${materialId}/view`, {
          method: "POST",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo abrir el documento.");
        }

        router.push(materialViewerPath(materialId));
      } catch (error) {
        throw error instanceof Error ? error : new Error("No se pudo abrir el documento.");
      } finally {
        setOpening(false);
      }
    },
    [router],
  );

  return { openMaterialViewer, opening };
}
