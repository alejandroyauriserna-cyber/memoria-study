"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ProfileOnboarding } from "@/components/profile/profile-onboarding";

const DISMISS_KEY = "memoria-dashboard-onboarding-dismissed";

export function DashboardOnboarding({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  if (!show || dismissed) return null;

  return (
    <div className="ms-home-onboarding ms-home-onboarding--dismissible">
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="ms-home-onboarding__close"
        aria-label="Ocultar guía de inicio"
      >
        <X size={16} />
      </button>
      <ProfileOnboarding compact />
    </div>
  );
}
