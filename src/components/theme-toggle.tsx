"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  APP_THEME_CHANGE_EVENT,
  applyDarkMode,
  readDarkModePreference,
} from "@/lib/theme/app-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(readDarkModePreference());

    function onThemeChange() {
      setDark(readDarkModePreference());
    }

    window.addEventListener(APP_THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(APP_THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    applyDarkMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={dark ? "Modo claro" : "Modo oscuro"}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
