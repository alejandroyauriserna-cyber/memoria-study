import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./loading-progress.css";
import "./home-2026.css";
import "./academic-trust.css";
import "./mobile-ios-fixes.css";
import "./upload-material-modern.css";
import "./library-modern.css";
import "./library-mobile.css";
import "./favorites-modern.css";
import "./fuentes-modern.css";
import "./biblioteca-juridica-modern.css";
import "./biblioteca-juridica-mobile.css";
import "./profile-modern.css";
import "./auth-modern.css";
import "./organizers-2026.css";
import "./visual-ia-hub.css";
import "./visual-ai-diagram.css";
import "./organizer-studio-panel.css";
import "./organizer-studio-experience.css";
import "./atlas-ia-panel.css";
import { env } from "@/lib/env";
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from "@/lib/pwa/constants";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { ActiveStudyTimeBootstrap } from "@/components/study/active-study-time-bootstrap";

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
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 390px) and (device-height: 844px)",
      },
    ],
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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "MemoriaStudy",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": PWA_BACKGROUND_COLOR,
    "msapplication-navbutton-color": PWA_THEME_COLOR,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: PWA_THEME_COLOR },
    { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLOR },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <PwaProvider />
        <ActiveStudyTimeBootstrap />
        {children}
      </body>
    </html>
  );
}
