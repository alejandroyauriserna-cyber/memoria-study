"use client";

import Link from "next/link";
import {
  BookMarked,
  Clock,
  FileStack,
  Landmark,
  Layers,
  Library,
} from "lucide-react";
import { getTimeGreeting } from "@/lib/home/greeting";

type PersonalDashboardStripProps = {
  profileName: string;
  currentCycle: string;
  activeCoursesCount: number;
  materialsThisWeek: number;
  studyHoursEstimate: number;
  totalShared: number;
};

export function PersonalDashboardStrip({
  profileName,
  currentCycle,
  activeCoursesCount,
  materialsThisWeek,
  studyHoursEstimate,
  totalShared,
}: PersonalDashboardStripProps) {
  const greeting = getTimeGreeting();
  const firstName = profileName.split(/\s+/)[0] ?? profileName;

  const stats = [
    {
      label: "Ciclo académico",
      value: currentCycle,
      icon: Landmark,
      hint: `${activeCoursesCount} cursos en malla`,
    },
    {
      label: "Cursos activos",
      value: String(activeCoursesCount),
      icon: BookMarked,
      hint: "Malla oficial UNT 2021",
    },
    {
      label: "Esta semana",
      value: String(materialsThisWeek),
      icon: FileStack,
      hint: "Materiales generados",
    },
    {
      label: "Horas de estudio",
      value: `~${studyHoursEstimate}h`,
      icon: Clock,
      hint: "Estimado por actividad",
    },
    {
      label: "Documentos",
      value: String(totalShared),
      icon: Layers,
      hint: "En tu biblioteca",
    },
  ];

  return (
    <section className="ms-home-glass p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ms-home-section-title">Panel personalizado</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F5F7FA] md:text-3xl">
            {greeting}, {firstName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Derecho UNT · {currentCycle}
          </p>
        </div>
        <Link
          href="/library"
          className="tron-btn-secondary inline-flex h-10 items-center gap-2 self-start rounded-lg px-4 text-sm font-semibold md:self-auto"
        >
          <Library size={15} />
          Biblioteca jurídica
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[rgba(0,255,213,0.08)] bg-[rgba(7,19,26,0.45)] px-4 py-3.5"
          >
            <stat.icon size={16} className="text-[#00FFD5]" />
            <p className="ms-home-stat-value mt-2 text-xl font-bold text-[#F5F7FA]">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/80">{stat.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
