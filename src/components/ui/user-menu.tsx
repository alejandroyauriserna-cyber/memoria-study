"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, FileText, LogOut, UserCircle2 } from "lucide-react";
import { signOutUser } from "@/lib/auth/sign-out";

type ProfilePayload = {
  full_name?: string | null;
  current_cycle_label?: string | null;
  current_cycle_number?: number | null;
  email?: string | null;
};

export function UserMenu() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = "user-menu-panel";

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const payload = await response.json();
        if (!payload.profile) {
          setSignedIn(false);
          setProfile(null);
          return;
        }
        setSignedIn(true);
        setProfile(payload.profile);
      } catch {
        setSignedIn(false);
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

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim() ?? "Estudiante";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }, [profile]);

  if (!signedIn) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
      >
        <UserCircle2 size={18} />
        Ingresar
      </Link>
    );
  }

  const menuLabel = profile?.full_name ?? "usuario";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Menú de ${menuLabel}`}
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
        <div
          id={menuId}
          role="menu"
          aria-label="Cuenta de usuario"
          className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-2xl"
        >
          <div className="mb-4 rounded-3xl bg-muted p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Ciclo actual</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {profile?.current_cycle_label ?? "Sin ciclo configurado"}
            </p>
            {profile?.email ? (
              <p className="mt-1 truncate text-[10px] text-muted-foreground">{profile.email}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Nivel: Estudiante</p>
            )}
          </div>

          <nav className="space-y-2" aria-label="Enlaces de cuenta">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <UserCircle2 className="h-4 w-4 text-accent" /> Perfil
            </Link>
            <Link
              href="/favorites"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <Bookmark className="h-4 w-4 text-accent" /> Favoritos
            </Link>
            <Link
              href="/organizers"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-accent" /> Organizadores
            </Link>
          </nav>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOutUser("/auth");
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] px-3 py-2.5 text-sm font-semibold text-[#FCA5A5] transition hover:bg-[rgba(248,113,113,0.12)]"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
