"use client";

import { Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  APP_THEME_CHANGE_EVENT,
  readProfileTheme,
  setProfileTheme,
} from "@/lib/theme/app-theme";
import {
  PROFILE_THEMES,
  type ProfileTheme,
} from "@/lib/profile/study-preferences-storage";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ProfileTheme>("cyan");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(readProfileTheme());

    function onThemeChange() {
      setActive(readProfileTheme());
    }

    window.addEventListener(APP_THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(APP_THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Elegir tema de color"
        aria-expanded={open}
        title="Tema de color"
      >
        <Palette size={18} />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
          role="listbox"
          aria-label="Temas de color"
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tema visual
          </p>
          <div className="grid max-h-64 gap-1 overflow-y-auto">
            {(Object.keys(PROFILE_THEMES) as ProfileTheme[]).map((key) => {
              const theme = PROFILE_THEMES[key];
              const selected = active === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setProfileTheme(key);
                    setActive(key);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                    selected
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{
                      background: theme.accent,
                      boxShadow: selected ? `0 0 8px ${theme.glow}` : undefined,
                    }}
                  />
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
