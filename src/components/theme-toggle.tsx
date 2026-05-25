"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("memoria-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved ? saved === "dark" : prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("memoria-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
