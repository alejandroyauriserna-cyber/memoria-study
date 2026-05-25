"use client";

import { useEffect } from "react";
import { loadAcademicSelection, saveAcademicSelection } from "@/lib/academic/storage";
import type { AcademicSelection } from "@/types/academic";

export function ProfileSync({
  onLoaded,
}: {
  onLoaded?: (academic: AcademicSelection) => void;
}) {
  useEffect(() => {
    async function sync() {
      const local = loadAcademicSelection();

      try {
        const response = await fetch("/api/profile");
        const payload = await response.json();

        if (payload.academic) {
          saveAcademicSelection(payload.academic);
          onLoaded?.(payload.academic);
          return;
        }

        if (local) {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ academic: local }),
          });
          onLoaded?.(local);
        }
      } catch {
        if (local) {
          onLoaded?.(local);
        }
      }
    }

    void sync();
  }, [onLoaded]);

  return null;
}
