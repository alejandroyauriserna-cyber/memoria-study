"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/loading-state";

const GuidedLegalStudyWorkspace = dynamic(
  () =>
    import("@/components/guided-study/guided-legal-study-workspace").then(
      (module) => module.GuidedLegalStudyWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <LoadingState active preset="guidedStudyInit" variant="overlay" className="min-h-[24rem]" />
    ),
  },
);

export function GuidedStudyLoader({ materialId }: { materialId: string }) {
  return <GuidedLegalStudyWorkspace materialId={materialId} />;
}
