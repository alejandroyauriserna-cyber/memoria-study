"use client";

import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  Brain,
  FileUp,
  Heart,
  Layers,
  Library,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";
import { ProfileSync } from "@/components/dashboard/profile-sync";
import { UploadGenerator } from "@/components/study/upload-generator";

export type DashboardHomeProps = {
  profileName: string;
  currentCycle: string;
  career: string;
  totalShared: number;
  totalOrganizers: number;
  totalDownloads: number;
  totalLikes: number;
  totalFavorites: number;
  levelProgress: number;
};

const tools = [
  {
    href: "/library",
    title: "Biblioteca",
    description: "Explora apuntes, PDFs y materiales compartidos por curso y ciclo.",
    icon: Library,
  },
  {
    href: "/organizers",
    title: "Organizadores",
    description: "Mapas conceptuales y resúmenes visuales generados con IA.",
    icon: Brain,
  },
  {
    href: "/cuaderno",
    title: "Cuaderno IA",
    description: "Apuntes de clase, diccionario jurídico y generación sin PDF.",
    icon: BookMarked,
  },
  {
    href: "/dashboard#tutor",
    title: "Tutor PDF",
    description: "Pregunta sobre tus documentos con contexto jurídico UNT.",
    icon: MessageSquare,
  },
];

const quickActions = [
  { href: "/upload-material", label: "Subir material", icon: Upload, primary: true },
  { href: "/library", label: "Abrir biblioteca", icon: Library, primary: false },
  { href: "/organizers", label: "Crear organizador", icon: Sparkles, primary: false },
  { href: "/dashboard#tutor", label: "Tutor PDF", icon: MessageSquare, primary: false },
];

export function DashboardHome({
  profileName,
  currentCycle,
  career,
  totalShared,
  totalOrganizers,
  totalDownloads,
  totalLikes,
  totalFavorites,
  levelProgress,
}: DashboardHomeProps) {
  return (
    <div className="ms-page mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Fila 1: Hero académico */}
      <section className="ms-panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
          Plataforma académica de Derecho
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">
          Bienvenido, {profileName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Resumen de tu actividad en {career}. Gestiona materiales, organizadores visuales y estudio colaborativo.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Materiales subidos", value: totalShared, icon: Layers },
            { label: "Organizadores", value: totalOrganizers, icon: Brain },
            { label: "Favoritos", value: totalFavorites, icon: Heart },
            { label: "Descargas recibidas", value: totalDownloads, icon: BookOpen },
          ].map((stat) => (
            <div key={stat.label} className="ms-stat-card rounded-xl p-4">
              <stat.icon size={16} className="text-[#00FFD5]" />
              <p className="mt-2 text-2xl font-bold text-[#F5F7FA]">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "tron-btn-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
                  : "tron-btn-secondary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
              }
            >
              <action.icon size={15} />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Fila 2: Herramientas principales */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Herramientas principales
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="ms-panel group block p-5 transition hover:border-[rgba(0,255,213,0.3)]">
              <tool.icon size={22} className="text-[#00FFD5]" />
              <h3 className="mt-3 text-lg font-semibold text-[#F5F7FA] group-hover:text-[#00FFD5]">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Fila 3: Información complementaria */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="ms-panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#F5F7FA]">Actividad reciente</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="rounded-lg border border-[rgba(0,255,213,0.08)] bg-[rgba(7,19,26,0.4)] px-4 py-3">
              {totalShared > 0
                ? "Has compartido materiales recientemente. Sigue ampliando tu biblioteca personal."
                : "Aún no has subido materiales. Comienza compartiendo un apunte o PDF."}
            </li>
            <li className="rounded-lg border border-[rgba(0,255,213,0.08)] bg-[rgba(7,19,26,0.4)] px-4 py-3">
              {totalOrganizers > 0
                ? `Tienes ${totalOrganizers} organizador${totalOrganizers === 1 ? "" : "es"} visual${totalOrganizers === 1 ? "" : "es"} listos para estudiar.`
                : "Genera tu primer organizador visual desde la biblioteca con «Estudiar con IA»."}
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="ms-panel p-5">
            <h2 className="text-sm font-semibold text-[#F5F7FA]">Progreso académico</h2>
            <p className="mt-1 text-xs text-muted-foreground">{currentCycle}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{levelProgress}% del siguiente nivel</p>
          </div>

          <div className="ms-panel p-5">
            <h2 className="text-sm font-semibold text-[#F5F7FA]">Estadísticas</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Likes</dt>
                <dd className="font-semibold text-[#F5F7FA]">{totalLikes}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Descargas</dt>
                <dd className="font-semibold text-[#F5F7FA]">{totalDownloads}</dd>
              </div>
            </dl>
            <Link href="/favorites" className="tron-btn-secondary mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold">
              <Heart size={14} /> Ver favoritos
            </Link>
          </div>
        </div>
      </section>

      {/* Generador */}
      <section id="generador" className="ms-panel p-6 md:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(0,255,213,0.1)] text-[#00FFD5]">
            <FileUp size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#F5F7FA]">Generador de material de estudio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube un PDF, define el contexto académico y genera flashcards, definiciones y quiz con IA.
            </p>
          </div>
        </div>
        <ProfileSync />
        <div className="mt-6">
          <UploadGenerator />
        </div>
      </section>

      <section id="tutor" className="ms-panel p-6 md:p-8">
        <h2 className="text-lg font-bold text-[#F5F7FA]">Tutor PDF</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Genera primero un mazo desde un PDF para activar el tutor. Luego podrás hacer preguntas con contexto del documento.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          El tutor está disponible en la página principal después de procesar un PDF.
        </p>
        <Link href="/" className="tron-btn-secondary mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold">
          Ir al tutor en inicio
        </Link>
      </section>
    </div>
  );
}
