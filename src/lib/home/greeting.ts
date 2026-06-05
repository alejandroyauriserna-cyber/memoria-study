export const APP_TIME_ZONE = "America/Lima";

export function getHourFromDate(date: Date, timeZone?: string): number {
  if (!timeZone) return date.getHours();

  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(date).find((part) => part.type === "hour");

  return hourPart ? Number.parseInt(hourPart.value, 10) : date.getHours();
}

export function getTimeGreetingFromHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Saludo según la hora local del navegador o del sistema. */
export function getLocalTimeGreeting(date = new Date()): string {
  return getTimeGreetingFromHour(date.getHours());
}

/** Saludo según una zona horaria concreta (p. ej. Perú en SSR). */
export function getTimeGreetingInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE): string {
  return getTimeGreetingFromHour(getHourFromDate(date, timeZone));
}

/** @deprecated Usa getLocalTimeGreeting o useTimeGreeting en cliente. */
export function getTimeGreeting(date = new Date()): string {
  return getLocalTimeGreeting(date);
}

export function parseCycleNumberFromLabel(label: string): number {
  const roman: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };
  const match = label.match(/Ciclo\s+([IVX]+)/i);
  if (match) return roman[match[1].toUpperCase()] ?? 5;
  const num = label.match(/(\d+)/);
  return num ? Number.parseInt(num[1], 10) : 5;
}
