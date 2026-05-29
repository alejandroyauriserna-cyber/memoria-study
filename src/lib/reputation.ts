export type ReputationLevel = {
  name: string;
  emoji: string;
  threshold: number;
};

export const reputationLevels: ReputationLevel[] = [
  { name: "Novato Jurídico", emoji: "🥉", threshold: 0 },
  { name: "Colaborador", emoji: "🥈", threshold: 100 },
  { name: "Investigador", emoji: "🥈", threshold: 250 },
  { name: "Mentor", emoji: "🥇", threshold: 500 },
  { name: "Jurista Destacado", emoji: "🏆", threshold: 1000 },
];

export function computeReputation(points: number) {
  const current = [...reputationLevels].reverse().find((level) => points >= level.threshold) ?? reputationLevels[0];
  const next = reputationLevels.find((level) => level.threshold > current.threshold);
  const progress = next
    ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  return {
    level: current.name,
    emoji: current.emoji,
    points,
    progress,
    nextThreshold: next?.threshold ?? current.threshold,
  };
}

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
};

export function computeBadges(stats: {
  totalShared: number;
  totalLikes: number;
  totalDownloads: number;
  totalOrganizers: number;
  specialtyCourses: string[];
}) {
  const badges: Badge[] = [
    {
      id: "first-share",
      label: "Primer aporte",
      description: "Has compartido tu primer material en la comunidad.",
      earned: stats.totalShared >= 1,
    },
    {
      id: "10-shares",
      label: "10 materiales compartidos",
      description: "Has compartido 10 materiales académicos.",
      earned: stats.totalShared >= 10,
    },
    {
      id: "50-likes",
      label: "50 likes recibidos",
      description: "Tus materiales han recibido 50 likes.",
      earned: stats.totalLikes >= 50,
    },
    {
      id: "100-downloads",
      label: "100 descargas",
      description: "Tus materiales han sido descargados 100 veces.",
      earned: stats.totalDownloads >= 100,
    },
    {
      id: "first-organizer",
      label: "Primer organizador visual",
      description: "Has generado tu primer organizador con IA.",
      earned: stats.totalOrganizers >= 1,
    },
  ];

  const specialtyBadges = [
    {
      id: "civilista",
      label: "Civilista",
      description: "Material destacado en Derecho Civil.",
      earned: stats.specialtyCourses.some((course) => /civil/i.test(course)),
    },
    {
      id: "penalista",
      label: "Penalista",
      description: "Material destacado en Derecho Penal.",
      earned: stats.specialtyCourses.some((course) => /penal/i.test(course)),
    },
    {
      id: "constitucionalista",
      label: "Constitucionalista",
      description: "Material destacado en Derecho Constitucional.",
      earned: stats.specialtyCourses.some((course) => /constitucional/i.test(course)),
    },
    {
      id: "procesalista",
      label: "Procesalista",
      description: "Material destacado en Derecho Procesal.",
      earned: stats.specialtyCourses.some((course) => /procesal/i.test(course)),
    },
    {
      id: "tributarista",
      label: "Tributarista",
      description: "Material destacado en Derecho Tributario.",
      earned: stats.specialtyCourses.some((course) => /tributar/i.test(course)),
    },
    {
      id: "internacionalista",
      label: "Internacionalista",
      description: "Material destacado en Derecho Internacional.",
      earned: stats.specialtyCourses.some((course) => /internacional/i.test(course)),
    },
  ];

  return [...badges, ...specialtyBadges];
}
