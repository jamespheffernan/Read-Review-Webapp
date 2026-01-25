"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useSettings } from "@/hooks/useSettings";
import { BookmarkletInstructions } from "@/components/BookmarkletInstructions";

export default function SettingsPage() {
  const {
    // Theme
    darkMode,
    setDarkMode,
    
    // Reader settings
    reader,
    updateReaderSettings,
    
    // UI preferences
    sidebarCollapsed,
    setSidebarCollapsed,
    
    // Capture settings
    autoDetectClipboard,
    setAutoDetectClipboard,
    showCaptureNotifications,
    setShowCaptureNotifications,
    
    // Storage settings
    autoCleanupDays,
    setAutoCleanupDays,
    maxStorageGB,
    setMaxStorageGB,
    
    // Utilities
    resetToDefaults,
  } = useSettings();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 animate-spin">
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-foreground-secondary">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-foreground-tertiary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-sm text-foreground-secondary">
                Customize your reading experience
              </p>
            </div>
            
            <button 
              onClick={resetToDefaults}
              className="px-3 py-1.5 text-sm border border-foreground-tertiary/30 rounded-lg hover:bg-background-secondary transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
            
            {/* Theme Settings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="flex gap-2">
                    {[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "system", label: "System" }
                    ].map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setDarkMode(theme.value as "light" | "dark" | "system")}
                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                          darkMode === theme.value
                            ? "bg-accent text-white border-accent"
                            : "border-foreground-tertiary/30 hover:bg-background-secondary"
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Sidebar Collapsed</label>
                    <p className="text-xs text-foreground-secondary">Start with sidebar collapsed</p>
                  </div>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sidebarCollapsed ? "bg-accent" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sidebarCollapsed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Reader Settings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Reader</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="16"
                      max="24"
                      step="2"
                      value={reader.fontSize}
                      onChange={(e) => updateReaderSettings({ fontSize: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{reader.fontSize}px</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Line Height</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1.2"
                      max="2.0"
                      step="0.1"
                      value={reader.lineHeight}
                      onChange={(e) => updateReaderSettings({ lineHeight: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{reader.lineHeight}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Max Width</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="600"
                      max="1000"
                      step="50"
                      value={reader.maxWidth}
                      onChange={(e) => updateReaderSettings({ maxWidth: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{reader.maxWidth}px</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Serif Font</label>
                    <p className="text-xs text-foreground-secondary">Use serif font for reading</p>
                  </div>
                  <button
                    onClick={() => updateReaderSettings({ fontFamily: reader.fontFamily === "serif" ? "sans-serif" : "serif" })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      reader.fontFamily === "serif" ? "bg-accent" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reader.fontFamily === "serif" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Capture Settings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Capture</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Auto-detect Clipboard</label>
                    <p className="text-xs text-foreground-secondary">Automatically capture URLs from clipboard</p>
                  </div>
                  <button
                    onClick={() => setAutoDetectClipboard(!autoDetectClipboard)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoDetectClipboard ? "bg-accent" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoDetectClipboard ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Show Capture Notifications</label>
                    <p className="text-xs text-foreground-secondary">Show notifications when items are captured</p>
                  </div>
                  <button
                    onClick={() => setShowCaptureNotifications(!showCaptureNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showCaptureNotifications ? "bg-accent" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showCaptureNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Browser Integration */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Browser Integration</h2>
              <BookmarkletInstructions />
            </section>

            {/* Storage Settings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Storage</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Auto-cleanup After (Days)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="365"
                      step="30"
                      value={autoCleanupDays}
                      onChange={(e) => setAutoCleanupDays(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{autoCleanupDays} days</span>
                  </div>
                  <p className="text-xs text-foreground-secondary mt-1">
                    Automatically delete archived items older than this
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Max Storage (GB)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={maxStorageGB}
                      onChange={(e) => setMaxStorageGB(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{maxStorageGB}GB</span>
                  </div>
                  <p className="text-xs text-foreground-secondary mt-1">
                    Maximum storage space for snapshots and attachments
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
