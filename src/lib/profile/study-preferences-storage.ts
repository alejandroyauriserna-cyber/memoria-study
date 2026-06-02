export type StudyPreferenceKey = "conceptMaps" | "flashcards" | "exams" | "practicalCases";

export type ProfileTheme = "cyan" | "ocean" | "amber" | "violet";

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
};

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
      theme: parsed.theme ?? "cyan",
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
