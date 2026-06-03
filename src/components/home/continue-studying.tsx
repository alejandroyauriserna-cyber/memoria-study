"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Gavel,
  MessageSquare,
  NotebookPen,
  ScrollText,
} from "lucide-react";
import type { RecentContinueItem, RecentItemKind } from "@/lib/home/dashboard-types";

const KIND_META: Record<
  RecentItemKind,
  { icon: typeof FileText; label: string }
> = {
  pdf: { icon: FileText, label: "PDF" },
  apunte: { icon: NotebookPen, label: "Apunte" },
  organizer: { icon: Brain, label: "Organizador" },
  exam: { icon: ScrollText, label: "Examen" },
  chat: { icon: MessageSquare, label: "IA jurídica" },
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

type ContinueStudyingProps = {
  items: RecentContinueItem[];
};

export function ContinueStudying({ items }: ContinueStudyingProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="ms-home-section-title">Actividad reciente</p>
          <h2 className="mt-1 text-xl font-bold text-[#F5F7FA]">Continúa donde lo dejaste</h2>
        </div>
        <Link href="/library" className="text-xs font-medium text-[#00FFD5] hover:underline">
          Ver todo
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="ms-home-glass flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Gavel size={28} className="text-[#00FFD5]/60" />
          <p className="text-sm text-muted-foreground">
            Aún no hay actividad reciente. Sube un PDF o abre un material de la biblioteca.
          </p>
          <Link
            href="/upload-material"
            className="tron-btn-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
          >
            Subir primer documento
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            return (
              <motion.div
                key={`${item.kind}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link href={item.href} className="ms-home-glass group block h-full p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,255,213,0.14)] bg-[rgba(0,255,213,0.06)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00FFD5]">
                      <Icon size={12} />
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatRelative(item.at)}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-[#F5F7FA] group-hover:text-[#00FFD5]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
