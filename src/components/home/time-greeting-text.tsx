"use client";

import { useTimeGreeting } from "@/lib/home/use-time-greeting";

export function TimeGreetingText({
  name,
  suffix,
}: {
  name: string;
  suffix?: string;
}) {
  const greeting = useTimeGreeting();

  return (
    <>
      {greeting}, {name}
      {suffix ? ` · ${suffix}` : null}
    </>
  );
}
