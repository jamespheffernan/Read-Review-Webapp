import { useSettingsStore } from "@/stores/settings";

// Main settings hook
export function useSettings() {
  const store = useSettingsStore();

  return {
    // Reader settings
    reader: store.reader,
    updateReaderSettings: store.updateReaderSettings,

    // UI preferences
    sidebarCollapsed: store.sidebarCollapsed,
    toggleSidebar: store.toggleSidebar,
    setSidebarCollapsed: store.setSidebarCollapsed,

    // Theme
    darkMode: store.darkMode,
    setDarkMode: store.setDarkMode,

    // Capture settings
    autoDetectClipboard: store.autoDetectClipboard,
    setAutoDetectClipboard: store.setAutoDetectClipboard,
    showCaptureNotifications: store.showCaptureNotifications,
    setShowCaptureNotifications: store.setShowCaptureNotifications,

    // Storage settings
    autoCleanupDays: store.autoCleanupDays,
    setAutoCleanupDays: store.setAutoCleanupDays,
    maxStorageGB: store.maxStorageGB,
    setMaxStorageGB: store.setMaxStorageGB,

    // Utilities
    resetToDefaults: store.resetToDefaults,
  };
}

// Hook specifically for reader settings
export function useReaderSettings() {
  const store = useSettingsStore();

  const increaseFontSize = () => {
    const current = store.reader.fontSize;
    const newSize = Math.min(current + 2, 24); // Max 24px
    store.updateReaderSettings({ fontSize: newSize });
  };

  const decreaseFontSize = () => {
    const current = store.reader.fontSize;
    const newSize = Math.max(current - 2, 16); // Min 16px
    store.updateReaderSettings({ fontSize: newSize });
  };

  const resetFontSize = () => {
    store.updateReaderSettings({ fontSize: 18 });
  };

  return {
    ...store.reader,
    updateSettings: store.updateReaderSettings,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  };
}

// Hook for theme management
export function useTheme() {
  const store = useSettingsStore();

  const toggleTheme = () => {
    const current = store.darkMode;
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    store.setDarkMode(next);
  };

  const isDark = () => {
    if (store.darkMode === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return false; // Default to light mode during SSR
    }
    return store.darkMode === "dark";
  };

  return {
    mode: store.darkMode,
    setMode: store.setDarkMode,
    toggleTheme,
    isDark: isDark(),
  };
}

// Hook for sidebar management
export function useSidebar() {
  const store = useSettingsStore();

  return {
    collapsed: store.sidebarCollapsed,
    toggle: store.toggleSidebar,
    collapse: () => store.setSidebarCollapsed(true),
    expand: () => store.setSidebarCollapsed(false),
  };
}
