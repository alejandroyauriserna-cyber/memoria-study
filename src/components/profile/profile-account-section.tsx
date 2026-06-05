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
    <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
        Cuenta
      </p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.45)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estudiante
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F5F7FA]">{fullName}</p>
          {email ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} className="shrink-0 text-[#00FFD5]" />
              {email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={email ? `/auth?mode=recovery&email=${encodeURIComponent(email)}` : "/auth?mode=recovery"}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(16,39,48,0.5)] px-3 py-2 text-xs font-semibold text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.3)]"
          >
            <KeyRound size={14} className="text-[#00FFD5]" />
            Recuperar contraseña
          </Link>
          <button
            type="button"
            onClick={() => void signOutUser("/auth")}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-xs font-semibold text-[#FCA5A5] transition hover:border-[rgba(248,113,113,0.4)]"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
