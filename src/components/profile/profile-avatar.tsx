"use client";

import Image from "next/image";

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "rank";
  accent?: string;
  className?: string;
  priority?: boolean;
};

const SIZE_PX = {
  sm: 40,
  md: 52,
  lg: 120,
  rank: 52,
} as const;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "md",
  accent = "#00FFD5",
  className = "",
  priority = false,
}: Props) {
  const px = SIZE_PX[size];
  const initials = getInitials(name) || "MS";
  const sizeClass = `profile-avatar-image profile-avatar-image--${size}`;

  if (avatarUrl) {
    return (
      <span
        className={`${sizeClass} ${className}`.trim()}
        style={{ width: px, height: px }}
        aria-hidden={size !== "lg"}
        aria-label={size === "lg" ? `Avatar de ${name}` : undefined}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={px}
          height={px}
          className="profile-avatar-image__img"
          unoptimized
          priority={priority}
        />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} profile-avatar-image--fallback ${className}`.trim()}
      style={{
        width: px,
        height: px,
        background: `linear-gradient(145deg, ${accent}, rgba(0,153,255,0.85))`,
      }}
      aria-hidden={size !== "lg"}
      aria-label={size === "lg" ? `Avatar de ${name}` : undefined}
    >
      <span className="profile-avatar-image__initials">{initials}</span>
    </span>
  );
}
