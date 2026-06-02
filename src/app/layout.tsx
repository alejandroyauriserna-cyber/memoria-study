import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoriaStudy · IA Futurista",
  description:
    "Plataforma de estudio con IA para Derecho UNT. Organizadores visuales, flashcards y tutor inteligente.",
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
