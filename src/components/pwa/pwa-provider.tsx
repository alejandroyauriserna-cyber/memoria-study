"use client";

import { InstallAppBanner } from "@/components/pwa/install-app-banner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export function PwaProvider() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallAppBanner />
    </>
  );
}
