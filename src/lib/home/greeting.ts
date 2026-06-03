export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
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
