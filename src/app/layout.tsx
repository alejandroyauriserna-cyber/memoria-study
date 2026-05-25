import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoriaStudy · Derecho UNT",
  description:
    "Plataforma de estudio para Derecho en la Universidad Nacional de Trujillo: flashcards, quiz y mazos por semana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
