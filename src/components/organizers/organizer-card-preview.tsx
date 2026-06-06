import {
  previewBlockFill,
  type OrganizerCardPreviewStats,
} from "@/lib/organizers/card-preview-stats";

export function OrganizerCardPreviewFallback({
  stats,
}: {
  stats: OrganizerCardPreviewStats;
}) {
  const filled = previewBlockFill(stats.count);

  return (
    <div
      className={`study-map-viewport organizer-card-preview organizer-card-preview--${stats.variant}`}
      role="img"
      aria-label={`${stats.label}: ${stats.count} ${stats.unit}`}
    >
      <p className="organizer-card-preview__label">{stats.label}</p>
      <p className="organizer-card-preview__count">
        {stats.count} {stats.unit}
      </p>
      <div className="organizer-preview-blocks" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`organizer-preview-block${
              index < filled ? ` is-on organizer-preview-block--${stats.variant}` : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function OrganizerCardPreviewEmpty() {
  return (
    <div className="study-map-viewport organizer-card-preview organizer-card-preview--juridico">
      <p className="organizer-card-preview__label">ORGANIZADOR</p>
      <p className="organizer-card-preview__count">Contenido listo</p>
      <div className="organizer-preview-blocks" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`organizer-preview-block${index < 3 ? " is-on organizer-preview-block--juridico" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
