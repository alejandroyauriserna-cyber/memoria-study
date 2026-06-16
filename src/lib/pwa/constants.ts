/** Colores oficiales MemoriaStudy para PWA */
export const PWA_THEME_COLOR = "#00FFD5";
export const PWA_BACKGROUND_COLOR = "#07131A";
export const PWA_ACCENT_SECONDARY = "#00BFFF";

export const PWA_DISMISS_KEY = "memoria-pwa-install-dismissed";
export const PWA_DISMISS_UNTIL_KEY = "memoria-pwa-install-dismissed-until";

/** Tiempo antes de volver a mostrar el banner tras cerrarlo (7 días) */
export const PWA_DISMISS_DAYS = 7;

export const SW_CACHE_VERSION = "memoria-pwa-v1";

export const OFFLINE_ROUTES = ["/", "/library", "/organizers"] as const;

export const PRECACHE_ASSETS = [
  "/",
  "/library",
  "/organizers",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icon.svg",
] as const;
