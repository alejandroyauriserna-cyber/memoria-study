export type RecentItemKind = "pdf" | "apunte" | "organizer" | "exam" | "chat";

export type RecentContinueItem = {
  id: string;
  kind: RecentItemKind;
  title: string;
  subtitle: string;
  href: string;
  at: string;
};

export type AiSuggestionAction = {
  id: string;
  label: string;
  href: string;
};

export type AiSuggestion = {
  id: string;
  context: string;
  sourceTitle: string;
  actions: AiSuggestionAction[];
};

export type MemoriaDashboardProps = {
  profileName: string;
  currentCycle: string;
  currentCycleNumber: number;
  career: string;
  activeCoursesCount: number;
  materialsThisWeek: number;
  studyHoursEstimate: number;
  totalShared: number;
  totalOrganizers: number;
  recentItems: RecentContinueItem[];
  suggestions: AiSuggestion[];
};
