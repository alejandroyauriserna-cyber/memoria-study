"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Scale, Sparkles, X } from "lucide-react";

export function LibraryShareSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shared = searchParams.get("shared") === "1";
  const title = searchParams.get("title")?.trim() ?? "";
  const [visible, setVisible] = useState(shared);

  useEffect(() => {
    setVisible(shared);
  }, [shared]);

  const dismiss = useCallback(() => {
    setVisible(false);
    router.replace("/library", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => dismiss(), 14000);
    return () => window.clearTimeout(timer);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="library-share-success"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22 }}
        >
          <div className="library-share-success__icon" aria-hidden>
            <Sparkles size={22} />
          </div>
          <div className="library-share-success__copy">
            <p className="library-share-success__kicker">
              <Scale size={14} />
              Material publicado en la biblioteca
            </p>
            <h2>
              {title ? `«${title}» ya está disponible` : "¡Tu material ya está disponible!"}
            </h2>
            <p>
              Gracias por compartir con la comunidad UNT. Cada apunte que subes ayuda a formar
              mejores abogados y una biblioteca jurídica más fuerte para todos.
            </p>
            <p className="library-share-success__thanks">
              <Heart size={14} />
              Sigues mejorando el estudio de Derecho en Trujillo.
            </p>
          </div>
          <button
            type="button"
            className="library-share-success__close"
            onClick={dismiss}
            aria-label="Cerrar mensaje"
          >
            <X size={18} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
