"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyDarkMode, readDarkModePreference } from "@/lib/theme/app-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const preferred = readDarkModePreference();
    setDark(preferred);
    applyDarkMode(preferred);
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
