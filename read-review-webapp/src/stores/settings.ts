import { create } from "zustand";
import { ReaderSettings } from "@/types";

const SETTINGS_STORAGE_KEY = "read-review-settings";

interface SettingsStore {
  // Reader settings
  reader: ReaderSettings;
  
  // UI preferences
  sidebarCollapsed: boolean;
  darkMode: "light" | "dark" | "system";
  
  // Capture settings
  autoDetectClipboard: boolean;
  showCaptureNotifications: boolean;
  
  // Storage settings
  autoCleanupDays: number;
  maxStorageGB: number;
  
  // Actions
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (mode: "light" | "dark" | "system") => void;
  setAutoDetectClipboard: (enabled: boolean) => void;
  setShowCaptureNotifications: (enabled: boolean) => void;
  setAutoCleanupDays: (days: number) => void;
  setMaxStorageGB: (gb: number) => void;
  
  // Reset to defaults
  resetToDefaults: () => void;
}

const defaultSettings: Omit<SettingsStore, 
  "updateReaderSettings" | "toggleSidebar" | "setSidebarCollapsed" | 
  "setDarkMode" | "setAutoDetectClipboard" | "setShowCaptureNotifications" |
  "setAutoCleanupDays" | "setMaxStorageGB" | "resetToDefaults"
> = {
  reader: {
    fontSize: 18,
    lineHeight: 1.6,
    maxWidth: 720,
    fontFamily: "sans-serif",
    theme: "system",
  },
  sidebarCollapsed: false,
  darkMode: "system",
  autoDetectClipboard: true,
  showCaptureNotifications: true,
  autoCleanupDays: 365,
  maxStorageGB: 2,
};

export const useSettingsStore = create<SettingsStore>()(
    (set, get) => ({
      ...defaultSettings,

      updateReaderSettings: (settings) => {
        const currentReader = get().reader;
        set({ 
          reader: { ...currentReader, ...settings } 
        });
      },

      toggleSidebar: () => {
        set({ sidebarCollapsed: !get().sidebarCollapsed });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      setDarkMode: (mode) => {
        set({ darkMode: mode });
      },

      setAutoDetectClipboard: (enabled) => {
        set({ autoDetectClipboard: enabled });
      },

      setShowCaptureNotifications: (enabled) => {
        set({ showCaptureNotifications: enabled });
      },

      setAutoCleanupDays: (days) => {
        set({ autoCleanupDays: days });
      },

      setMaxStorageGB: (gb) => {
        set({ maxStorageGB: gb });
      },

      resetToDefaults: () => {
        set(defaultSettings);
      },
    })
);

type PersistedSettings = Pick<
  SettingsStore,
  | "reader"
  | "sidebarCollapsed"
  | "darkMode"
  | "autoDetectClipboard"
  | "showCaptureNotifications"
  | "autoCleanupDays"
  | "maxStorageGB"
>;

const persistableSettings = (state: SettingsStore): PersistedSettings => ({
  reader: state.reader,
  sidebarCollapsed: state.sidebarCollapsed,
  darkMode: state.darkMode,
  autoDetectClipboard: state.autoDetectClipboard,
  showCaptureNotifications: state.showCaptureNotifications,
  autoCleanupDays: state.autoCleanupDays,
  maxStorageGB: state.maxStorageGB,
});

export function startSettingsPersistence(): () => void {
  if (typeof window === "undefined") return () => undefined;

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PersistedSettings>;
      useSettingsStore.setState((current) => ({
        ...current,
        ...parsed,
        reader: { ...current.reader, ...parsed.reader },
      }));
    }
  } catch (error) {
    console.warn("Unable to restore reader settings:", error);
  }

  return useSettingsStore.subscribe((state) => {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(persistableSettings(state)),
      );
    } catch (error) {
      console.warn("Unable to persist reader settings:", error);
    }
  });
}

// System theme change listener will be handled by ThemeProvider
