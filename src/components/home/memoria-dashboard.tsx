"use client";

import Link from "next/link";
import { BookMarked, BookOpen, Brain, Gavel, Library, Sparkles } from "lucide-react";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { PwaInstallHint } from "@/components/dashboard/pwa-install-hint";
import { CompactDashboardHero } from "@/components/home/compact-dashboard-hero";
import { PersonalDashboardStrip } from "@/components/home/personal-dashboard-strip";
import { ContinueStudying } from "@/components/home/continue-studying";
import { AiSuggestions } from "@/components/home/ai-suggestions";
import type { MemoriaDashboardProps } from "@/lib/home/dashboard-types";

const SHORTCUTS = [
  {
    href: "/library",
    title: "Biblioteca jurídica",
    description: "Apuntes y PDFs por curso y ciclo oficial.",
    icon: Library,
  },
  {
    href: "/library",
    title: "Estudio guiado",
    description: "Abre un PDF de tu biblioteca y estudia con el tutor.",
    icon: BookOpen,
  },
  {
    href: "/fuentes-juridicas",
    title: "Fuentes jurídicas",
    description: "LP Derecho, jurisprudencia y normativa.",
    icon: Gavel,
  },
  {
    href: "/organizers",
    title: "Organizadores visuales",
    description: "Mapas, sinópticos y resúmenes con IA.",
    icon: Brain,
  },
  {
    href: "/cuaderno",
    title: "Cuaderno IA",
    description: "Apuntes, casos y generación sin PDF.",
    icon: BookMarked,
  },
  {
    href: "/upload-material",
    title: "Subir material",
    description: "Genera mazos y organizadores desde PDF.",
    icon: Sparkles,
  },
];

export function MemoriaDashboard({
  profileName,
  currentCycle,
  activeCoursesCount,
  materialsThisWeek,
  studyHoursLabel,
  totalShared,
  studyStreakDays,
  pagesUnderstood,
  showOnboarding,
  recentItems,
  suggestions,
}: MemoriaDashboardProps) {
  return (
    <div className="ms-home ms-page mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PersonalDashboardStrip
        profileName={profileName}
        currentCycle={currentCycle}
        activeCoursesCount={activeCoursesCount}
        materialsThisWeek={materialsThisWeek}
        studyHoursLabel={studyHoursLabel}
        totalShared={totalShared}
        studyStreakDays={studyStreakDays}
        pagesUnderstood={pagesUnderstood}
      />

      <DashboardOnboarding show={showOnboarding} />

      <PwaInstallHint />

      <ContinueStudying items={recentItems} />

      <CompactDashboardHero />

      <AiSuggestions suggestions={suggestions} />

      <section>
        <p className="ms-home-section-title mb-3">Acceso directo</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((item) => (
            <Link key={item.href} href={item.href} className="ms-home-glass group block p-4">
              <item.icon size={20} className="text-[#00FFD5]" />
              <h3 className="mt-3 text-sm font-semibold text-[#F5F7FA] group-hover:text-[#00FFD5]">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
