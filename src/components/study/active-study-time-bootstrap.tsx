"use client";

import { useEffect } from "react";
import { ensureActiveStudyTimeReset } from "@/lib/study/active-study-time-reset";
import { ACTIVE_STUDY_SERVER_SYNC_INTERVAL_MS } from "@/lib/study/active-study-time-sync";
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
    }, ACTIVE_STUDY_SERVER_SYNC_INTERVAL_MS);

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
