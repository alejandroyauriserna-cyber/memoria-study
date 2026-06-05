import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-2026.css";
import { env } from "@/lib/env";

const appUrl = env.appUrl.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MemoriaStudy · Estudio jurídico con IA",
    template: "%s · MemoriaStudy",
  },
  description:
    "Plataforma académica para estudiantes de Derecho UNT. Biblioteca colaborativa, estudio guiado, organizadores visuales y tutor inteligente.",
  applicationName: "MemoriaStudy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MemoriaStudy",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: appUrl,
    siteName: "MemoriaStudy",
    title: "MemoriaStudy · Estudio jurídico con IA",
    description:
      "Biblioteca, estudio guiado y tutor jurídico para estudiantes de Derecho UNT.",
  },
  twitter: {
    card: "summary",
    title: "MemoriaStudy",
    description: "Estudio jurídico con IA para Derecho UNT.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#00FFD5",
  width: "device-width",
  initialScale: 1,
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
