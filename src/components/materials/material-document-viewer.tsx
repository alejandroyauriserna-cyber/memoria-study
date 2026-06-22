"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { PdfViewerPanel } from "@/components/guided-study/pdf-viewer-panel";
import { LoadingState } from "@/components/ui/loading-state";
import { parseJsonResponse } from "@/lib/api/parse-json-response";
import {
  materialDownloadButtonLabel,
  materialFileApiPath,
} from "@/lib/materials/material-viewer";

type MaterialPreview = {
  id: string;
  title: string;
  fileName: string;
  documentKind: "pdf" | "pptx";
  fileUrl: string;
  totalPages: number;
  pageTexts?: string[];
};

export function MaterialDocumentViewer({ materialId }: { materialId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<MaterialPreview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/materials/${materialId}/preview`, {
          cache: "no-store",
        });
        const payload = await parseJsonResponse<MaterialPreview & { error?: string }>(response);

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo cargar el documento.");
        }

        if (!cancelled) {
          setPreview(payload);
          setCurrentPage(1);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Error desconocido.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [materialId]);

  if (loading) {
    return (
      <LoadingState
        active
        preset="guidedStudyInit"
        message="Preparando vista del documento…"
        variant="overlay"
        className="min-h-[70vh]"
      />
    );
  }

  if (error || !preview) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <p className="mt-4 font-semibold text-foreground">No se pudo abrir el documento</p>
        <p className="mt-2 text-sm text-muted-foreground">{error || "Intenta de nuevo."}</p>
        <Link
          href={`/materials/${materialId}`}
          className="tron-btn-secondary mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
        >
          Volver al material
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/materials/${materialId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <ArrowLeft size={14} />
            Volver al material
          </Link>
          <h1 className="mt-2 truncate text-xl font-bold text-foreground">{preview.title}</h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">{preview.fileName}</p>
        </div>
        <a
          href={materialFileApiPath(materialId, "attachment")}
          className="tron-btn-secondary inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold"
        >
          {materialDownloadButtonLabel(preview.fileName)}
        </a>
      </div>

      <div className="gs-panel-shell min-h-[60vh] flex-1 overflow-hidden rounded-2xl border border-border">
        <PdfViewerPanel
          fileUrl={preview.fileUrl}
          pageNumber={currentPage}
          totalPages={preview.totalPages}
          onPageChange={setCurrentPage}
          documentKind={preview.documentKind}
          slideText={preview.pageTexts?.[currentPage - 1]}
        />
      </div>
    </div>
  );
}
