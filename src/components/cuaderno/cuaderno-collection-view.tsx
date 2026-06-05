"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  SMART_COLLECTIONS,
  type SmartCollectionSlug,
} from "@/lib/cuaderno/smart-collections";
import { CuadernoNotebookCover } from "@/components/cuaderno/cuaderno-notebook-cover";
import { CuadernoSyncProvider, useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import type { CuadernoCollectionsSnapshot } from "@/lib/cuaderno/collections-server";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoCollectionView({
  slug,
  classes,
  initialSnapshot,
}: {
  slug: SmartCollectionSlug;
  classes: CuadernoClass[];
  initialSnapshot?: CuadernoCollectionsSnapshot;
}) {
  return (
    <CuadernoSyncProvider initialSnapshot={initialSnapshot}>
      <CuadernoCollectionViewInner slug={slug} classes={classes} />
    </CuadernoSyncProvider>
  );
}

function CuadernoCollectionViewInner({
  slug,
  classes,
}: {
  slug: SmartCollectionSlug;
  classes: CuadernoClass[];
  initialSnapshot?: CuadernoCollectionsSnapshot;
}) {
  const { collections } = useCuadernoSyncContext();
  const meta = SMART_COLLECTIONS.find((c) => c.slug === slug)!;

  const favoriteClasses = useMemo(() => {
    const ids = new Set(collections.favoriteClassIds);
    return classes.filter((c) => ids.has(c.id));
  }, [classes, collections.favoriteClassIds]);

  const examItems = collections.examItems;
  const summaryItems = collections.summaryItems;

  const count =
    slug === "favoritos"
      ? favoriteClasses.length
      : slug === "examenes"
        ? examItems.length
        : summaryItems.length;

  return (
    <div className="cuaderno-premium ms-notebook-shell cuaderno-shell mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/cuaderno" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00FFD5]">
        <ArrowLeft size={16} />
        Mis apuntes
      </Link>

      <header className="mt-6 flex flex-wrap items-end gap-6">
        <div className="w-[180px]">
          <CuadernoNotebookCover
            href="/cuaderno"
            title={meta.title}
            coverArt={{
              icon: meta.icon,
              accent: meta.accent,
              cover: meta.cover,
              motifs: meta.motifs,
            }}
            stats={{ classCount: count, pageCount: 0, lastEditedAt: null }}
            compact
          />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{meta.description}</p>
      </header>

      {slug === "favoritos" ? (
        <ul className="mt-8 space-y-2">
          {favoriteClasses.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/12 py-12 text-center text-sm text-muted-foreground">
              Marca hojas con la estrella dentro del cuaderno.
            </li>
          ) : (
            favoriteClasses.map((item) => (
              <li key={item.id}>
                <Link href={`/cuaderno/${item.id}`} className="cuaderno-sheet-card block px-5 py-4">
                  <p className="font-semibold text-[#F5F7FA]">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.courseName}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {slug === "examenes" ? (
        <ul className="mt-8 space-y-4">
          {examItems.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/12 py-12 text-center text-sm text-muted-foreground">
              Genera preguntas o simulacros desde la barra IA en cualquier hoja.
            </li>
          ) : (
            examItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/8 bg-[#12181f]/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#00FFD5]">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.courseName}
                      {item.classTitle ? ` · ${item.classTitle}` : ""}
                    </p>
                  </div>
                  {item.classId ? (
                    <Link href={`/cuaderno/${item.classId}`} className="text-xs text-[#00FFD5] hover:underline">
                      Ver hoja
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-[#F5F7FA]/85">
                  {item.content}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {slug === "resumenes" ? (
        <ul className="mt-8 space-y-4">
          {summaryItems.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/12 py-12 text-center text-sm text-muted-foreground">
              Pide «Resume…» en la IA Jurídica; se guardará aquí automáticamente.
            </li>
          ) : (
            summaryItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/8 bg-[#12181f]/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#00FFD5]">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.courseName}</p>
                  </div>
                  {item.classId ? (
                    <Link href={`/cuaderno/${item.classId}`} className="text-xs text-[#00FFD5] hover:underline">
                      Ver hoja
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-[#F5F7FA]/85">
                  {item.content}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
