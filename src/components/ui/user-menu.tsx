"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, FileText, Menu, UserCircle2 } from "lucide-react";

type ProfilePayload = {
  full_name?: string | null;
  current_cycle_label?: string | null;
  current_cycle_number?: number | null;
};

export function UserMenu() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const payload = await response.json();
        setProfile(payload.profile ?? null);
      } catch {
        setProfile(null);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim() ?? "Estudiante";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }, [profile]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-3 rounded-3xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-accent"
      >
        <span className="grid h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-sm">
          {initials}
        </span>
        <span className="hidden sm:block text-left">
          <span className="block text-xs text-muted-foreground">Bienvenido</span>
          <span className="block text-sm font-semibold">{profile?.full_name ?? "Estudiante"}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-2xl">
          <div className="mb-4 rounded-3xl bg-muted p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Ciclo actual</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {profile?.current_cycle_label ?? "Ciclo V"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Nivel: Estudiante</p>
          </div>

          <nav className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <UserCircle2 className="h-4 w-4 text-accent" /> Perfil
            </Link>
            <Link
              href="/favorites"
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <Bookmark className="h-4 w-4 text-accent" /> Favoritos
            </Link>
            <Link
              href="/organizers"
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-accent" /> Organizadores
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
