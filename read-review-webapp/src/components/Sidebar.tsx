"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ItemStatus } from "@/types";
import { useItemStats } from "@/hooks/useItems";
import { useTheme } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  status?: ItemStatus;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function Sidebar({ collapsed, onItemClick }: SidebarProps) {
  const stats = useItemStats();
  const { toggleTheme, isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    {
      id: "inbox",
      label: "Inbox",
      status: ItemStatus.INBOX,
      icon: InboxIcon,
      count: stats.inboxCount,
    },
    {
      id: "later",
      label: "Later",
      status: ItemStatus.LATER,
      icon: ClockIcon,
      count: stats.laterCount,
    },
    {
      id: "shortlist",
      label: "Shortlist",
      status: ItemStatus.SHORTLIST,
      icon: StarIcon,
      count: stats.shortlistCount,
    },
    {
      id: "archived",
      label: "Archived",
      status: ItemStatus.ARCHIVED,
      icon: ArchiveIcon,
      count: stats.archivedCount,
    },
  ];

  const handleItemClick = (item: NavItem) => {
    // TODO: Navigate to the appropriate view
    console.log("Navigate to:", item.id);
    onItemClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center px-4 py-4 border-b border-foreground-tertiary/20">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <span className="font-semibold">Read/Review</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">RR</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
              "hover:bg-background-tertiary transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent/50"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
            
            {!collapsed && (
              <>
                <span className="flex-1 font-medium">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-foreground-tertiary/15 text-foreground-secondary rounded-full">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </button>
        ))}

        {/* Divider */}
        <div className="my-4 border-t border-foreground-tertiary/20" />

        {/* Additional nav items */}
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
            "hover:bg-background-tertiary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        >
          <TagIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
          {!collapsed && <span className="flex-1 font-medium">Tags</span>}
        </button>

        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
            "hover:bg-background-tertiary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        >
          <StatsIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
          {!collapsed && <span className="flex-1 font-medium">Statistics</span>}
        </button>
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 border-t border-foreground-tertiary/20">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
            "hover:bg-background-tertiary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        >
          {mounted ? (
            isDark ? (
              <SunIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
            ) : (
              <MoonIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
            )
          ) : (
            // Default to moon icon during SSR to match most likely client state
            <MoonIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
          )}
          {!collapsed && (
            <span className="flex-1 font-medium">
              {mounted ? (isDark ? "Light Mode" : "Dark Mode") : "Toggle Theme"}
            </span>
          )}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
            "hover:bg-background-tertiary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        >
          <SettingsIcon className="w-5 h-5 flex-shrink-0 text-foreground-secondary" />
          {!collapsed && <span className="flex-1 font-medium">Settings</span>}
        </Link>
      </div>
    </div>
  );
}

// Icons
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18"/>
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41"/>
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
