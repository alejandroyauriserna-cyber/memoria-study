"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACADEMIC_TRUST_CHANGE_EVENT,
  hasAcademicSourcesActivated,
  shouldShowAcademicTrustBanner,
} from "@/lib/legal-sources/academic-trust";
import { loadLegalSourcesSettings } from "@/lib/legal-sources/storage";
import { AcademicTrustBanner } from "@/components/academic-trust/academic-trust-banner";
import { AcademicTrustSourcesBadge } from "@/components/academic-trust/academic-trust-sources-badge";

export function AcademicTrustExperience({ variant }: { variant: "home" | "header" }) {
  const [showBanner, setShowBanner] = useState(false);
  const [sourcesActive, setSourcesActive] = useState(false);

  const refresh = useCallback(() => {
    const settings = loadLegalSourcesSettings();
    setSourcesActive(hasAcademicSourcesActivated(settings));
    setShowBanner(shouldShowAcademicTrustBanner(settings));
  }, []);

  useEffect(() => {
    refresh();

    function onChange() {
      refresh();
    }

    window.addEventListener(ACADEMIC_TRUST_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ACADEMIC_TRUST_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  if (variant === "header") {
    if (!sourcesActive) return null;
    return <AcademicTrustSourcesBadge compact />;
  }

  if (showBanner) {
    return <AcademicTrustBanner onChange={refresh} />;
  }

  if (sourcesActive) {
    return (
      <div className="mb-4 flex justify-start">
        <AcademicTrustSourcesBadge />
      </div>
    );
  }

  return null;
}
