"use client";

import { CloudOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineSyncBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200"
    >
      <CloudOff size={14} />
      Sin conexión — tu progreso se guarda localmente y se sincronizará al volver en línea.
      <Wifi size={14} className="opacity-50" />
    </div>
  );
}
