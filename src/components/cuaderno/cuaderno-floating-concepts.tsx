"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Scale } from "lucide-react";

export function CuadernoFloatingConcepts({
  concepts,
  onExpand,
}: {
  concepts: Array<{ term: string; cite?: string }>;
  onExpand: (term: string) => void;
}) {
  if (!concepts.length) return null;

  return (
    <div className="cn-floating-concepts" aria-label="Conceptos detectados">
      <AnimatePresence>
        {concepts.map((concept, index) => (
          <motion.button
            key={concept.term}
            type="button"
            className="cn-floating-concept-card"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            onClick={() => onExpand(concept.term)}
          >
            <span className="cn-floating-concept-icon">
              <Scale size={13} />
            </span>
            <span className="min-w-0 text-left">
              <strong>{concept.term}</strong>
              {concept.cite ? <em>{concept.cite}</em> : null}
            </span>
            <span className="cn-floating-concept-expand">Expandir</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
