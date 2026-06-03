export function formatCuadernoRelativeTime(iso: string | null): string {
  if (!iso) return "Sin actividad";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
  }
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}
