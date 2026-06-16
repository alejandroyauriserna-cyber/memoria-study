"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  PWA_DISMISS_DAYS,
  PWA_DISMISS_UNTIL_KEY,
} from "@/lib/pwa/constants";
import "@/components/pwa/install-app-banner.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isDismissed(): boolean {
  const until = window.localStorage.getItem(PWA_DISMISS_UNTIL_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismissForDays(days: number) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(PWA_DISMISS_UNTIL_KEY, String(until));
}

export function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!isMobileDevice() || isStandaloneMode() || isDismissed()) return;

    setShowIosSteps(isIosDevice() && !deferredPrompt);

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowIosSteps(false);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const timer = window.setTimeout(() => {
      if (!isStandaloneMode() && !isDismissed() && isMobileDevice()) {
        setVisible(true);
        if (isIosDevice()) setShowIosSteps(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, [deferredPrompt]);

  useEffect(() => {
    if (deferredPrompt && isMobileDevice() && !isStandaloneMode() && !isDismissed()) {
      setVisible(true);
    }
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismissForDays(PWA_DISMISS_DAYS);
    setVisible(false);
  }, []);

  if (!visible || isStandaloneMode()) return null;

  return (
    <div className="pwa-install" role="dialog" aria-labelledby="pwa-install-title">
      <div className="pwa-install__sheet">
        <button
          type="button"
          className="pwa-install__close"
          onClick={handleDismiss}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="pwa-install__icon">
          <Smartphone size={22} />
        </div>

        <h2 id="pwa-install-title" className="pwa-install__title">
          Instalar MemoriaStudy
        </h2>
        <p className="pwa-install__copy">
          Accede como app independiente: sin barra del navegador, más rápido desde tu pantalla de
          inicio.
        </p>

        {showIosSteps && !deferredPrompt ? (
          <ol className="pwa-install__ios-steps">
            <li>
              Toca <Share size={14} className="inline align-text-bottom" /> Compartir en Safari
            </li>
            <li>Selecciona «Añadir a pantalla de inicio»</li>
            <li>Confirma «Añadir»</li>
          </ol>
        ) : null}

        <div className="pwa-install__actions">
          {deferredPrompt ? (
            <button
              type="button"
              className="pwa-install__btn-primary"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              <Download size={18} />
              {installing ? "Instalando…" : "Instalar MemoriaStudy"}
            </button>
          ) : showIosSteps ? (
            <p className="pwa-install__ios-hint">Sigue los pasos arriba para instalar en iPhone.</p>
          ) : (
            <button type="button" className="pwa-install__btn-primary" onClick={handleDismiss}>
              <Download size={18} />
              Entendido
            </button>
          )}
          <button type="button" className="pwa-install__btn-ghost" onClick={handleDismiss}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
