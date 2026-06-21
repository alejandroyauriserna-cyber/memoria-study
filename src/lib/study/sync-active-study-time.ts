"use client";

import { ensureActiveStudyTimeReset } from "@/lib/study/active-study-time-reset";
import { sumClientActiveStudyMilliseconds } from "@/lib/study/client-active-study-total";

export async function syncActiveStudyTimeToServer() {
  if (typeof window === "undefined") return;

  ensureActiveStudyTimeReset();

  const activeStudyMs = sumClientActiveStudyMilliseconds();
  if (activeStudyMs <= 0) return;

  try {
    await fetch("/api/profile/active-study-time", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ activeStudyMs }),
    });
  } catch {
    /* offline — se reintentará */
  }
}
