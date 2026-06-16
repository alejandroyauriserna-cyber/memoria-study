"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

const SESSION_KEY = "ms_mobile_micro_seen";

/** En móvil, abre micro-estudio una vez por sesión antes del inicio pro. */
export function MobilePwaMicroEntry() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    if (!isMobileViewport()) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    router.replace("/micro-estudio?entry=mobile");
  }, [pathname, router]);

  return null;
}

export function markMobileMicroEntrySeen() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, "1");
  }
}
