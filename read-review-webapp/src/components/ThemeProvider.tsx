"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const darkMode = useSettingsStore(state => state.darkMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Clear existing theme classes
    root.classList.remove("dark");
    
    if (darkMode === "dark") {
      root.classList.add("dark");
    } else if (darkMode === "light") {
      // Light mode is default, no class needed
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      }
    }
  }, [mounted, darkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || darkMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove("dark");
      if (mediaQuery.matches) {
        root.classList.add("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, darkMode]);

  // Don't hide content - just render immediately
  return <>{children}</>;
}
