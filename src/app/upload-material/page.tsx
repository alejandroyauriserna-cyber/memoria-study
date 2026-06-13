import Link from "next/link";
import {
  BookOpen,
  Command,
  FileText,
  GraduationCap,
  Layers3,
  LibraryBig,
  Sparkles,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { UploadMaterialForm } from "@/components/materials/upload-material-form";

export default function UploadMaterialPage() {
  return (
    <AppShell>
      <div className="ms-home upload-page mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="upload-page-hero library-page-hero">
          <div className="library-page-hero-copy">
            <p className="ms-home-kicker">
              <Sparkles size={14} />
              Biblioteca colaborativa UNT
            </p>
            <h1>Comparte apuntes con toda la red.</h1>
            <p className="ms-home-lead">
              Sube PDFs, resúmenes y casos prácticos ubicados en la malla oficial. Tu material queda
              disponible para compañeros del mismo ciclo y curso.
            </p>
            <div className="library-hero-actions" aria-label="Acciones de subida">
              <Link href="/library" className="library-hero-action">
                <LibraryBig size={16} />
                Ver biblioteca
              </Link>
              <Link href="/my-materials" className="library-hero-action">
                <BookOpen size={16} />
                Mis materiales
              </Link>
            </div>
          </div>

          <div className="library-hero-console" aria-label="Flujo de subida">
            <div className="library-hero-console-top">
              <span>
                <Command size={14} />
                Upload studio
              </span>
              <em>UNT</em>
            </div>
            <div className="upload-hero-steps">
              <div className="upload-hero-step is-active">
                <GraduationCap size={18} />
                <span>1. Ubica en malla</span>
              </div>
              <div className="upload-hero-step">
                <FileText size={18} />
                <span>2. Describe el PDF</span>
              </div>
              <div className="upload-hero-step">
                <Upload size={18} />
                <span>3. Publica en red</span>
              </div>
            </div>
            <div className="library-page-stats" aria-label="Resumen de subida">
              <div className="library-page-stat">
                <span className="library-page-stat-icon">
                  <Layers3 size={18} />
                </span>
                <span>
                  <strong>Malla oficial</strong>
                  <em>Ciclo y curso</em>
                </span>
              </div>
              <div className="library-page-stat">
                <span className="library-page-stat-icon">
                  <FileText size={18} />
                </span>
                <span>
                  <strong>Solo PDF</strong>
                  <em>Apuntes y casos</em>
                </span>
              </div>
              <div className="library-page-stat">
                <span className="library-page-stat-icon">
                  <LibraryBig size={18} />
                </span>
                <span>
                  <strong>Público</strong>
                  <em>Biblioteca UNT</em>
                </span>
              </div>
            </div>
          </div>
        </header>

        <UploadMaterialForm />
      </div>
    </AppShell>
  );
}
