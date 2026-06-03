"use client";

import Link from "next/link";
import { BookMarked, Brain, Library } from "lucide-react";
import { LegalAiHero } from "@/components/home/legal-ai-hero";
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
];

export function MemoriaDashboard({
  profileName,
  currentCycle,
  activeCoursesCount,
  materialsThisWeek,
  studyHoursEstimate,
  totalShared,
  recentItems,
  suggestions,
}: MemoriaDashboardProps) {
  return (
    <div className="ms-home ms-page mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <LegalAiHero />

      <PersonalDashboardStrip
        profileName={profileName}
        currentCycle={currentCycle}
        activeCoursesCount={activeCoursesCount}
        materialsThisWeek={materialsThisWeek}
        studyHoursEstimate={studyHoursEstimate}
        totalShared={totalShared}
      />

      <ContinueStudying items={recentItems} />

      <AiSuggestions suggestions={suggestions} />

      <section>
        <p className="ms-home-section-title mb-3">Acceso directo</p>
        <div className="grid gap-3 md:grid-cols-3">
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
