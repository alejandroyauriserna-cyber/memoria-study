"use client";

import { KeyRound, LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { signOutUser } from "@/lib/auth/sign-out";

export function ProfileAccountSection({
  email,
  fullName,
}: {
  email?: string | null;
  fullName: string;
}) {
  return (
    <section className="profile-panel">
      <p className="profile-kicker">Cuenta</p>
      <div className="mt-4 space-y-3">
        <div className="profile-subcard">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estudiante
          </p>
          <p className="profile-text-strong mt-1 text-sm font-semibold">{fullName}</p>
          {email ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} className="shrink-0 text-accent" />
              {email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={email ? `/auth?mode=recovery&email=${encodeURIComponent(email)}` : "/auth?mode=recovery"}
            className="profile-link-btn profile-link-btn--ghost"
          >
            <KeyRound size={14} className="text-accent" />
            Recuperar contraseña
          </Link>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="profile-link-btn profile-link-btn--ghost text-red-400 hover:text-red-300"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
