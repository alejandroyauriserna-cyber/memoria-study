import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MemoriaStudy",
    short_name: "MemoriaStudy",
    description:
      "Plataforma académica para estudiantes de Derecho UNT. Biblioteca, estudio guiado y tutor jurídico.",
    start_url: "/",
    display: "standalone",
    background_color: "#07131A",
    theme_color: "#00FFD5",
    lang: "es",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
