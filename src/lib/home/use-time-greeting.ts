"use client";

import { useSyncExternalStore } from "react";
import { APP_TIME_ZONE, getLocalTimeGreeting, getTimeGreetingInTimeZone } from "@/lib/home/greeting";

function subscribe(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(intervalId);
}

function getSnapshot() {
  return getLocalTimeGreeting();
}

function getServerSnapshot() {
  return getTimeGreetingInTimeZone(new Date(), APP_TIME_ZONE);
}

/** Saludo según la hora local del dispositivo al entrar y mientras navegas. */
export function useTimeGreeting(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
