"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCuadernoSync } from "@/components/cuaderno/use-cuaderno-sync";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { SmartCollectionSlug } from "@/lib/cuaderno/smart-collections";
import type { CuadernoCollectionsSnapshot } from "@/lib/cuaderno/collections-server";

type CuadernoSyncValue = {
  collections: CuadernoCollectionsSnapshot;
  ready: boolean;
  refresh: () => Promise<void>;
  countCollection: (slug: SmartCollectionSlug) => number;
  resolveCover: (courseId: string, fallback: CourseCoverArt) => CourseCoverArt;
  setCover: (courseId: string, art: CourseCoverArt) => void;
  isFavorite: (classId: string) => boolean;
};

const CuadernoSyncContext = createContext<CuadernoSyncValue | null>(null);

export function CuadernoSyncProvider({
  children,
  initialSnapshot,
}: {
  children: ReactNode;
  initialSnapshot?: CuadernoCollectionsSnapshot;
}) {
  const sync = useCuadernoSync(initialSnapshot);
  return <CuadernoSyncContext.Provider value={sync}>{children}</CuadernoSyncContext.Provider>;
}

export function useCuadernoSyncContext(): CuadernoSyncValue {
  const ctx = useContext(CuadernoSyncContext);
  if (!ctx) throw new Error("useCuadernoSyncContext requiere CuadernoSyncProvider");
  return ctx;
}

export function useCuadernoSyncContextOptional(): CuadernoSyncValue | null {
  return useContext(CuadernoSyncContext);
}
