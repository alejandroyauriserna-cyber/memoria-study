"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlarmClock, X } from "lucide-react";
import type { SurpriseQuestion } from "@/types/guided-legal-study";

export function SurpriseQuestionOverlay({
  open,
  question,
  onDismiss,
  onAnswered,
}: {
  open: boolean;
  question: SurpriseQuestion;
  onDismiss: () => void;
  onAnswered: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(question.timeLimitSec);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(question.timeLimitSec);
    setAnswered(false);
  }, [open, question]);

  useEffect(() => {
    if (!open || answered) return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, answered, secondsLeft]);

  function finish() {
    setAnswered(true);
    onAnswered();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="gs-surprise-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Pregunta rápida"
        >
          <motion.div
            className="gs-surprise-card"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
          >
            <button type="button" className="gs-surprise-close" onClick={onDismiss} aria-label="Cerrar">
              <X size={16} />
            </button>
            <p className="gs-surprise-kicker">
              <AlarmClock size={14} />
              Pregunta rápida
            </p>
            <p className="gs-surprise-timer">{secondsLeft}s</p>
            <p className="gs-surprise-question">{question.question}</p>
            {!answered ? (
              <button type="button" className="gs-le-submit" onClick={finish}>
                Respondí — continuar
              </button>
            ) : (
              <p className="gs-le-feedback is-neutral">
                Bien. Sigues activo — no leas en piloto automático.
              </p>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
