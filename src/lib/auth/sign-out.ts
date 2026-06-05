"use client";

import { createClient } from "@/lib/supabase/browser";

const SESSION_CACHE_KEYS = [
  "memoria-guided-legal-study:",
  "memoria-tutor-cache:",
  "memoria-profile-study-settings",
] as const;

function clearClientSessionCaches() {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (SESSION_CACHE_KEYS.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export async function signOutUser(redirectTo = "/auth") {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearClientSessionCaches();
  window.location.href = redirectTo;
}
