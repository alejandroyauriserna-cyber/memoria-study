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
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-3 top-3 z-10 rounded-lg p-1 text-muted-foreground transition hover:text-[#F5F7FA]"
        aria-label="Ocultar guía de inicio"
      >
        <X size={16} />
      </button>
      <ProfileOnboarding />
    </div>
  );
}
