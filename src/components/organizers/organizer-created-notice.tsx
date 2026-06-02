"use client";

import { useEffect, useState } from "react";
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
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [created, organizerId]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="mb-8 flex items-start gap-3 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
      <div>
        <p className="font-semibold">Organizador creado correctamente</p>
        <p className="mt-1 text-emerald-800/90">
          Tu organizador con IA ya está listo. Puedes revisarlo abajo y empezar a estudiar.
        </p>
      </div>
    </div>
  );
}
