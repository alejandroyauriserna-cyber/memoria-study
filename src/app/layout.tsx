import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-2026.css";
import "./library-modern.css";
import "./favorites-modern.css";
import "./fuentes-modern.css";
import "./profile-modern.css";
import "./auth-modern.css";
import "./organizers-2026.css";
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

const themeBootstrapScript = `(function(){try{var t=localStorage.getItem("memoria-theme");var d=t==="light"?false:t==="dark"?true:window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);var s=localStorage.getItem("memoria-profile-study-settings");if(s){var p=JSON.parse(s);if(p&&p.theme)document.documentElement.dataset.profileTheme=p.theme;}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
