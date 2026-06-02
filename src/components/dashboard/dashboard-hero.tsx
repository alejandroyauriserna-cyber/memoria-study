"use client";

import { motion } from "framer-motion";
import { Brain, Download, Heart, Layers, Sparkles, TrendingUp } from "lucide-react";

type DashboardHeroProps = {
  profileName: string;
  currentCycle: string;
  career: string;
  totalShared: number;
  totalOrganizers: number;
  totalDownloads: number;
  totalLikes: number;
  levelProgress: number;
};

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function DashboardHero({
  profileName,
  currentCycle,
  career,
  totalShared,
  totalOrganizers,
  totalDownloads,
  totalLikes,
  levelProgress,
}: DashboardHeroProps) {
  const stats = [
    { label: "Materiales", value: totalShared, icon: Layers },
    { label: "Organizadores", value: totalOrganizers, icon: Brain },
    { label: "Descargas", value: totalDownloads, icon: Download },
    { label: "Likes", value: totalLikes, icon: Heart },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.5)] p-8 md:p-12 backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(0,255,213,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[rgba(0,191,255,0.1)] blur-3xl" />

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#00FFD5]">
          <Sparkles size={14} />
          Centro de comando · IA
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#F5F7FA] md:text-5xl">
          Hola, <span className="tron-glow-text">{profileName}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Tu espacio de estudio futurista. Progreso, organizadores y materiales en una interfaz diseñada para el
          2030.
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8 grid gap-3 sm:grid-cols-3"
      >
        {[
          { label: "Carrera", value: career },
          { label: "Ciclo", value: currentCycle },
          { label: "Estado", value: "Activo" },
        ].map((item) => (
          <div key={item.label} className="tron-stat rounded-xl px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-[#F5F7FA]">{item.value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="tron-capsule rounded-xl p-5"
          >
            <stat.icon size={18} className="text-[#00FFD5]" />
            <p className="mt-3 text-3xl font-bold text-[#F5F7FA]">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8 rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.6)] p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#00FFD5]">
              <TrendingUp size={16} />
              Progreso de nivel
            </p>
            <p className="mt-2 text-2xl font-bold text-[#F5F7FA]">Estudiante</p>
          </div>
          <span className="rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
            Novato
          </span>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF] shadow-[0_0_16px_rgba(0,255,213,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{levelProgress}% hacia el siguiente nivel</p>
      </motion.div>
    </section>
  );
}
