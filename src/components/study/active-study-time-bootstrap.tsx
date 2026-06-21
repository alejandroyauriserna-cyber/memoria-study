"use client";

import { useEffect } from "react";
import { ensureActiveStudyTimeReset } from "@/lib/study/active-study-time-reset";
import { syncActiveStudyTimeToServer } from "@/lib/study/sync-active-study-time";

export function ActiveStudyTimeBootstrap() {
  useEffect(() => {
    ensureActiveStudyTimeReset();
    void syncActiveStudyTimeToServer();

    const onVisibilityChange = () => {
      if (document.hidden) {
        void syncActiveStudyTimeToServer();
      }
    };

    const interval = window.setInterval(() => {
      void syncActiveStudyTimeToServer();
    }, 60_000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", syncActiveStudyTimeToServer);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", syncActiveStudyTimeToServer);
      window.clearInterval(interval);
      void syncActiveStudyTimeToServer();
    };
  }, []);

  return null;
}
