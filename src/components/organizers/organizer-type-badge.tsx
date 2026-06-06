import { getOrganizerTypeBadge } from "@/lib/organizers/type-badge";

export function OrganizerTypeBadge({ type }: { type: string }) {
  const badge = getOrganizerTypeBadge(type);

  return (
    <span
      className={`organizer-type-badge organizer-type-badge--${badge.variant}`}
      title={badge.label}
    >
      <span aria-hidden>{badge.emoji}</span>
      {badge.label}
    </span>
  );
}
