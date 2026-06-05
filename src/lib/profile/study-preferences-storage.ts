export type StudyPreferenceKey = "conceptMaps" | "flashcards" | "exams" | "practicalCases";

export type ProfileTheme =
  | "cyan"
  | "ocean"
  | "amber"
  | "violet"
  | "emerald"
  | "rose"
  | "mint"
  | "coral"
  | "indigo"
  | "lime";

export type StudyPreferences = Record<StudyPreferenceKey, boolean>;

export type AcademicGoal = {
  id: string;
  label: string;
  completed: boolean;
  createdAt: number;
};

export type ProfileStudySettings = {
  preferences: StudyPreferences;
  theme: ProfileTheme;
  goals: AcademicGoal[];
};

const STORAGE_KEY = "memoria-profile-study-settings";

export const DEFAULT_PREFERENCES: StudyPreferences = {
  conceptMaps: true,
  flashcards: true,
  exams: true,
  practicalCases: true,
};

export const PROFILE_THEMES: Record<
  ProfileTheme,
  { label: string; accent: string; glow: string; gradient: string }
> = {
  cyan: {
    label: "Tron Cyan",
    accent: "#00FFD5",
    glow: "rgba(0,255,213,0.35)",
    gradient: "from-[#00FFD5] to-[#00BFFF]",
  },
  ocean: {
    label: "Océano",
    accent: "#00BFFF",
    glow: "rgba(0,191,255,0.35)",
    gradient: "from-[#00BFFF] to-[#6366F1]",
  },
  amber: {
    label: "Ámbar",
    accent: "#FF8A00",
    glow: "rgba(255,138,0,0.35)",
    gradient: "from-[#FF8A00] to-[#FF5C00]",
  },
  violet: {
    label: "Violeta",
    accent: "#A78BFA",
    glow: "rgba(167,139,250,0.35)",
    gradient: "from-[#A78BFA] to-[#6366F1]",
  },
  emerald: {
    label: "Esmeralda",
    accent: "#34D399",
    glow: "rgba(52,211,153,0.35)",
    gradient: "from-[#34D399] to-[#10B981]",
  },
  rose: {
    label: "Rosa",
    accent: "#FB7185",
    glow: "rgba(251,113,133,0.35)",
    gradient: "from-[#FB7185] to-[#F43F5E]",
  },
  mint: {
    label: "Menta",
    accent: "#5EEAD4",
    glow: "rgba(94,234,212,0.35)",
    gradient: "from-[#5EEAD4] to-[#2DD4BF]",
  },
  coral: {
    label: "Coral",
    accent: "#FF7F6E",
    glow: "rgba(255,127,110,0.35)",
    gradient: "from-[#FF7F6E] to-[#FF5C5C]",
  },
  indigo: {
    label: "Índigo",
    accent: "#818CF8",
    glow: "rgba(129,140,248,0.35)",
    gradient: "from-[#818CF8] to-[#6366F1]",
  },
  lime: {
    label: "Lima",
    accent: "#A3E635",
    glow: "rgba(163,230,53,0.35)",
    gradient: "from-[#A3E635] to-[#84CC16]",
  },
};

export function isValidProfileTheme(value: unknown): value is ProfileTheme {
  return typeof value === "string" && value in PROFILE_THEMES;
}

export function loadProfileStudySettings(): ProfileStudySettings {
  if (typeof window === "undefined") {
    return { preferences: DEFAULT_PREFERENCES, theme: "cyan", goals: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { preferences: DEFAULT_PREFERENCES, theme: "cyan", goals: [] };
    }
    const parsed = JSON.parse(raw) as Partial<ProfileStudySettings>;
    return {
      preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
      theme: isValidProfileTheme(parsed.theme) ? parsed.theme : "cyan",
      goals: parsed.goals ?? [],
    };
  } catch {
    return { preferences: DEFAULT_PREFERENCES, theme: "cyan", goals: [] };
  }
}

export function saveProfileStudySettings(settings: ProfileStudySettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function createGoal(label: string): AcademicGoal {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    completed: false,
    createdAt: Date.now(),
  };
}
