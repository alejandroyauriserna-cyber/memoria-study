"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function OrganizerCreatedNotice({
  organizerId,
  created,
}: {
  organizerId?: string;
  created?: boolean;
}) {
  const [visible, setVisible] = useState(Boolean(organizerId || created));

  useEffect(() => {
    if (!organizerId && !created) return;

    setVisible(true);

    if (organizerId) {
      const target = document.getElementById(`organizer-${organizerId}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = window.setTimeout(() => setVisible(false), 7000);
    return () => window.clearTimeout(timer);
  }, [created, organizerId]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="organizer-glass mb-4 flex items-start gap-3 rounded-2xl px-4 py-3"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={18} />
      <div>
        <p className="text-sm font-semibold text-foreground">Organizador listo</p>
        <p className="text-xs text-muted-foreground">Abre el canvas para explorar el mapa y las secciones flotantes.</p>
      </div>
    </motion.div>
  );
}
