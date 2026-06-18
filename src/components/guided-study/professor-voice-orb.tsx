"use client";

export function ProfessorVoiceOrb({
  active,
  listening,
  thinking,
}: {
  active?: boolean;
  listening?: boolean;
  thinking?: boolean;
}) {
  const className = [
    "voice-orb",
    active ? "is-speaking" : "",
    listening ? "is-listening" : "",
    thinking ? "is-thinking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="professor-ai-orb-wrap" aria-hidden>
      <div className={className}>
        <span className="voice-orb__ring voice-orb__ring--1" />
        <span className="voice-orb__ring voice-orb__ring--2" />
        <span className="voice-orb__core" />
      </div>
    </div>
  );
}
