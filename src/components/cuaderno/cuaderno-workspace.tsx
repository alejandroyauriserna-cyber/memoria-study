"use client";

import { CuadernoSyncProvider } from "@/components/cuaderno/cuaderno-sync-context";
import { CuadernoUnifiedLibrary } from "@/components/cuaderno/cuaderno-unified-library";
import type { CuadernoClass, CuadernoClassAccess } from "@/types/cuaderno";
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";

export function CuadernoWorkspace({
  initialClasses,
  initialSharedWithMe = [],
  profileName = "Estudiante",
  studyHoursLabel = "—",
}: {
  initialClasses: CuadernoClass[];
  initialSharedWithMe?: CuadernoClassAccess[];
  profileName?: string;
  studyHoursLabel?: string;
}) {
  return (
    <CuadernoSyncProvider>
      <CuadernoUnifiedLibrary
        initialClasses={initialClasses}
        initialSharedWithMe={initialSharedWithMe}
        profileName={profileName}
        studyHoursLabel={studyHoursLabel}
      />
    </CuadernoSyncProvider>
  );
}
