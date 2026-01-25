import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReaderSettings } from "@/types";

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
  persist(
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
    }),
    {
      name: "read-review-settings",
      // Only persist settings, not functions
      partialize: (state) => ({
        reader: state.reader,
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
        autoDetectClipboard: state.autoDetectClipboard,
        showCaptureNotifications: state.showCaptureNotifications,
        autoCleanupDays: state.autoCleanupDays,
        maxStorageGB: state.maxStorageGB,
      }),
      // Skip hydration during SSR
      skipHydration: true,
    }
  )
);

// System theme change listener will be handled by ThemeProvider
