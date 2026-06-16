"use client";

import type { MicroActivityType } from "@/types/micro-study";

export async function recordMicroActivity(
  activityType: MicroActivityType,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch("/api/micro-study/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType, metadata }),
    });
  } catch {
    /* offline — no bloquear UX */
  }
}
