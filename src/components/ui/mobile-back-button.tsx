"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function MobileBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      className="shell-mobile-back md:hidden"
      onClick={handleBack}
      aria-label="Volver atrás"
    >
      <ArrowLeft size={18} aria-hidden />
    </button>
  );
}
