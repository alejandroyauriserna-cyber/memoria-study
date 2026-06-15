"use client";

import Link from "next/link";
import { Eye, Pencil, Users } from "lucide-react";
import { getTextPreview } from "@/lib/cuaderno/html-utils";
import type { CuadernoClass, CuadernoSharePermission } from "@/types/cuaderno";
import "./cuaderno-shared-preview.css";

export function CuadernoSharedPreview({
  cuadernoClass,
  sharePermission,
  isLoggedIn,
  token,
}: {
  cuadernoClass: CuadernoClass;
  sharePermission: CuadernoSharePermission;
  isLoggedIn: boolean;
  token: string;
}) {
  const preview = getTextPreview(cuadernoClass.notes, 800);

  return (
    <article className="cn-shared-preview mx-auto max-w-3xl px-4 py-10">
      <div className="cn-shared-preview-badge">
        {sharePermission === "edit" ? <Pencil size={14} /> : <Eye size={14} />}
        {sharePermission === "edit" ? "Cuaderno colaborativo" : "Apunte compartido (lectura)"}
      </div>

      <h1 className="cn-shared-preview-title">{cuadernoClass.title}</h1>
      <p className="cn-shared-preview-meta">
        {cuadernoClass.courseName}
        {cuadernoClass.isGroupNotebook && (
          <span className="cn-shared-group-tag">
            <Users size={12} /> Grupal
          </span>
        )}
      </p>

      <div className="cn-shared-preview-body">
        <p>{preview || "Esta hoja aún no tiene contenido."}</p>
      </div>

      <div className="cn-shared-preview-actions">
        {!isLoggedIn ? (
          <Link
            href={`/auth?next=/cuaderno/compartido/${token}`}
            className="cn-shared-cta"
          >
            Iniciar sesión para {sharePermission === "edit" ? "colaborar" : "guardar en mi cuaderno"}
          </Link>
        ) : sharePermission === "edit" ? (
          <Link href={`/cuaderno/${cuadernoClass.id}`} className="cn-shared-cta">
            Abrir y editar juntos
          </Link>
        ) : (
          <p className="cn-shared-readonly-note">
            Tienes acceso de solo lectura. Pide al autor permiso de edición si quieres colaborar.
          </p>
        )}
        <Link href="/cuaderno" className="cn-shared-back">
          Volver a mi biblioteca
        </Link>
      </div>
    </article>
  );
}
