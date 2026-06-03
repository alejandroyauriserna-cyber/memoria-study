import type { Metadata } from "next";
import "./globals.css";
import "./home-2026.css";

export const metadata: Metadata = {
  title: "MemoriaStudy · Estudio jurídico con IA",
  description:
    "Plataforma académica para estudiantes de Derecho UNT. Biblioteca colaborativa, organizadores visuales y tutor inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="flex min-h-full flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
