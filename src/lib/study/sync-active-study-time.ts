"use client";

import { ensureActiveStudyTimeReset } from "@/lib/study/active-study-time-reset";
import { sumClientActiveStudyMilliseconds } from "@/lib/study/client-active-study-total";

let lastSyncedActiveStudyMs = -1;
let syncInFlight: Promise<void> | null = null;

export async function syncActiveStudyTimeToServer() {
  if (typeof window === "undefined") return;

  ensureActiveStudyTimeReset();

  const activeStudyMs = sumClientActiveStudyMilliseconds();
  if (activeStudyMs <= 0) return;
  if (activeStudyMs === lastSyncedActiveStudyMs) return;

  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    try {
      const response = await fetch("/api/profile/active-study-time", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ activeStudyMs }),
      });
      if (response.ok) {
        lastSyncedActiveStudyMs = activeStudyMs;
      }
    } catch {
      /* offline — se reintentará */
    } finally {
      syncInFlight = null;
    }
  })();

  await syncInFlight;
}
