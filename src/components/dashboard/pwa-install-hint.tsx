"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "memoria-pwa-hint-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallHint() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <section className="ms-home-glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#F5F7FA]">Instala MemoriaStudy en tu celular</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Acceso rápido desde la pantalla de inicio, como una app.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
          className="tron-btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
        >
          <Download size={14} />
          Instalar
        </button>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="inline-flex h-9 items-center rounded-lg px-2 text-muted-foreground"
          aria-label="Ocultar aviso de instalación"
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
