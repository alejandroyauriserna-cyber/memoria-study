"use client";

import { useEffect } from "react";
import { initializeAppTheme } from "@/lib/theme/app-theme";

export function AppThemeProvider() {
  useEffect(() => {
    initializeAppTheme();
  }, []);

  return null;
}
