import {
  loadProfileStudySettings,
  PROFILE_THEMES,
  saveProfileStudySettings,
  type ProfileTheme,
} from "@/lib/profile/study-preferences-storage";

export const APP_THEME_STORAGE_KEY = "memoria-theme";
export const APP_THEME_CHANGE_EVENT = "memoria-theme-change";

export function readDarkModePreference(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (saved === "light") return false;
  if (saved === "dark") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDarkMode(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  window.localStorage.setItem(APP_THEME_STORAGE_KEY, dark ? "dark" : "light");
  window.dispatchEvent(new CustomEvent(APP_THEME_CHANGE_EVENT, { detail: { dark } }));
}

export function readProfileTheme(): ProfileTheme {
  return loadProfileStudySettings().theme;
}

export function applyProfileTheme(theme: ProfileTheme) {
  if (typeof document === "undefined") return;
  const valid = theme in PROFILE_THEMES ? theme : "cyan";
  document.documentElement.dataset.profileTheme = valid;
  window.dispatchEvent(new CustomEvent(APP_THEME_CHANGE_EVENT, { detail: { profileTheme: valid } }));
}

export function setProfileTheme(theme: ProfileTheme) {
  const settings = loadProfileStudySettings();
  saveProfileStudySettings({ ...settings, theme });
  applyProfileTheme(theme);
}

export function initializeAppTheme() {
  if (typeof document === "undefined") return;
  applyDarkMode(readDarkModePreference());
  applyProfileTheme(readProfileTheme());
}
