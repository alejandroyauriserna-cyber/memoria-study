"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function JurisprudenceAdminNavLink({ className }: { className?: string } = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void fetch("/api/jurisprudence/access")
      .then((res) => res.json())
      .then((payload: { isModerator?: boolean }) => setVisible(Boolean(payload.isModerator)))
      .catch(() => setVisible(false));
  }, []);

  if (!visible) return null;

  return (
    <Link href="/admin/biblioteca-juridica" className={className ?? "tron-nav-link"}>
      <Shield size={13} className="mr-1 inline" aria-hidden />
      Admin Jurídica
    </Link>
  );
}
